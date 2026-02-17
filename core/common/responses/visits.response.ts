export const visitsResponses = {
    create: {
        noPermission: {
            code: 2100100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        invalidVisitType: {
            code: 2100101,
            status: false,
            message: 'Invalid visit type.',
        },
        error: {
            code: 2100199,
            status: false,
            message: 'The visit could not be created, an error has occurred.',
        },
        success: {
            code: 2110100,
            status: true,
            message: 'The visit has been successfully created.',
        },
    },
};
