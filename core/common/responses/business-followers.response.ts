export const businessFollowersResponses = {
    follow: {
        noPermission: {
            code: 1800700,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1800799,
            status: false,
            message: 'The follow could not be added, an error has occurred.',
        },
        success: {
            code: 1810700,
            status: true,
            message: 'The follow has been successfully added.',
        },
    },
    unfollow: {
        noPermission: {
            code: 1800800,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1800899,
            status: false,
            message: 'The unfollow could not be completed, an error has occurred.',
        },
        success: {
            code: 1810800,
            status: true,
            message: 'The unfollow has been successfully completed.',
        },
    },
    list: {
        noPermission: {
            code: 1800900,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1800998,
            status: false,
            message: 'The Business Follower(s) could not be found.',
        },
        error: {
            code: 1800999,
            status: false,
            message: 'The Business Follower(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 1810900,
            status: true,
            message: 'The Business Follower(s) has been successfully listed.',
        },
    },
};
