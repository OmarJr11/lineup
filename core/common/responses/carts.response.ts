export const cartsResponses = {
  addItem: {
    productNotBelongs: {
      code: 3600500,
      status: false,
      message:
        'The product does not belong to this business or does not exist.',
    },
    skuNotBelongs: {
      code: 3600501,
      status: false,
      message: 'The SKU does not belong to this product.',
    },
    priceNotAvailable: {
      code: 3600502,
      status: false,
      message: 'The product does not have an available price for the cart.',
    },
  },
  updateItem: {
    itemNotFound: {
      code: 3600599,
      status: false,
      message: 'The item does not exist in the cart.',
    },
  },
  removeItem: {
    itemNotFound: {
      code: 3600599,
      status: false,
      message: 'The item does not exist in the cart.',
    },
  },
  cart: {
    notFound: {
      code: 3600598,
      status: false,
      message: 'The Cart could not be found.',
    },
  },
  create: {
    noPermission: {
      code: 3600100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3600199,
      status: false,
      message: 'The Cart could not be created, an error has occurred.',
    },
    success: {
      code: 3610100,
      status: true,
      message: 'The Cart has been successfully created.',
    },
  },
  update: {
    noPermission: {
      code: 3600200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3600299,
      status: false,
      message: 'The Cart could not be updated, an error has occurred.',
    },
    success: {
      code: 3610200,
      status: true,
      message: 'The Cart has been successfully updated.',
    },
  },
  list: {
    noPermission: {
      code: 3600300,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 3600398,
      status: false,
      message: 'The Cart(s) could not be found.',
    },
    error: {
      code: 3600399,
      status: false,
      message: 'The Cart(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 3610300,
      status: true,
      message: 'The Cart(s) has been successfully listed.',
    },
  },
  delete: {
    noPermission: {
      code: 3600400,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3600499,
      status: false,
      message: 'The Cart could not be deleted, an error has occurred.',
    },
    success: {
      code: 3610400,
      status: true,
      message: 'The Cart has been successfully deleted.',
    },
  },
};
