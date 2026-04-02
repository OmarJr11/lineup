import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { filesResponses } from '../../common/responses';
import { IFileInterface } from '../../common/interfaces';
import { GeminiService } from '../gemini/gemini.service';
import { CreateProductVariationInput } from '../products/dto/create-product-variation.input';
import { IImportedProductInput } from './dto/imported-product.input';
import {
  buildImportProductsPrompt,
  IMPORT_PRODUCTS_SYSTEM_INSTRUCTION,
  JSON_REPAIR_SYSTEM_INSTRUCTION,
} from '../../common/prompts/import-products.prompt';
import { LogError } from '../../common/helpers/logger.helper';

const BLOCKED_DOCUMENT_MIME_TYPE_PREFIXES: readonly string[] = [
  'image/',
  'video/',
  'audio/',
] as const;
const IMPORTABLE_DOCUMENT_EXTENSIONS: readonly string[] = [
  'pdf',
  'xml',
  'csv',
  'txt',
  'json',
  'xlsx',
  'xls',
] as const;
const TEXT_DOCUMENT_EXTENSIONS: readonly string[] = [
  'xml',
  'csv',
  'txt',
  'json',
] as const;
const CSV_EXTENSION = 'csv';
const MAX_CSV_ROWS_PER_CHUNK = 120;
const MAX_DOCUMENT_TEXT_CHARS = 1000000;
const MAX_DOCUMENT_BASE64_CHARS = 1500000;
const MAX_IMPORT_OUTPUT_TOKENS = 16384;
const MAX_REPAIR_OUTPUT_TOKENS = 4096;
const MAX_REPAIR_INPUT_CHARS = 120000;
const CSV_CHUNK_MIN_ROWS = 1;

/**
 * Handles document-based product import orchestration.
 */
@Injectable()
export class FilesImportsService {
  private readonly logger: Logger = new Logger(FilesImportsService.name);
  private readonly rUpload = filesResponses.upload;

  constructor(private readonly geminiService: GeminiService) {}

  /**
   * Extracts products from a business document using Gemini.
   * @param {IFileInterface} file Uploaded document file
   * @returns {Promise<IImportedProductInput[]>} Imported products without images
   */
  async uploadDocumentFile(
    file: IFileInterface,
  ): Promise<IImportedProductInput[]> {
    this.validateDocumentFile(file);
    const extension: string = this.getFileExtension(file.originalname);
    if (extension === CSV_EXTENSION) {
      return await this.uploadCsvDocumentFile(file);
    }
    const documentContent: string = this.buildDocumentContent(file);
    return await this.importProductsWithGemini(documentContent);
  }

  /**
   * Imports products using Gemini for generic documents.
   * @param {string} documentContent Prompt-ready content block
   * @returns {Promise<IImportedProductInput[]>} Imported products
   */
  private async importProductsWithGemini(
    documentContent: string,
  ): Promise<IImportedProductInput[]> {
    const prompt: string = buildImportProductsPrompt(documentContent);
    try {
      const result = await this.geminiService.generateContent({
        contents: prompt,
        systemInstruction: IMPORT_PRODUCTS_SYSTEM_INSTRUCTION,
        config: { temperature: 0.1, maxOutputTokens: MAX_IMPORT_OUTPUT_TOKENS },
      });
      return await this.parseImportedProducts(result.text);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      LogError(this.logger, error as Error, this.uploadDocumentFile.name);
      throw new InternalServerErrorException(this.rUpload.error);
    }
  }

  /**
   * Imports CSV products with Gemini in chunks to avoid output truncation.
   * @param {IFileInterface} file Uploaded CSV file
   * @returns {Promise<IImportedProductInput[]>} Imported products from all chunks
   */
  private async uploadCsvDocumentFile(
    file: IFileInterface,
  ): Promise<IImportedProductInput[]> {
    const csvText: string = file.buffer
      .toString('utf-8')
      .replace(/^\uFEFF/, '');
    const csvRows: string[] = this.splitCsvRows(csvText);
    if (csvRows.length <= 1) {
      return [];
    }
    const csvHeader: string = csvRows[0];
    const csvDataRows: string[] = csvRows
      .slice(1)
      .filter((row) => !!row.trim());
    const importedProducts: IImportedProductInput[] = [];
    for (
      let chunkStartIndex = 0;
      chunkStartIndex < csvDataRows.length;
      chunkStartIndex += MAX_CSV_ROWS_PER_CHUNK
    ) {
      const chunkRows: string[] = csvDataRows.slice(
        chunkStartIndex,
        chunkStartIndex + MAX_CSV_ROWS_PER_CHUNK,
      );
      const chunkProducts: IImportedProductInput[] =
        await this.importCsvChunkWithFallback({
          file,
          csvHeader,
          chunkRows,
          chunkLabel: `${chunkStartIndex / MAX_CSV_ROWS_PER_CHUNK + 1}`,
        });
      importedProducts.push(...chunkProducts);
    }
    return importedProducts;
  }

