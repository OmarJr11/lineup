export const productReactionsResponses = {
    like: {
        noPermission: {
            code: 1700700,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1700799,
            status: false,
            message: 'The like could not be added, an error has occurred.',
        },
        success: {
            code: 1710700,
            status: true,
            message: 'The like has been successfully added.',
        },
    },
    unlike: {
        noPermission: {
            code: 1700800,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1700899,
            status: false,
            message: 'The like could not be removed, an error has occurred.',
        },
        success: {
            code: 1710800,
            status: true,
            message: 'The like has been successfully removed.',
        },
    },
    list: {
        noPermission: {
            code: 1700900,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1700998,
            status: false,
            message: 'The Product Reaction(s) could not be found.',
        },
        error: {
            code: 1700999,
            status: false,
            message: 'The Product Reaction(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 1710900,
            status: true,
            message: 'The Product Reaction(s) has been successfully listed.',
        },
    },
};
