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
export function buildProductSearchEnhancementPrompt(
  productData: string,
): string {
  return `Generate dense, search-optimized text for this product. The output will be indexed for full-text search (PostgreSQL tsvector).

GOAL: A user searching by any of these should find the product even without knowing its exact name:
- Description, use, material, occasion, or feature
- Problem it solves or need it fulfills
- Who it is for (audience: niños, adultos, mascotas, regalo, etc.)
- When/where to use it (ocasiones, eventos, temporadas)
- Related categories and product types
- Synonyms, colloquial terms, regional variants (Latino/Spain)
- Common misspellings or alternative names

INCLUDE in your output:
1. Name and all variants (formal, informal, abbreviations)
2. What it is for, uses, and applications
3. Occasions: regalo, cumpleaños, boda, navidad, baby shower, aniversario, etc.
4. Materials, ingredients, or composition when applicable
5. Size, format, unit, or presentation if relevant
6. Related categories and product types (e.g. "pan" → panadería, repostería, desayuno)
7. Search phrases users might type: "donde comprar", "para regalar", "ideal para", "barato", "en oferta", "original", "artesanal"
8. Expand implicit concepts: e.g. "zapatos deportivos" → running, tenis, gimnasio, ejercicio, fitness
9. Both technical and common terms: e.g. "smartphone" and "celular", "móvil"

OUTPUT: One continuous paragraph in Spanish. No bullets, no titles, no "Texto mejorado:". Maximum 1000 words. Reply ONLY with the enhanced text.

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
export function buildBusinessSearchEnhancementPrompt(
  businessData: string,
): string {
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
export function buildCatalogSearchEnhancementPrompt(
  catalogData: string,
): string {
  return `Generate search-optimized text for this catalog.
Goal: a user searching by product type, category, or description should find it even without knowing the exact title.
Include: title and variants, type of products it contains, categories, uses, occasions, synonyms and terms people would use when searching for such a catalog.
Respond in Spanish only.

Catalog data:
---
${catalogData}
---`;
}
