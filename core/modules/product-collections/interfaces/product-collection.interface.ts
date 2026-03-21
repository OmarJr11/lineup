import type { Product } from '../../../entities';

/**
 * Represents a dynamic product collection for personalized recommendations.
 * Collections are not persisted; they are computed on each request.
 */
export interface IProductCollection {
  /** Unique identifier for the collection type. */
  id: string;
  /** Display title for the collection. */
  title: string;
  /** Products in the collection (random order each time). */
  products: Product[];
}
