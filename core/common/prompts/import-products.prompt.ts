/**
 * System instruction for extracting products from business documents.
 */
export const IMPORT_PRODUCTS_SYSTEM_INSTRUCTION: string = `You extract products from business documents.
- Return ONLY a valid JSON array.
- Each item must be an object with this shape:
  {
    "title": string,
    "subtitle": string,
    "description": string,
    "variations"?: [{ "title": string, "options": [{ "value": string }] }],
    "isPrimary"?: boolean
  }
- Do not include "images".
- Do not include explanations or markdown.
- Include all products found in the document without skipping entries.
- If a field is missing in the source document, infer a sensible value.
- Keep output concise and clean.`;

/**
 * System instruction for repairing malformed JSON arrays.
 */
export const JSON_REPAIR_SYSTEM_INSTRUCTION: string = `You are a strict JSON repair assistant.
- You receive malformed JSON that should represent an array.
- Return ONLY valid JSON array text.
- Do not add markdown, explanations, or comments.
- Preserve as much original data as possible.`;

/**
 * Builds the user prompt to import products from a document.
 * @param {string} documentContent The normalized document payload
 * @returns {string} Prompt text for Gemini
 */
export function buildImportProductsPrompt(documentContent: string): string {
  return `Extract all products from this business document and return them as JSON array. Do not omit any detected product.\n${documentContent}`;
}
