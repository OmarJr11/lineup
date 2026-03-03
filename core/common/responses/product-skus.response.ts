/* eslint-disable max-len */
export const productSkusResponses = {
    create: {
        noPermission: {
            code: 2600100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 2600199,
            status: false,
            message: 'The Product SKU could not be created, an error has occurred.',
        },
        success: {
            code: 2610100,
            status: true,
            message: 'The Product SKU has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 2600200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 2600299,
            status: false,
            message: 'The Product SKU could not be updated, an error has occurred.',
        },
        success: {
            code: 2610200,
            status: true,
            message: 'The Product SKU has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 2600300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 2600301,
            status: false,
            message: 'The Product SKU(s) could not be found.',
        },
        error: {
            code: 2600399,
            status: false,
            message: 'The Product SKU(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 2610300,
            status: true,
            message: 'The Product SKU(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 2600400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 2600499,
            status: false,
            message: 'The Product SKU could not be deleted, an error has occurred.',
        },
        success: {
            code: 2610400,
            status: true,
            message: 'The Product SKU has been successfully deleted.',
        },
    },
};
