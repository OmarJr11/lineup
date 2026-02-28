import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { LogError } from '../../common/helpers/logger.helper';
import {
  IGenerateContentConfig,
  IGenerateContentInput,
  IGenerateContentOutput,
} from './interfaces/generate-content.interface';
import { geminiResponses } from '../../common/responses';

/**
 * Service for interacting with Google Gemini API.
 * Provides methods for generating content, streaming, and chat interactions.
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly rConfig = geminiResponses.config;
  private readonly rGenerateContent = geminiResponses.generateContent;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model = this.configService.get<string>('GEMINI_MODEL');

    if (!this.apiKey) {
      LogError(this.logger, this.rConfig.apiKeyNotSet.message, this.constructor.name);
      throw new InternalServerErrorException(this.rConfig.apiKeyNotSet);
    }

    if (!this.model) {
      LogError(this.logger, this.rConfig.modelNotSet.message, this.constructor.name);
      throw new InternalServerErrorException(this.rConfig.modelNotSet);
    }

    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  /**
   * Generates content from a text prompt
   *
   * @param {IGenerateContentInput} input - Input parameters for generation
   * @returns {Promise<IGenerateContentOutput>} Generated text and metadata
   */
  async generateContent(input: IGenerateContentInput): Promise<IGenerateContentOutput> {
    const { contents, model = this.model, systemInstruction, config } = input;
    if (!contents || typeof contents !== 'string') {
      LogError(this.logger, this.rGenerateContent.invalidContent.message, this.generateContent.name);
      throw new BadRequestException(this.rGenerateContent.invalidContent);
    }

    try {
      const requestConfig = this.buildRequestConfig(config, systemInstruction);
      const response = await this.client.models
        .generateContent({ model, contents, config: requestConfig });
      const text = response.text ?? '';
      return { text, rawResponse: response };
    } catch (error) {
      LogError(this.logger, error, this.generateContent.name);
      throw new InternalServerErrorException(this.rGenerateContent.error);
    }
  }

  /**
   * Builds the request config from input options
   *
   * @param {IGenerateContentConfig} config - Optional generation config
   * @param {string} systemInstruction - Optional system instruction
   * @returns {object} Config object for Gemini API
   */
  private buildRequestConfig(
    config?: IGenerateContentConfig,
    systemInstruction?: string
  ): object {
    const result: Record<string, unknown> = {};

    if (systemInstruction) {
      result.systemInstruction = systemInstruction;
    }

    if (!config) return result;

    if (config.temperature !== undefined) result.temperature = config.temperature;
    if (config.maxOutputTokens !== undefined) result.maxOutputTokens = config.maxOutputTokens;
    if (config.topP !== undefined) result.topP = config.topP;
    if (config.topK !== undefined) result.topK = config.topK;

    return result;
  }
}
