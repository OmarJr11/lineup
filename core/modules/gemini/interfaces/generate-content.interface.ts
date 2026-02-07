/**
 * Input parameters for generating content with Gemini API
 */
export interface IGenerateContentInput {
  /** The prompt or content to send to the model */
  contents: string;
  /** Model identifier (e.g. 'gemini-2.5-flash', 'gemini-1.5-pro') */
  model?: string;
  /** System instruction to guide model behavior */
  systemInstruction?: string;
  /** Configuration for generation (temperature, maxTokens, etc.) */
  config?: IGenerateContentConfig;
}

/**
 * Configuration options for content generation
 */
export interface IGenerateContentConfig {
  /** Controls randomness (0-2, higher = more random) */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxOutputTokens?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Top-k sampling parameter */
  topK?: number;
}

/**
 * Response from Gemini API content generation
 */
export interface IGenerateContentOutput {
  /** Generated text content */
  text: string;
  /** Raw response from the API */
  rawResponse?: unknown;
}
