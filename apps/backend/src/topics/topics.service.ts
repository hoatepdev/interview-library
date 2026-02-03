import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../database/entities/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TranslationService, Locale } from '../i18n/translation.service';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    private readonly translationService: TranslationService,
  ) {}

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    // Auto-generate slug from name if not provided
    if (!createTopicDto.slug) {
      createTopicDto.slug = this.generateSlug(createTopicDto.name);
    }
    const topic = this.topicRepository.create(createTopicDto);
    return this.topicRepository.save(topic);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '')      // Remove non-alphanumeric chars except hyphens
      .replace(/-+/g, '-')             // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '');        // Remove leading/trailing hyphens
  }

  async findAll(locale: Locale = 'en'): Promise<any[]> {
    const topics = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.translations', 'translation')
      .loadRelationCountAndMap('topic.questionsCount', 'topic.questions')
      .orderBy('topic.name', 'ASC')
      .getMany();

    // Format with translations and include questions count
    return topics.map(topic => ({
      ...this.translationService.formatTopic(topic, locale).data,
      questionsCount: (topic as any).questionsCount || 0,
    }));
  }

  async findOne(id: string, locale: Locale = 'en'): Promise<any> {
    const topic = await this.topicRepository
      .createQueryBuilder('topic')
      .where('topic.id = :id', { id })
      .leftJoinAndSelect('topic.translations', 'translation')
      .loadRelationCountAndMap('topic.questionsCount', 'topic.questions')
      .getOne();

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    return {
      ...this.translationService.formatTopic(topic, locale).data,
      questionsCount: (topic as any).questionsCount || 0,
    };
  }

  async findBySlug(slug: string, locale: Locale = 'en'): Promise<any> {
    const topic = await this.topicRepository
      .createQueryBuilder('topic')
      .where('topic.slug = :slug', { slug })
      .leftJoinAndSelect('topic.translations', 'translation')
      .loadRelationCountAndMap('topic.questionsCount', 'topic.questions')
      .getOne();

    if (!topic) {
      throw new NotFoundException(`Topic with slug ${slug} not found`);
    }
    return {
      ...this.translationService.formatTopic(topic, locale).data,
      questionsCount: (topic as any).questionsCount || 0,
    };
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: ['translations'],
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    // Auto-generate slug from name if name changed and slug not provided
    if (updateTopicDto.name && !updateTopicDto.slug) {
      updateTopicDto.slug = this.generateSlug(updateTopicDto.name);
    }
    Object.assign(topic, updateTopicDto);
    return this.topicRepository.save(topic);
  }

  async remove(id: string): Promise<void> {
    const topic = await this.topicRepository.findOne({
      where: { id },
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    await this.topicRepository.remove(topic);
  }

  // Helper to get translated name
  getTranslatedName(topic: Topic, locale: Locale = 'en'): string {
    return this.translationService.getTopicName(topic, locale);
  }
}
