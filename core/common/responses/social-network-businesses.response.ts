/* eslint-disable max-len */
export const socialNetworkBusinessesResponses = {
    create: {
        noPermission: {
            code: 1400200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        alreadyExists: {
            code: 1400101,
            status: false,
            message: 'The Social Network Business already exists.',
        },
        contactMismatch: {
            code: 1400102,
            status: false,
            message: 'The contact type (url or phone) does not match the selected social network requirements.',
        },
        error: {
            code: 1400199,
            status: false,
            message: 'The Social Network Business could not be created, an error has occurred.',
        },
        success: {
            code: 1410100,
            status: true,
            message: 'The Social Network Business has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 1400200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1400299,
            status: false,
            message: 'The Social Network Business could not be updated, an error has occurred.',
        },
        success: {
            code: 1410200,
            status: true,
            message: 'The Social Network Business has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 1400300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1400398,
            status: false,
            message: 'The Social Network Business(es) could not be found.',
        },
        error: {
            code: 1400399,
            status: false,
            message: 'The Social Network Business(es) could not be listed, an error has occurred.',
        },
        success: {
            code: 1410300,
            status: true,
            message: 'The Social Network Business(es) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 1400400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1400499,
            status: false,
            message: 'The Social Network Business could not be deleted, an error has occurred.',
        },
        success: {
            code: 1410400,
            status: true,
            message: 'The Social Network Business has been successfully deleted.',
        },
    },
};
