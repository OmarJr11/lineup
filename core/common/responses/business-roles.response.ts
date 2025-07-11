export const businessRolesResponses = {
    create: {
        noPermission: {
            code: 900100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 900199,
            status: false,
            message: 'The Business role could not be created, an error has occurred.',
        },
        success: {
            code: 910100,
            status: true,
            message: 'The Business role has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 900200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 900299,
            status: false,
            message: 'The Business role could not be updated, an error has occurred.',
        },
        success: {
            code: 910200,
            status: true,
            message: 'The Business role has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 900900,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 900399,
            status: false,
            message: 'The Business role(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 910900,
            status: true,
            message: 'The Business role(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 900600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 900699,
            status: false,
            message: 'The Business role could not be deleted, an error has occurred.',
        },
        success: {
            code: 910600,
            status: true,
            message: 'The Business role has been successfully deleted.',
        },
    }
};