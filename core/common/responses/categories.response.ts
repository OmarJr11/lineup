export const categoriesResponses = {
    create: {
        noPermission: {
            code: 300100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 300199,
            status: false,
            message: 'The Category could not be created, an error has occurred.',
        },
        success: {
            code: 310100,
            status: true,
            message: 'The Category has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 300300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 300299,
            status: false,
            message: 'The Category could not be updated, an error has occurred.',
        },
        success: {
            code: 310300,
            status: true,
            message: 'The Category has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 300300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 300399,
            status: false,
            message: 'The Category(es) could not be listed, an error has occurred.',
        },
        success: {
            code: 310300,
            status: true,
            message: 'The Category(es) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 300600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 300699,
            status: false,
            message: 'The Category could not be deleted, an error has occurred.',
        },
        success: {
            code: 310600,
            status: true,
            message: 'The Category has been successfully deleted.',
        },
    }
};