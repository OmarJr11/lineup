export const blogsResponses = {
    create: {
        noPermission: {
            code: 800100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 800199,
            status: false,
            message: 'The Blog could not be created, an error has occurred.',
        },
        success: {
            code: 810100,
            status: true,
            message: 'The Blog has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 800200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 800299,
            status: false,
            message: 'The Blog could not be updated, an error has occurred.',
        },
        success: {
            code: 810200,
            status: true,
            message: 'The Blog has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 800300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 800399,
            status: false,
            message: 'Blog(s) not found.',
        },
        error: {
            code: 800399,
            status: false,
            message: 'The Blog(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 810300,
            status: true,
            message: 'The Blog(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 800600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 800699,
            status: false,
            message: 'The Blog could not be deleted, an error has occurred.',
        },
        success: {
            code: 810600,
            status: true,
            message: 'The Blog has been successfully deleted.',
        },
    },
};
