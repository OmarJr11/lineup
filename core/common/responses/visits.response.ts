export const visitsResponses = {
    create: {
        noPermission: {
            code: 2000700,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        invalidVisitType: {
            code: 2000701,
            status: false,
            message: 'Invalid visit type.',
        },
        error: {
            code: 2000799,
            status: false,
            message: 'The visit could not be created, an error has occurred.',
        },
        success: {
            code: 2100700,
            status: true,
            message: 'The visit has been successfully created.',
        },
    },
};
