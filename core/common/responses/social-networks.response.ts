export const socialNetworksResponse = {
    create: {
        noPermission: {
            code: 1300200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1300199,
            status: false,
            message: 'The Social Network could not be created, an error has occurred.',
        },
        success: {
            code: 1310100,
            status: true,
            message: 'The Social Network has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 1300200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1300299,
            status: false,
            message: 'The Social Network could not be updated, an error has occurred.',
        },
        success: {
            code: 1310200,
            status: true,
            message: 'The Social Network has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 1300300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1300398,
            status: false,
            message: 'The Social Network(s) could not be found.',
        },
        error: {
            code: 1300399,
            status: false,
            message: 'The Social Network(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 1310300,
            status: true,
            message: 'The Social Network(s) has been successfully listed.',
        },
    },
    inactive: {
        noPermission: {
            code: 1300400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1300499,
            status: false,
            message: 'The Social Network could not be disabled, an error has occurred.',
        },
        success: {
            code: 1310400,
            status: true,
            message: 'The Social Network has been successfully disabled.',
        },
    },
    active: {
        noPermission: {
            code: 1300500,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1300599,
            status: false,
            message: 'The Social Network could not be enabled, an error has occurred.',
        },
        success: {
            code: 1310500,
            status: true,
            message: 'The Social Network has been successfully enabled.',
        },
    },
    delete: {
        noPermission: {
            code: 1300600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1300699,
            status: false,
            message: 'The Social Network could not be deleted, an error has occurred.',
        },
        success: {
            code: 1310600,
            status: true,
            message: 'The Social Network has been successfully deleted.',
        },
    },
};