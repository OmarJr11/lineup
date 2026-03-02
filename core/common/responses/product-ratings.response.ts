export const productRatingsResponses = {
    rate: {
        noPermission: {
            code: 2501000,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 2501099,
            status: false,
            message: 'The rating could not be saved, an error has occurred.',
        },
        success: {
            code: 2511000,
            status: true,
            message: 'The rating has been successfully saved.',
        },
    },
    list: {
        noPermission: {
            code: 2501100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 2501198,
            status: false,
            message: 'The Product Rating(s) could not be found.',
        },
        error: {
            code: 2501199,
            status: false,
            message: 'The Product Rating(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 2511100,
            status: true,
            message: 'The Product Rating(s) has been successfully listed.',
        },
    },
};