  /**
   * Imports one CSV chunk with Gemini. If parsing fails, retries with smaller chunks.
   * @param {Object} params Chunk import params
   * @param {IFileInterface} params.file Uploaded CSV file
   * @param {string} params.csvHeader CSV header row
   * @param {string[]} params.chunkRows CSV rows in current chunk
   * @param {string} params.chunkLabel Human-readable chunk label
   * @returns {Promise<IImportedProductInput[]>} Imported products from this chunk tree
   */
  private async importCsvChunkWithFallback(params: {
    file: IFileInterface;
    csvHeader: string;
    chunkRows: string[];
    chunkLabel: string;
  }): Promise<IImportedProductInput[]> {
    const { file, csvHeader, chunkRows, chunkLabel } = params;
    if (chunkRows.length < CSV_CHUNK_MIN_ROWS) {
      return [];
    }
    try {
      const documentContent: string = this.buildCsvChunkDocumentContent({
        file,
        csvHeader,
        chunkRows,
        chunkLabel,
      });
      const importedProducts: IImportedProductInput[] =
        await this.importProductsWithGemini(documentContent);
      if (importedProducts.length !== chunkRows.length) {
        throw new Error(
          `Chunk ${chunkLabel} expected ${chunkRows.length} products but received ${importedProducts.length}`,
        );
      }
      return importedProducts;
    } catch (error) {
      if (chunkRows.length === CSV_CHUNK_MIN_ROWS) {
        this.logger.warn(
          `Skipping unparsable CSV row in chunk ${chunkLabel}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return [];
      }
      const middleIndex: number = Math.ceil(chunkRows.length / 2);
      const leftRows: string[] = chunkRows.slice(0, middleIndex);
      const rightRows: string[] = chunkRows.slice(middleIndex);
      const leftProducts: IImportedProductInput[] =
        await this.importCsvChunkWithFallback({
          file,
          csvHeader,
          chunkRows: leftRows,
          chunkLabel: `${chunkLabel}.1`,
        });
      const rightProducts: IImportedProductInput[] =
        await this.importCsvChunkWithFallback({
          file,
          csvHeader,
          chunkRows: rightRows,
          chunkLabel: `${chunkLabel}.2`,
        });
      return [...leftProducts, ...rightProducts];
    }
  }

  /**
   * Builds prompt-ready document content for one CSV chunk.
   * @param {Object} params Chunk payload
   * @param {IFileInterface} params.file Uploaded CSV file
   * @param {string} params.csvHeader CSV header row
   * @param {string[]} params.chunkRows CSV rows
   * @param {string} params.chunkLabel Human-readable chunk label
   * @returns {string} Prompt-ready content
   */
  private buildCsvChunkDocumentContent(params: {
    file: IFileInterface;
    csvHeader: string;
    chunkRows: string[];
    chunkLabel: string;
  }): string {
    const { file, csvHeader, chunkRows, chunkLabel } = params;
    const chunkCsvContent: string = [csvHeader, ...chunkRows].join('\n');
    return (
      `filename: ${file.originalname}\n` +
      `mimeType: ${file.mimetype}\n` +
      `encoding: utf-8\n` +
      `chunk: ${chunkLabel}\n` +
      `expectedProducts: ${chunkRows.length}\n` +
      `important: return exactly ${chunkRows.length} products (one per data row in this chunk)\n` +
      `content:\n${chunkCsvContent}`
    );
  }

  /**
   * Validates if a file can be used for product import.
   * @param {IFileInterface} file Uploaded file
   * @returns {void}
   */
  private validateDocumentFile(file: IFileInterface): void {
    if (!file || !file.mimetype || !file.originalname || !file.buffer) {
      LogError(
        this.logger,
        this.rUpload.importFileRequired.message,
        this.validateDocumentFile.name,
      );
      throw new BadRequestException(this.rUpload.importFileRequired);
    }
    const isBlockedMimeType: boolean = BLOCKED_DOCUMENT_MIME_TYPE_PREFIXES.some(
      (prefix: string): boolean => file.mimetype.startsWith(prefix),
    );
    const extension: string = this.getFileExtension(file.originalname);
    const isAllowedExtension: boolean =
      IMPORTABLE_DOCUMENT_EXTENSIONS.includes(extension);
    if (isBlockedMimeType || !isAllowedExtension) {
      LogError(
        this.logger,
        this.rUpload.noAcceptableExtension.message,
        this.validateDocumentFile.name,
      );
      throw new NotAcceptableException(this.rUpload.noAcceptableExtension);
    }
  }

  /**
   * Builds the document payload string for Gemini.
   * @param {IFileInterface} file Uploaded file
   * @returns {string} Prompt-ready content block
   */
  private buildDocumentContent(file: IFileInterface): string {
    const extension: string = this.getFileExtension(file.originalname);
    const isTextDocument: boolean =
      TEXT_DOCUMENT_EXTENSIONS.includes(extension);
    if (isTextDocument) {
      const text: string = file.buffer
        .toString('utf-8')
        .slice(0, MAX_DOCUMENT_TEXT_CHARS);
      return `filename: ${file.originalname}\nmimeType: ${file.mimetype}\nencoding: utf-8\ncontent:\n${text}`;
    }
    const base64: string = file.buffer
      .toString('base64')
      .slice(0, MAX_DOCUMENT_BASE64_CHARS);
    return `filename: ${file.originalname}\nmimeType: ${file.mimetype}\nencoding: base64\ncontent:\n${base64}`;
  }

  /**
   * Parses Gemini response into product input objects.
   * @param {string} responseText Gemini raw response
   * @returns {IImportedProductInput[]} Parsed product array
   */
  private async parseImportedProducts(
    responseText: string,
  ): Promise<IImportedProductInput[]> {
    const normalizedResponseText: string = responseText.replace(/^\uFEFF/, '');
    const parsedProducts: unknown[] | null = this.tryParseProductsCollection(
      normalizedResponseText,
    );
    if (parsedProducts) {
      return parsedProducts.map(
        (product: unknown, index: number): IImportedProductInput =>
          this.mapImportedProduct(product, index),
      );
    }
    const jsonArrayText: string = this.extractJsonArrayText(
      normalizedResponseText,
    );
    if (!this.hasPotentialJsonStructure(jsonArrayText)) {
      LogError(
        this.logger,
        this.rUpload.importParseError.message,
        this.parseImportedProducts.name,
      );
      throw new NotAcceptableException(this.rUpload.importParseError);
    }
    const repairedJsonArrayText: string =
      await this.repairMalformedJsonArray(jsonArrayText);
    const repairedProducts: unknown[] | null = this.tryParseProductsCollection(
      repairedJsonArrayText,
    );
    if (!repairedProducts) {
      LogError(
        this.logger,
        this.rUpload.importParseError.message,
        this.parseImportedProducts.name,
      );
      throw new NotAcceptableException(this.rUpload.importParseError);
    }
    return repairedProducts.map(
      (product: unknown, index: number): IImportedProductInput =>
        this.mapImportedProduct(product, index),
    );
  }

  /**
   * Extracts JSON array content from plain or fenced output.
   * @param {string} responseText Gemini response text
   * @returns {string} JSON array text
   */
  private extractJsonArrayText(responseText: string): string {
    const trimmedResponse: string = responseText.trim();
    const normalizedResponse: string = trimmedResponse.startsWith('```')
      ? trimmedResponse
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/i, '')
          .trim()
      : trimmedResponse;
    const firstBracketIndex: number = normalizedResponse.indexOf('[');
    const lastBracketIndex: number = normalizedResponse.lastIndexOf(']');
    const hasArrayBounds: boolean =
      firstBracketIndex >= 0 && lastBracketIndex > firstBracketIndex;
    if (hasArrayBounds) {
      return normalizedResponse.slice(firstBracketIndex, lastBracketIndex + 1);
    }
    return normalizedResponse;
  }

  /**
   * Extracts JSON object content from plain or fenced output.
   * @param {string} responseText Gemini response text
   * @returns {string} JSON object text
   */
  private extractJsonObjectText(responseText: string): string {
    const trimmedResponse: string = responseText.trim();
    const normalizedResponse: string = trimmedResponse.startsWith('```')
      ? trimmedResponse
          .replace(/^```(?:json)?/i, '')
          .replace(/```$/i, '')
          .trim()
      : trimmedResponse;
    const firstCurlyIndex: number = normalizedResponse.indexOf('{');
    const lastCurlyIndex: number = normalizedResponse.lastIndexOf('}');
    const hasObjectBounds: boolean =
      firstCurlyIndex >= 0 && lastCurlyIndex > firstCurlyIndex;
    if (hasObjectBounds) {
      return normalizedResponse.slice(firstCurlyIndex, lastCurlyIndex + 1);
    }
    return normalizedResponse;
  }

  /**
   * Attempts to parse JSON array text.
   * @param {string} jsonArrayText Candidate JSON array text
   * @returns {unknown[] | null} Parsed array or null when invalid
   */
  private tryParseJsonArray(jsonArrayText: string): unknown[] | null {
    try {
      const parsed: unknown = JSON.parse(jsonArrayText);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Attempts to parse products from array, wrapped object, or string payload.
   * @param {string} responseText Candidate JSON text
   * @returns {unknown[] | null} Parsed products array or null when invalid
   */
  private tryParseProductsCollection(responseText: string): unknown[] | null {
    const arrayCandidate: unknown[] | null = this.tryParseJsonArray(
      this.extractJsonArrayText(responseText),
    );
    if (arrayCandidate) {
      return arrayCandidate;
    }
    const wrappedProducts: unknown[] | null =
      this.tryParseProductsFromWrappedObject(responseText);
    if (wrappedProducts) {
      return wrappedProducts;
    }
    return this.tryParseProductsFromStringLiteral(responseText);
  }

  /**
   * Attempts to parse products from object wrappers.
   * @param {string} responseText Candidate JSON text
   * @returns {unknown[] | null} Parsed products array or null when invalid
   */
  private tryParseProductsFromWrappedObject(
    responseText: string,
  ): unknown[] | null {
    const objectText: string = this.extractJsonObjectText(responseText);
    try {
      const parsed: unknown = JSON.parse(objectText);
      if (!this.isRecord(parsed)) {
        return null;
      }
      const productsKeys: readonly string[] = [
        'products',
        'items',
        'data',
      ] as const;
      for (const productsKey of productsKeys) {
        const candidate: unknown = parsed[productsKey];
        if (Array.isArray(candidate)) {
          return candidate;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Attempts to parse products when Gemini returns serialized JSON text.
   * @param {string} responseText Candidate JSON text
   * @returns {unknown[] | null} Parsed products array or null when invalid
   */
  private tryParseProductsFromStringLiteral(
    responseText: string,
  ): unknown[] | null {
    try {
      const parsed: unknown = JSON.parse(responseText);
      if (typeof parsed !== 'string') {
        return null;
      }
      return this.tryParseProductsCollection(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Requests Gemini to repair malformed JSON array text.
   * @param {string} malformedJsonArrayText Malformed JSON array text
   * @returns {Promise<string>} Repaired JSON array text
   */
  private async repairMalformedJsonArray(
    malformedJsonArrayText: string,
  ): Promise<string> {
    const repairSourceText: string = malformedJsonArrayText.slice(
      0,
      MAX_REPAIR_INPUT_CHARS,
    );
    const repairPrompt: string = `Repair this malformed JSON array and return only valid JSON array text:\n${repairSourceText}`;
    const repairResult = await this.geminiService.generateContent({
      contents: repairPrompt,
      systemInstruction: JSON_REPAIR_SYSTEM_INSTRUCTION,
      config: { temperature: 0, maxOutputTokens: MAX_REPAIR_OUTPUT_TOKENS },
    });
    return this.extractJsonArrayText(repairResult.text);
  }

  /**
   * Checks if raw text still contains JSON-like markers before repair.
   * @param {string} sourceText Candidate raw text
   * @returns {boolean} True when text can still be repaired to JSON
   */
  private hasPotentialJsonStructure(sourceText: string): boolean {
    return (
      sourceText.includes('[') ||
      sourceText.includes('{') ||
      sourceText.includes(']') ||
      sourceText.includes('}')
    );
  }

  /**
   * Maps raw parsed data into imported product input.
   * @param {unknown} product Raw product object
   * @param {number} index Product index
   * @returns {IImportedProductInput} Normalized product object
   */
  private mapImportedProduct(
    product: unknown,
    index: number,
  ): IImportedProductInput {
    if (!this.isRecord(product)) {
      LogError(
        this.logger,
        this.rUpload.noAcceptableExtension.message,
        this.mapImportedProduct.name,
      );
      throw new NotAcceptableException(this.rUpload.noAcceptableExtension);
    }
    const title: string = this.readString(
      product.title,
      `Imported product ${index + 1}`,
    );
    const subtitle: string = this.readString(product.subtitle, title);
    const description: string = this.readString(
      product.description,
      `Imported from document: ${title}`,
    );
    const idCatalog: number = this.readNumber(product.idCatalog, 0);
    const variations: CreateProductVariationInput[] | undefined =
      this.readVariations(product.variations);
    return {
      title,
      subtitle,
      description,
      idCatalog,
      ...(variations ? { variations } : {}),
    };
  }

  /**
   * Checks whether value is a non-array object.
   * @param {unknown} value Value to evaluate
   * @returns {value is Record<string, unknown>} True if object-like
   */
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Reads string with fallback support.
   * @param {unknown} value Raw input value
   * @param {string} fallback Default value
   * @returns {string} Sanitized string
   */
  private readString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : fallback;
  }

  /**
   * Reads numeric value with fallback support.
   * @param {unknown} value Raw input value
   * @param {number} fallback Default value
   * @returns {number} Sanitized number
   */
  private readNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsedValue: number = Number(value);
      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
    return fallback;
  }

  /**
   * Reads and normalizes product variations.
   * @param {unknown} value Raw variations value
   * @returns {CreateProductVariationInput[] | undefined} Sanitized variations
   */
  private readVariations(
    value: unknown,
  ): CreateProductVariationInput[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }
    const variations: CreateProductVariationInput[] = value
      .map((variation: unknown): CreateProductVariationInput | null => {
        if (!this.isRecord(variation) || !Array.isArray(variation.options)) {
          return null;
        }
        const title: string = this.readString(variation.title, '');
        if (!title) {
          return null;
        }
        const options: { value: string }[] = variation.options
          .map((option: unknown): { value: string } | null => {
            if (!this.isRecord(option)) {
              return null;
            }
            const optionValue: string = this.readString(option.value, '');
            return optionValue ? { value: optionValue } : null;
          })
          .filter((option): option is { value: string } => option !== null);
        if (options.length === 0) {
          return null;
        }
        return { title, options };
      })
      .filter(
        (variation): variation is CreateProductVariationInput =>
          variation !== null,
      );
    return variations.length > 0 ? variations : undefined;
  }

  /**
   * Gets normalized extension from filename.
   * @param {string} originalName Original filename
   * @returns {string} Extension in lowercase without dot
   */
  private getFileExtension(originalName: string): string {
    const extension: string | undefined = originalName.split('.').pop();
    return extension ? extension.trim().toLowerCase() : '';
  }

  /**
   * Splits CSV text into rows, preserving line breaks inside quoted fields.
   * @param {string} csvText Raw CSV text
   * @returns {string[]} CSV rows
   */
  private splitCsvRows(csvText: string): string[] {
    const normalizedText: string = csvText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    const rows: string[] = [];
    let currentRow: string = '';
    let isInsideQuotes: boolean = false;
    for (let index = 0; index < normalizedText.length; index += 1) {
      const currentChar: string = normalizedText[index];
      const nextChar: string = normalizedText[index + 1] ?? '';
      if (currentChar === '"') {
        if (isInsideQuotes && nextChar === '"') {
          currentRow += '""';
          index += 1;
          continue;
        }
        isInsideQuotes = !isInsideQuotes;
        currentRow += currentChar;
        continue;
      }
      if (currentChar === '\n' && !isInsideQuotes) {
        rows.push(currentRow);
        currentRow = '';
        continue;
      }
      currentRow += currentChar;
    }
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }
    return rows;
  }
}
