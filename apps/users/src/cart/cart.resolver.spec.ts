import { CartResolver } from './cart.resolver';
import type { CartService } from '../../../../core/modules/cart/cart.service';
import type { IUserReq } from '../../../../core/common/interfaces';
import type { AddToCartInput } from '../../../../core/modules/cart/dto/add-to-cart.input';
import type { UpdateCartItemInput } from '../../../../core/modules/cart/dto/update-cart-item.input';
import type { RemoveCartItemInput } from '../../../../core/modules/cart/dto/remove-cart-item.input';
import type { GetCartByBusinessInput } from '../../../../core/modules/cart/dto/get-cart-by-business.input';

describe('CartResolver', () => {
  let resolver: CartResolver;
  const cartServiceMock = {
    addItemToCart: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    getCartByBusiness: jest.fn(),
    getUserCarts: jest.fn(),
    clearCart: jest.fn(),
  };
  const user: IUserReq = { userId: 7, username: 'buyer' };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new CartResolver(cartServiceMock as unknown as CartService);
  });

  it('addItemToCart delegates to the service and maps the cart schema', async () => {
    const input = {
      productId: 10,
      businessId: 5,
      productSkuId: 12,
      quantity: 2,
    } as AddToCartInput;
    const cart = {
      id: 1,
      idBusiness: 5,
      items: [{ id: 99, quantity: 2 }],
    };

    cartServiceMock.addItemToCart.mockResolvedValue(cart);

    await expect(resolver.addItemToCart(input, user)).resolves.toEqual(
      expect.objectContaining({
        id: 1,
        items: expect.arrayContaining([expect.objectContaining({ id: 99 })]),
      }),
    );
    expect(cartServiceMock.addItemToCart).toHaveBeenCalledWith(input, user);
  });

  it('updateCartItem delegates to the service and maps the result', async () => {
    const input = { cartItemId: 22, quantity: 4 } as UpdateCartItemInput;
    const cart = { id: 1, items: [{ id: 22, quantity: 4 }] };

    cartServiceMock.updateCartItem.mockResolvedValue(cart);

    await expect(resolver.updateCartItem(input, user)).resolves.toEqual(
      expect.objectContaining({ id: 1 }),
    );
    expect(cartServiceMock.updateCartItem).toHaveBeenCalledWith(input, user);
  });

  it('removeCartItem delegates to the service and maps the updated cart', async () => {
    const input = { cartItemId: 22 } as RemoveCartItemInput;
    const cart = { id: 1, items: [] };

    cartServiceMock.removeCartItem.mockResolvedValue(cart);

    await expect(resolver.removeCartItem(input, user)).resolves.toEqual(
      expect.objectContaining({ id: 1 }),
    );
    expect(cartServiceMock.removeCartItem).toHaveBeenCalledWith(input, user);
  });

  it('getCartByBusiness returns null when no cart exists', async () => {
    const input = { businessId: 5 } as GetCartByBusinessInput;
    cartServiceMock.getCartByBusiness.mockResolvedValue(null);

    await expect(resolver.getCartByBusiness(input, user)).resolves.toBeNull();
    expect(cartServiceMock.getCartByBusiness).toHaveBeenCalledWith(input, user);
  });

  it('getUserCarts maps all carts to GraphQL schema objects', async () => {
    const carts = [{ id: 1, items: [{ id: 10 }] }, { id: 2, items: [] }];
    cartServiceMock.getUserCarts.mockResolvedValue(carts);

    await expect(resolver.getUserCarts(user)).resolves.toEqual([
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ id: 2 }),
    ]);
    expect(cartServiceMock.getUserCarts).toHaveBeenCalledWith(user);
  });

  it('clearCart returns null when the cart is not found', async () => {
    cartServiceMock.clearCart.mockResolvedValue(null);

    await expect(resolver.clearCart(5, user)).resolves.toBeNull();
    expect(cartServiceMock.clearCart).toHaveBeenCalledWith(user, 5);
  });
});
