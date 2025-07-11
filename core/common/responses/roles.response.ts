export const roleResponses = {
    create: {
        noPermission: {
            code: 400100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        cantAssignRole: {
            code: 400101,
            status: false,
            message: 'An error occurred while saving the Role',
        },
        error: {
            code: 400199,
            status: false,
            message: 'The Role could not be created, an error has occurred.',
        },
        success: {
            code: 410100,
            status: true,
            message: 'The Role has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 400400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 400299,
            status: false,
            message: 'The Role could not be updated, an error has occurred.',
        },
        success: {
            code: 410400,
            status: true,
            message: 'The Role has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 400300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        roleNotFound: {
            code: 400301,
            status: false,
            message: 'The Role could not be found.',
        },
        error: {
            code: 400399,
            status: false,
            message: 'The Role(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 410300,
            status: true,
            message: 'The Role(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 400600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 400699,
            status: false,
            message: 'The Role could not be deleted, an error has occurred.',
        },
        success: {
            code: 410600,
            status: true,
            message: 'The Role has been successfully deleted.',
        },
    }
};