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
    const topic = this.topicRepository.create(createTopicDto);
    return this.topicRepository.save(topic);
  }

  async findAll(locale: Locale = 'en'): Promise<any[]> {
    const topics = await this.topicRepository.find({
      relations: ['translations'],
      order: { name: 'ASC' },
    });

    // Format with translations
    return topics.map(topic => this.translationService.formatTopic(topic, locale).data);
  }

  async findOne(id: string, locale: Locale = 'en'): Promise<any> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: ['translations'],
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    return this.translationService.formatTopic(topic, locale).data;
  }

  async findBySlug(slug: string, locale: Locale = 'en'): Promise<any> {
    const topic = await this.topicRepository.findOne({
      where: { slug },
      relations: ['translations'],
    });
    if (!topic) {
      throw new NotFoundException(`Topic with slug ${slug} not found`);
    }
    return this.translationService.formatTopic(topic, locale).data;
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: ['translations'],
    });
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
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
