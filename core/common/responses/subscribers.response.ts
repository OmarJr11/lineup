export const subscribersResponse = {
    create: {
        noPermission: {
            code: 600100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 600199,
            status: false,
            message: 'Failed to create subscriber',
        },
        success: {
            code: 610100,
            status: true,
            message: 'The subscriber has been successfully created.',
        },
    },
    list: {
        noPermission: {
            code: 600300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 600399,
            status: false,
            message: 'No subscribers found.',
        },
        error: {
            code: 600399,
            status: false,
            message: 'The subscriber(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 610300,
            status: true,
            message: 'The subscriber(s) has been successfully listed.',
        },
    }
}