import type { Cart, CartItem } from '../../entities';
import type { CartItemSchema, CartSchema } from '../../schemas';

/**
 * Maps a CartItem entity to its GraphQL schema representation.
 * @param cartItem - Cart item entity to map.
 * @returns {CartItemSchema} GraphQL cart item schema.
 */
export function toCartItemSchema(cartItem: CartItem): CartItemSchema {
  return cartItem as CartItemSchema;
}

/**
 * Maps a Cart entity and its loaded items to its GraphQL schema representation.
 * @param cart - Cart entity to map.
 * @returns {CartSchema} GraphQL cart schema.
 */
export function toCartSchema(cart: Cart): CartSchema {
  const result = { ...cart } as CartSchema;

  if (cart.items) {
    result.items = cart.items.map(toCartItemSchema);
  }

  return result;
}
