export const userRolesResponses = {
    create: {
        noPermission: {
            code: 500100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 500199,
            status: false,
            message: 'The User rol could not be created, an error has occurred.',
        },
        success: {
            code: 510100,
            status: true,
            message: 'The User rol has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 500200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 500299,
            status: false,
            message: 'The User rol could not be updated, an error has occurred.',
        },
        success: {
            code: 510200,
            status: true,
            message: 'The User rol has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 500500,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 500399,
            status: false,
            message: 'The User rol(es) could not be listed, an error has occurred.',
        },
        success: {
            code: 510500,
            status: true,
            message: 'The User rol(es) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 500600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 500699,
            status: false,
            message: 'The User rol could not be deleted, an error has occurred.',
        },
        success: {
            code: 510600,
            status: true,
            message: 'The User rol has been successfully deleted.',
        },
    }
};