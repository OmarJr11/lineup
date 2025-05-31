export const roleResponses = {
    create: {
        noPermission: {
            code: 200100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        cantAssignRole: {
            code: 200101,
            status: false,
            message: 'An error occurred while saving the Role',
        },
        error: {
            code: 200199,
            status: false,
            message: 'The Role could not be created, an error has occurred.',
        },
        success: {
            code: 210100,
            status: true,
            message: 'The Role has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 200200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 200299,
            status: false,
            message: 'The Role could not be updated, an error has occurred.',
        },
        success: {
            code: 210200,
            status: true,
            message: 'The Role has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 200300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        roleNotFound: {
            code: 200301,
            status: false,
            message: 'The Role could not be found.',
        },
        error: {
            code: 200399,
            status: false,
            message: 'The Role(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 210300,
            status: true,
            message: 'The Role(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 200600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 200699,
            status: false,
            message: 'The Role could not be deleted, an error has occurred.',
        },
        success: {
            code: 210600,
            status: true,
            message: 'The Role has been successfully deleted.',
        },
    }
};