import type { CreateProductInput } from '../../products/dto/create-product.input';

/**
 * Product input extracted from document import flow.
 * Mirrors CreateProductInput excluding image payload.
 */
export type IImportedProductInput = Omit<CreateProductInput, 'images'>;
