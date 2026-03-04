/* eslint-disable max-len */
export const inventoryResponses = {
    adjustStock: {
        noPermission: {
            code: 2700100,
            status: false,
            message: 'Inventory management is a premium feature. You need an active subscription.',
        },
        error: {
            code: 2700199,
            status: false,
            message: 'Stock could not be adjusted, an error has occurred.',
        },
        success: {
            code: 2710100,
            status: true,
            message: 'Stock has been successfully adjusted.',
        },
    },
    registerPurchase: {
        noPermission: {
            code: 2700200,
            status: false,
            message: 'Inventory management is a premium feature. You need an active subscription.',
        },
        error: {
            code: 2700299,
            status: false,
            message: 'Purchase could not be registered, an error has occurred.',
        },
        success: {
            code: 2710200,
            status: true,
            message: 'Purchase has been successfully registered.',
        },
    },
    removeSku: {
        noPermission: {
            code: 2700300,
            status: false,
            message: 'Inventory management is a premium feature. You need an active subscription.',
        },
        error: {
            code: 2700399,
            status: false,
            message: 'SKU could not be removed, an error has occurred.',
        },
        success: {
            code: 2710300,
            status: true,
            message: 'SKU has been successfully removed.',
        },
    },
    getStockHistory: {
        noPermission: {
            code: 2700400,
            status: false,
            message: 'Inventory management is a premium feature. You need an active subscription.',
        },
        error: {
            code: 2700499,
            status: false,
            message: 'Stock history could not be retrieved, an error has occurred.',
        },
        success: {
            code: 2710400,
            status: true,
            message: 'Stock history has been successfully retrieved.',
        },
    },
};
