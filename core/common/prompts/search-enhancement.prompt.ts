/**
 * Builds the system instruction for search text enhancement.
 * Instructions in English; output must be in Spanish.
 */
export const SEARCH_ENHANCEMENT_SYSTEM_INSTRUCTION = `You are an expert in full-text search optimization (PostgreSQL tsvector).
Your task is to transform raw product, business, or catalog data into dense, search-term-rich text.

Rules:
1. Use ONLY the information provided. Never invent data.
2. Include synonyms, colloquial variants, and phrases users might search for (e.g. "para regalar", "donde comprar", "barato", "en oferta").
3. Expand implicit concepts: e.g. "sports shoes" → add "running, tennis, gym, exercise".
4. Use both common and technical terms when applicable (e.g. "smartphone" and "teléfono celular").
5. Order information from most generic to most specific to improve ranking.
6. Maximum 400 words. Continuous paragraph, no bullets or formatting.
7. OUTPUT LANGUAGE: Spanish. Your response MUST be entirely in Spanish, with terms Spanish-speaking users typically search for.
8. Reply ONLY with the enhanced text. No titles, no "Texto mejorado:", no explanations.`;

/**
 * Builds the user prompt for product search enhancement.
 * @param productData - Plain text representation of product data.
 * @returns The prompt string to send to the model.
 */
export function buildProductSearchEnhancementPrompt(productData: string): string {
  return `Generate search-optimized text for this product.
Goal: a user searching by description, use, material, occasion, or feature should find it even without knowing the exact name.
Include: name and variants, what it is for, occasions for use, materials if applicable, related categories, synonyms and colloquial terms.
Respond in Spanish only.

Product data:
---
${productData}
---`;
}

/**
 * Builds the user prompt for business search enhancement.
 * @param businessData - Plain text representation of business data.
 * @returns The prompt string to send to the model.
 */
export function buildBusinessSearchEnhancementPrompt(businessData: string): string {
  return `Generate search-optimized text for this business.
Goal: a user searching by business type, services, location, or description should find it even without knowing the exact name.
Include: name and variants, what it sells/offers, business type, services, phrases like "donde comprar", "negocio de", synonyms and terms people use when searching.
Respond in Spanish only.

Business data:
---
${businessData}
---`;
}

/**
 * Builds the user prompt for catalog search enhancement.
 * @param catalogData - Plain text representation of catalog data.
 * @returns The prompt string to send to the model.
 */
export function buildCatalogSearchEnhancementPrompt(catalogData: string): string {
  return `Generate search-optimized text for this catalog.
Goal: a user searching by product type, category, or description should find it even without knowing the exact title.
Include: title and variants, type of products it contains, categories, uses, occasions, synonyms and terms people would use when searching for such a catalog.
Respond in Spanish only.

Catalog data:
---
${catalogData}
---`;
}
