/* eslint-disable max-len */
export const businessesResponses = {
    create: {
        noPermission: {
            code: 200200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        mailExists: {
            code: 200103,
            status: false,
            message: 'The mail is already registered.',
        },
        pathExists: {
            code: 200105,
            status: false,
            message: 'The path is already registered.',
        },
        pathNotValid: {
            code: 200204,
            status: false,
            message: 'path not valid',
        },
        error: {
            code: 200199,
            status: false,
            message: 'The Business could not be created, an error has occurred.',
        },
        success: {
            code: 210100,
            status: true,
            message: 'The Business has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 200200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        mailExists: {
            code: 200201,
            status: false,
            message: 'The mail is already registered.',
        },
        pathExists: {
            code: 200203,
            status: false,
            message: 'The path is already registered.',
        },
        pathNotValid: {
            code: 200204,
            status: false,
            message: 'path not valid',
        },
        error: {
            code: 200299,
            status: false,
            message: 'The Business could not be updated, an error has occurred.',
        },
        success: {
            code: 210200,
            status: true,
            message: 'The Business has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 200300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        businessNotFound: {
            code: 200301,
            status: false,
            message: 'Business not found.',
        },
        mailExists: {
            code: 200302,
            status: false,
            message: 'The mail is already registered.',
        },
        pathExists: {
            code: 200303,
            status: false,
            message: 'The path is already registered.',
        },
        pathNotValid: {
            code: 200304,
            status: false,
            message: 'Path not valid',
        },
        userNotActive: {
            code: 200305,
            status: false,
            message: 'Business is not active.',
        },
        error: {
            code: 200399,
            status: false,
            message: 'The Business(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 210300,
            status: true,
            message: 'The Business(s) has been successfully listed.',
        },
    },
    inactive: {
        noPermission: {
            code: 200400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 200499,
            status: false,
            message: 'The Business could not be disabled, an error has occurred.',
        },
        success: {
            code: 210400,
            status: true,
            message: 'The Business has been successfully disabled.',
        },
    },
    active: {
        noPermission: {
            code: 200500,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 200599,
            status: false,
            message: 'The Business could not be enabled, an error has occurred.',
        },
        success: {
            code: 210500,
            status: true,
            message: 'The Business has been successfully enabled.',
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
            message: 'The Business could not be deleted, an error has occurred.',
        },
        success: {
            code: 210600,
            status: true,
            message: 'The Business has been successfully deleted.',
        },
    },
    logout: {
        error: {
            code: 200899,
            status: false,
            message: 'User can not logout.',
        },
        success: {
            code: 210800,
            status: true,
            message: 'Logout Successfully.',
        },
    },
    token: {
        cookieNotSent: {
            code: 201000,
            status: false,
            message: 'Cookie not sent',
        },
        notCookies: {
            code: 201001,
            status: false,
            message: 'Cookie empty or not sent',
        },
        idUserDontMatch: {
            code: 201002,
            status: false,
            message: 'id User does not match the refreshToken user',
        },
        refreshNotValid: {
            code: 201003,
            status: false,
            message: 'Invalid Refresh Token',
        },
        tokenNotValid: {
            code: 201004,
            status: false,
            message: 'Invalid token',
        },
        refreshExpired: {
            code: 201005,
            status: false,
            message: 'Expired refresh token',
        },
        error: {
            code: 201099,
            status: false,
            message: 'Expired refresh token',
        },
        success: {
            code: 201006,
            status: true,
            message: 'Successful token refresh',
        },
    },
};
