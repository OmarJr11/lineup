# API GraphQL de carritos

Esta guía explica cómo probar con Postman las queries y mutations de carritos de usuarios.

## Requisitos

- La aplicación de usuarios debe estar ejecutándose.
- Debes iniciar sesión con un usuario registrado.
- Debes tener un access token válido.
- `businessId`, `productId`, `productSkuId` y `cartItemId` deben ser IDs válidos de la base de datos.

## Configuración de Postman

Crea una request con esta configuración:

- **Method:** `POST`
- **URL:** `http://localhost:3000/graphql`
- **Authorization:** Bearer Token
- **Token:** el access token obtenido o guardado después del login
- **Headers:**

```text
Content-Type: application/json
Authorization: Bearer <ACCESS_TOKEN>
```

La API también acepta el token mediante el header personalizado `token`:

```text
token: <ACCESS_TOKEN>
```

Usa solo uno de los métodos de autenticación. Se recomienda el header Bearer.

En cada request selecciona **Body > GraphQL**. Escribe la operación directamente en el editor de query y agrega el token en los headers.

> Si la aplicación usa otro puerto, reemplaza `3000` por el valor de `PORT_USER`.

## Campos de respuesta

Usa esta selección cuando necesites recibir el carrito completo en una query o mutation:

```graphql
id
idCreationUser
idBusiness
total
itemsCount
lastActivityDate
items {
  id
  idCart
  idProduct
  idProductSku
  quantity
  unitPrice
  subtotal
  variationOptions
}
```

También puedes solicitar las relaciones `business`, `creationUser` y `product` cuando estén cargadas en la entidad:

```graphql
business { id }
creationUser { id }
items { product { id } productSku { id } }
```

## Mutation: addItemToCart

Añade un producto al carrito del usuario para un negocio. Si ya existe la misma combinación de producto, SKU y variaciones, aumenta la cantidad.

### ¿Qué hace?

Valida que el producto pertenezca al negocio, calcula su precio y crea el item. Si el item ya existe, actualiza su cantidad y luego recalcula el total del carrito.

`productSkuId` y `variationOptions` son opcionales. Como el campo GraphQL está declarado como `String`, `variationOptions` debe enviarse como texto JSON.

### Body GraphQL de Postman

```graphql
mutation {
  addItemToCart(
    data: {
      businessId: 1
      productId: 10
      productSkuId: 25
      quantity: 2
      variationOptions: "{\"color\":\"black\",\"size\":\"M\"}"
    }
  ) {
    id
    idCreationUser
    idBusiness
    total
    itemsCount
    lastActivityDate
    items {
      id
      idCart
      idProduct
      idProductSku
      quantity
      unitPrice
      subtotal
      variationOptions
    }
  }
}
```

### Respuesta esperada

```json
{
  "data": {
    "addItemToCart": {
      "id": 50,
      "idCreationUser": 7,
      "idBusiness": 1,
      "total": 39.98,
      "itemsCount": 2,
      "lastActivityDate": "2026-09-06T12:00:00.000Z",
      "items": [
        {
          "id": 80,
          "idCart": 50,
          "idProduct": 10,
          "idProductSku": 25,
          "quantity": 2,
          "unitPrice": 19.99,
          "subtotal": 39.98,
          "variationOptions": "{\"color\":\"black\",\"size\":\"M\"}"
        }
      ]
    }
  }
}
```

## Mutation: updateCartItem

Actualiza la cantidad de un item existente. El item debe pertenecer al usuario autenticado.

### ¿Qué hace?

Busca el item, verifica que pertenezca al usuario, actualiza su cantidad y recalcula los totales del carrito.

### Body GraphQL de Postman

```graphql
mutation {
  updateCartItem(data: { cartItemId: 1, quantity: 3 }) {
    id
    idCreationUser
    idBusiness
    total
    itemsCount
    items {
      id
      idProduct
      idProductSku
      quantity
      unitPrice
      subtotal
      variationOptions
    }
  }
}
```

## Mutation: removeCartItem

Elimina un item del carrito del usuario autenticado.

### ¿Qué hace?

Busca el item, verifica la propiedad del usuario, lo elimina y recalcula los totales del carrito.

### Body GraphQL de Postman

```graphql
mutation RemoveCartItem($data: RemoveCartItemInput!) {
  removeCartItem(data: $data) {
    id
    idCreationUser
    idBusiness
    total
    itemsCount
    items {
      id
      idProduct
      idProductSku
      quantity
      unitPrice
      subtotal
      variationOptions
    }
  }
}
```

**Variables**

```json
{
  "data": {
    "cartItemId": 1
  }
}
```

## Mutation: clearCart

Elimina todos los items del carrito del usuario para un negocio. Devuelve `null` cuando no existe un carrito para ese usuario y negocio.

### ¿Qué hace?

Busca el carrito del usuario para el `businessId`, elimina todos sus items y deja el total y la cantidad en cero.

### Body GraphQL de Postman

```graphql
mutation ClearCart($businessId: Int!) {
  clearCart(businessId: $businessId) {
    id
    idCreationUser
    idBusiness
    total
    itemsCount
    lastActivityDate
    items {
      id
      idProduct
      idProductSku
      quantity
      unitPrice
      subtotal
      variationOptions
    }
  }
}
```

**Variables**

```json
{
  "businessId": 1
}
```

## Query: getCartByBusiness

Obtiene el carrito del usuario autenticado para un negocio. Devuelve `null` cuando el carrito no existe.

### ¿Qué hace?

Busca un carrito usando el usuario autenticado y el `businessId`, incluyendo sus items y la información relacionada disponible.

### Body GraphQL de Postman

```graphql
query GetCartByBusiness($businessId: Int!) {
  getCartByBusiness(data: { businessId: $businessId }) {
    id
    idCreationUser
    idBusiness
    total
    itemsCount
    lastActivityDate
    items {
      id
      idCart
      idProduct
      idProductSku
      quantity
      unitPrice
      subtotal
      variationOptions
    }
  }
}
```

**Variables**

```json
{
  "businessId": 1
}
```

## Query: getUserCarts

Devuelve todos los carritos pertenecientes al usuario autenticado. Si no tiene carritos, devuelve un array vacío.

### ¿Qué hace?

Lista los carritos del usuario ordenados por la actividad más reciente, incluyendo sus items.

### Body GraphQL de Postman

```graphql
query GetUserCarts {
  getUserCarts {
    id
    idCreationUser
    idBusiness
    total
    itemsCount
    lastActivityDate
    items {
      id
      idCart
      idProduct
      idProductSku
      quantity
      unitPrice
      subtotal
      variationOptions
    }
  }
}
```

## Errores comunes

### Error de autenticación

```json
{
  "errors": [
    {
      "message": "Token not found or invalid"
    }
  ]
}
```

Verifica el formato del header `Authorization`:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

### Errores de validación

Las causas más comunes son:

- `quantity` es menor que `1`.
- Falta un ID o no es un número positivo.
- El producto no pertenece al negocio solicitado.
- El SKU no pertenece al producto.
- El producto no tiene un precio disponible.
- El item no pertenece al usuario autenticado.

Usa los IDs devueltos por `getUserCarts` para probar `updateCartItem` y `removeCartItem`.
