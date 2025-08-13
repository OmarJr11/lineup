/* eslint-disable max-len */
export const locationsResponses = {
    create: {
        noPermission: {
            code: 1200200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1200199,
            status: false,
            message: 'The Location could not be created, an error has occurred.',
        },
        success: {
            code: 1210100,
            status: true,
            message: 'The Location has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 1200200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1200299,
            status: false,
            message: 'The Location could not be updated, an error has occurred.',
        },
        success: {
            code: 1210200,
            status: true,
            message: 'The Location has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 1200300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1200398,
            status: false,
            message: 'The Location(s) could not be found.',
        },
        error: {
            code: 1200399,
            status: false,
            message: 'The Location(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 1210300,
            status: true,
            message: 'The Location(s) has been successfully listed.',
        },
    },
    inactive: {
        noPermission: {
            code: 1200400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1200499,
            status: false,
            message: 'The Location could not be disabled, an error has occurred.',
        },
        success: {
            code: 1210400,
            status: true,
            message: 'The Location has been successfully disabled.',
        },
    },
    active: {
        noPermission: {
            code: 1200500,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1200599,
            status: false,
            message: 'The Location could not be enabled, an error has occurred.',
        },
        success: {
            code: 1210500,
            status: true,
            message: 'The Location has been successfully enabled.',
        },
    },
    delete: {
        noPermission: {
            code: 1200600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1200699,
            status: false,
            message: 'The Location could not be deleted, an error has occurred.',
        },
        success: {
            code: 1210600,
            status: true,
            message: 'The Location has been successfully deleted.',
        },
    },
};
