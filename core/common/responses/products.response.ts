/* eslint-disable max-len */
export const productsResponses = {
    create: {
        noPermission: {
            code: 1000200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1000199,
            status: false,
            message: 'The Product could not be created, an error has occurred.',
        },
        success: {
            code: 1010100,
            status: true,
            message: 'The Product has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 1000200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1000299,
            status: false,
            message: 'The Product could not be updated, an error has occurred.',
        },
        success: {
            code: 1010200,
            status: true,
            message: 'The Product has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 1000300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1000398,
            status: false,
            message: 'The Product(s) could not be found.',
        },
        error: {
            code: 1000399,
            status: false,
            message: 'The Product(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 1010300,
            status: true,
            message: 'The Product(s) has been successfully listed.',
        },
    },
    inactive: {
        noPermission: {
            code: 1000400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1000499,
            status: false,
            message: 'The Product could not be disabled, an error has occurred.',
        },
        success: {
            code: 1010400,
            status: true,
            message: 'The Product has been successfully disabled.',
        },
    },
    active: {
        noPermission: {
            code: 1000500,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1000599,
            status: false,
            message: 'The Product could not be enabled, an error has occurred.',
        },
        success: {
            code: 1010500,
            status: true,
            message: 'The Product has been successfully enabled.',
        },
    },
    delete: {
        noPermission: {
            code: 1000600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1000699,
            status: false,
            message: 'The Product could not be deleted, an error has occurred.',
        },
        success: {
            code: 1010600,
            status: true,
            message: 'The Product has been successfully deleted.',
        },
    },
};
