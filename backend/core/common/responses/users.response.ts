export const userResponses = {
    login: {
        wrongData: {
            code: 100000,
            status: false,
            message: 'Invalid username or password.',
        },
        loginTypeInvalid: {
            code: 100001,
            status: false,
            message: 'You must use the authentication method previously used.',
        },
        userInactive: {
            code: 100002,
            status: false,
            message: 'User is not active.',
        },
        notAdmin: {
            code: 100003,
            status: false,
            message: 'User cannot login because has no permission to login in admin system',
        },
        emailNotVerified: {
            code: 100004,
            status: false,
            message: 'Email not verified',
        },
        error: {
            code: 100002,
            status: false,
            message: 'The User could not login.',
        },
        success: {
            code: 110000,
            status: true,
            message: 'Login succesful.',
        },
    },
    create: {
        noPermission: {
            code: 100100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        cantAssignRole: {
            code: 100101,
            status: false,
            message: 'An error occurred while saving the user role',
        },
        cantCreateWallet: {
            code: 100102,
            status: false,
            message: 'An error occurred while saving the user wallet',
        },
        mailExists: {
            code: 100103,
            status: false,
            message: 'The mail is already registered.',
        },
        documentExists: {
            code: 100104,
            status: false,
            message: 'The identification document is already registered.',
        },
        usernameExists: {
            code: 100105,
            status: false,
            message: 'The username is already registered.',
        },
        valueBeUnique: {
            code: 100106,
            status: false,
            message: 'An entered value already exist and has to be unique',
        },
        usernameNotValid: {
            code: 100107,
            status: false,
            message: 'username not valid',
        },
        error: {
            code: 100199,
            status: false,
            message: 'The User could not be created, an error has occurred.',
        },
        success: {
            code: 110100,
            status: true,
            message: 'The User has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 100200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        mailExists: {
            code: 100201,
            status: false,
            message: 'The mail is already registered.',
        },
        documentExists: {
            code: 100202,
            status: false,
            message: 'The identification document is already registered.',
        },
        usernameExists: {
            code: 100203,
            status: false,
            message: 'The username is already registered.',
        },
        usernameNotValid: {
            code: 100204,
            status: false,
            message: 'username not valid',
        },
        error: {
            code: 100299,
            status: false,
            message: 'The User could not be updated, an error has occurred.',
        },
        success: {
            code: 110200,
            status: true,
            message: 'The User has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 100300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        userNotFound: {
            code: 100301,
            status: false,
            message: 'User not found.',
        },
        error: {
            code: 100399,
            status: false,
            message: 'The User(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 110300,
            status: true,
            message: 'The User(s) has been successfully listed.',
        },
        successReferences: {
            code: 110301,
            status: true,
            message: 'The Reference(s) has been successfully listed.',
        },
        successReel: {
            code: 110302,
            status: true,
            message: 'The Reel has been successfully listed.',
        },
        successFullname: {
            code: 110303,
            status: true,
            message: 'The full name has been checked.',
        },
    },
    disable: {
        noPermission: {
            code: 100400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 100499,
            status: false,
            message: 'The User could not be disabled, an error has occurred.',
        },
        success: {
            code: 110400,
            status: true,
            message: 'The User has been successfully disabled.',
        },
    },
    enable: {
        noPermission: {
            code: 100500,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 100599,
            status: false,
            message: 'The User could not be enabled, an error has occurred.',
        },
        success: {
            code: 110500,
            status: true,
            message: 'The User has been successfully enabled.',
        },
    },
    delete: {
        noPermission: {
            code: 100600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 100699,
            status: false,
            message: 'The User could not be deleted, an error has occurred.',
        },
        success: {
            code: 110600,
            status: true,
            message: 'The User has been successfully deleted.',
        },
    },
    changePassword: {
        notFitStandard: {
            code: 100700,
            status: false,
            message: "New password doesn't meet security standards.",
        },
        equalToPrevious: {
            code: 100201,
            status: false,
            message: 'The new password cannot be the same as the old one.',
        },
        previousInvalid: {
            code: 100702,
            status: false,
            message: 'Previous password invalid.',
        },
        notExistsUser: {
            code: 100703,
            status: false,
            message: 'User not exists.',
        },
        error: {
            code: 100799,
            status: false,
            message: "An error has ocurred, password couldn't  be changed.",
        },
        success: {
            code: 110700,
            status: true,
            message: 'Password has been successfully updated.',
        },
    },
    logout: {
        error: {
            code: 100899,
            status: false,
            message: 'User can not logout.',
        },
        success: {
            code: 110800,
            status: true,
            message: 'Logout Successfully.',
        },
    },
    acceptBeDriver: {
        noPermission: {
            code: 100900,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 100999,
            status: false,
            message: 'An error has occurred accepting terms and conditions.',
        },
        success: {
            code: 110900,
            status: true,
            message: 'The user has accepted terms and conditions associated with being a driver.',
        },
    },
    validateEmail: {
        noPermission: {
            code: 101100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 101199,
            status: false,
            message: 'An error has occurred validating email.',
        },
        success: {
            code: 111100,
            status: true,
            message: 'The validate email has successfully created.',
        },
        successValidation: {
            code: 111101,
            status: true,
            message: 'The validate email has successfully validated.',
        },
    },
    refreshToken: {
        cookieNotSent: {
            code: 101000,
            status: false,
            message: 'Cookie not sent',
        },
        notCookies: {
            code: 101001,
            status: false,
            message: 'Cookie empty or not sent',
        },
        idUserDontMatch: {
            code: 101002,
            status: false,
            message: 'id User does not match the refreshToken user',
        },
        refreshNotValid: {
            code: 101003,
            status: false,
            message: 'Invalid Refresh Token',
        },
        tokenNotValid: {
            code: 101004,
            status: false,
            message: 'Invalid token',
        },
        refreshExpired: {
            code: 101005,
            status: false,
            message: 'Expired refresh token',
        },
        error: {
            code: 101099,
            status: false,
            message: 'Expired refresh token',
        },
        success: {
            code: 101006,
            status: true,
            message: 'Successful token refresh',
        },
    },
    telephone: {
        noPermission: {
            code: 101300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        alreadyExist: {
            code: 101301,
            status: false,
            message: 'Phone already exist.',
        },
        notExist: {
            code: 101302,
            status: false,
            message: 'Phone not exist.',
        },
        error: {
            code: 101399,
            status: false,
            message: 'An error has occurred.',
        },
        successAdd: {
            code: 111300,
            status: true,
            message: 'The Phone has been successfully added.',
        },
        successEdit: {
            code: 111300,
            status: true,
            message: 'The Phone has been successfully edited.',
        },
        successDelete: {
            code: 111300,
            status: true,
            message: 'The Phone has been successfully deleted.',
        },
    },
    mail: {
        noPermission: {
            code: 101300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        alreadyExist: {
            code: 101301,
            status: false,
            message: 'mail already exist.',
        },
        notExist: {
            code: 101302,
            status: false,
            message: 'mail not exist.',
        },
        error: {
            code: 101399,
            status: false,
            message: 'An error has occurred.',
        },
        successAdd: {
            code: 111300,
            status: true,
            message: 'The mail has been successfully added.',
        },
        successEdit: {
            code: 111300,
            status: true,
            message: 'The mail has been successfully edited.',
        },
        successDelete: {
            code: 111300,
            status: true,
            message: 'The mail has been successfully deleted.',
        },
    }
};
