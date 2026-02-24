import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question, QuestionLevel } from '../database/entities/question.entity';
import { Topic } from '../database/entities/topic.entity';
import { User } from '../database/entities/user.entity';
import { ContentStatus } from '../common/enums/content-status.enum';
import { QuestionsService } from './questions.service';
import { ExportQuestionsDto } from './dto/export-questions.dto';

interface ExportQuestionRow {
  title: string;
  content: string;
  answer: string | null;
  topicName: string;
  topicSlug: string;
  level: string;
}

interface ImportQuestionRow {
  title: string;
  content: string;
  answer?: string;
  topicName?: string;
  topicSlug?: string;
  level?: string;
}

interface ImportError {
  row: number;
  field?: string;
  message: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
}

@Injectable()
export class QuestionExportImportService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    private readonly questionsService: QuestionsService,
  ) {}

  async exportQuestions(filters: ExportQuestionsDto): Promise<ExportQuestionRow[]> {
    const where: any = { contentStatus: ContentStatus.APPROVED };
    if (filters.topicId) where.topicId = filters.topicId;
    if (filters.level) where.level = filters.level;

    const questions = await this.questionRepository.find({
      where,
      relations: ['topic'],
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    return questions.map((q) => ({
      title: q.title,
      content: q.content,
      answer: q.answer ?? null,
      topicName: q.topic?.name ?? '',
      topicSlug: q.topic?.slug ?? '',
      level: q.level,
    }));
  }

  formatAsJson(data: ExportQuestionRow[]): string {
    return JSON.stringify(data, null, 2);
  }

  formatAsCsv(data: ExportQuestionRow[]): string {
    const headers = ['title', 'content', 'answer', 'topicName', 'topicSlug', 'level'];
    const lines = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((h) => this.escapeCsvField(row[h] ?? ''));
      lines.push(values.join(','));
    }

    return '\uFEFF' + lines.join('\n');
  }

  parseJsonImport(content: string): ImportQuestionRow[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }

    if (!Array.isArray(parsed)) {
      throw new BadRequestException('JSON must be an array of question objects');
    }

    return parsed.map((item: any) => ({
      title: String(item.title ?? ''),
      content: String(item.content ?? ''),
      answer: item.answer != null ? String(item.answer) : undefined,
      topicName: item.topicName != null ? String(item.topicName) : undefined,
      topicSlug: item.topicSlug != null ? String(item.topicSlug) : undefined,
      level: item.level != null ? String(item.level) : undefined,
    }));
  }

  parseCsvImport(content: string): ImportQuestionRow[] {
    // Strip BOM if present
    const cleaned = content.replace(/^\uFEFF/, '');
    const lines = this.parseCsvLines(cleaned);

    if (lines.length < 2) {
      throw new BadRequestException('CSV must have a header row and at least one data row');
    }

    const headers = lines[0].map((h) => h.trim().toLowerCase());
    const titleIdx = headers.indexOf('title');
    const contentIdx = headers.indexOf('content');

    if (titleIdx === -1 || contentIdx === -1) {
      throw new BadRequestException('CSV missing required columns: title, content');
    }

    const answerIdx = headers.indexOf('answer');
    const topicNameIdx = headers.indexOf('topicname');
    const topicSlugIdx = headers.indexOf('topicslug');
    const levelIdx = headers.indexOf('level');

    return lines.slice(1).map((fields) => ({
      title: fields[titleIdx]?.trim() ?? '',
      content: fields[contentIdx]?.trim() ?? '',
      answer: answerIdx >= 0 ? fields[answerIdx]?.trim() : undefined,
      topicName: topicNameIdx >= 0 ? fields[topicNameIdx]?.trim() : undefined,
      topicSlug: topicSlugIdx >= 0 ? fields[topicSlugIdx]?.trim() : undefined,
      level: levelIdx >= 0 ? fields[levelIdx]?.trim() : undefined,
    }));
  }

  async importQuestions(rows: ImportQuestionRow[], user: User): Promise<ImportResult> {
    const topics = await this.topicRepository.find({
      where: { contentStatus: ContentStatus.APPROVED },
    });
    const slugMap = new Map<string, Topic>(topics.map((t) => [t.slug.toLowerCase(), t]));
    const nameMap = new Map<string, Topic>(topics.map((t) => [t.name.toLowerCase(), t]));

    const validLevels = new Set(Object.values(QuestionLevel));
    const errors: ImportError[] = [];
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      if (!row.title?.trim()) {
        errors.push({ row: rowNum, field: 'title', message: 'Title is required' });
        skipped++;
        continue;
      }

      if (!row.content?.trim()) {
        errors.push({ row: rowNum, field: 'content', message: 'Content is required' });
        skipped++;
        continue;
      }

      // Resolve topic
      let topic: Topic | undefined;
      if (row.topicSlug) {
        topic = slugMap.get(row.topicSlug.toLowerCase());
      }
      if (!topic && row.topicName) {
        topic = nameMap.get(row.topicName.toLowerCase());
      }

      if (!topic) {
        const identifier = row.topicSlug || row.topicName || '(empty)';
        errors.push({ row: rowNum, field: 'topicSlug', message: `Topic '${identifier}' not found` });
        skipped++;
        continue;
      }

      // Validate level
      const level = row.level?.toLowerCase();
      if (level && !validLevels.has(level as QuestionLevel)) {
        errors.push({
          row: rowNum,
          field: 'level',
          message: `Invalid level '${row.level}'. Must be one of: ${[...validLevels].join(', ')}`,
        });
        skipped++;
        continue;
      }

      try {
        await this.questionsService.create(
          {
            title: row.title.trim(),
            content: row.content.trim(),
            answer: row.answer?.trim() || undefined,
            topicId: topic.id,
            level: (level as QuestionLevel) || QuestionLevel.MIDDLE,
          },
          user,
        );
        imported++;
      } catch (err) {
        errors.push({ row: rowNum, message: err?.message || 'Failed to create question' });
        skipped++;
      }
    }

    return { imported, skipped, errors };
  }

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }

  /**
   * Parse CSV content into an array of field arrays, handling quoted fields
   * with embedded commas, newlines, and escaped quotes per RFC 4180.
   */
  private parseCsvLines(content: string): string[][] {
    const results: string[][] = [];
    let current: string[] = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while (i < content.length) {
      const ch = content[i];

      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < content.length && content[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            inQuotes = false;
            i++;
          }
        } else {
          field += ch;
          i++;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
        } else if (ch === ',') {
          current.push(field);
          field = '';
          i++;
        } else if (ch === '\r') {
          current.push(field);
          field = '';
          results.push(current);
          current = [];
          i++;
          if (i < content.length && content[i] === '\n') i++;
        } else if (ch === '\n') {
          current.push(field);
          field = '';
          results.push(current);
          current = [];
          i++;
        } else {
          field += ch;
          i++;
        }
      }
    }

    // Handle last field/row
    if (field || current.length > 0) {
      current.push(field);
      results.push(current);
    }

    return results;
  }
}
