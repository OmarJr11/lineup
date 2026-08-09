jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
}));

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { GeminiService } from './gemini.service';

/**
 * Unit tests for {@link GeminiService}.
 */
describe('GeminiService', () => {
  const generateContentMock = jest.fn();
  const configServiceMock = {
    get: jest.fn((key: string): string | undefined => {
      if (key === 'GEMINI_API_KEY') {
        return 'test-api-key';
      }
      if (key === 'GEMINI_MODEL') {
        return 'gemini-test-model';
      }
      return undefined;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    generateContentMock.mockResolvedValue({ text: 'ok' });
    (GoogleGenAI as jest.Mock).mockImplementation(() => ({
      models: {
        generateContent: generateContentMock,
      },
    }));
  });

  it('throws when GEMINI_API_KEY is missing', async () => {
    const badConfig = {
      get: jest.fn((key: string): string | undefined =>
        key === 'GEMINI_MODEL' ? 'm' : undefined,
      ),
    };
    await expect(
      Test.createTestingModule({
        providers: [
          GeminiService,
          { provide: ConfigService, useValue: badConfig },
        ],
      }).compile(),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('throws when GEMINI_MODEL is missing', async () => {
    const badConfig = {
      get: jest.fn((key: string): string | undefined =>
        key === 'GEMINI_API_KEY' ? 'k' : undefined,
      ),
    };
    await expect(
      Test.createTestingModule({
        providers: [
          GeminiService,
          { provide: ConfigService, useValue: badConfig },
        ],
      }).compile(),
    ).rejects.toThrow(InternalServerErrorException);
  });

  describe('generateContent', () => {
    let service: GeminiService;

    beforeEach(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          GeminiService,
          { provide: ConfigService, useValue: configServiceMock },
        ],
      }).compile();
      service = moduleRef.get(GeminiService);
    });

    it('returns text from Gemini response', async () => {
      generateContentMock.mockResolvedValueOnce({ text: 'hello world' });
      const result = await service.generateContent({
        contents: 'prompt',
      });
      expect(result.text).toBe('hello world');
      expect(generateContentMock).toHaveBeenCalled();
    });

    it('throws BadRequestException when contents is empty', async () => {
      await expect(
        service.generateContent({ contents: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException when Gemini fails', async () => {
      generateContentMock.mockRejectedValueOnce(new Error('api'));
      await expect(
        service.generateContent({ contents: 'x' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
