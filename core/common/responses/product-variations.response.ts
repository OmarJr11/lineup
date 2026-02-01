/* eslint-disable max-len */
export const productVariationsResponses = {
    create: {
        noPermission: {
            code: 1001200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1001199,
            status: false,
            message: 'The Product Variation could not be created, an error has occurred.',
        },
        success: {
            code: 1011100,
            status: true,
            message: 'The Product Variation has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 1001200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1001299,
            status: false,
            message: 'The Product Variation could not be updated, an error has occurred.',
        },
        success: {
            code: 1011200,
            status: true,
            message: 'The Product Variation has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 1001300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1001398,
            status: false,
            message: 'The Product Variation(s) could not be found.',
        },
        error: {
            code: 1001399,
            status: false,
            message: 'The Product Variation(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 1011300,
            status: true,
            message: 'The Product Variation(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 1001600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1001699,
            status: false,
            message: 'The Product Variation could not be deleted, an error has occurred.',
        },
        success: {
            code: 1011600,
            status: true,
            message: 'The Product Variation has been successfully deleted.',
        },
    },
};
