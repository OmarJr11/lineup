export const statesResponses = {
    create: {
        nameAlreadyExists: {
            code: 3201198,
            status: false,
            message: 'A state with this name already exists.',
        },
        codeAlreadyExists: {
            code: 3201197,
            status: false,
            message: 'A state with this code already exists.',
        },
        capitalAlreadyExists: {
            code: 3201196,
            status: false,
            message: 'A state with this capital already exists.',
        },
        noPermission: {
            code: 3201200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 3201329,
            status: false,
            message: 'The State could not be created, an error has occurred.',
        },
        success: {
            code: 3211100,
            status: true,
            message: 'The State has been successfully created.',
        },
    },
    update: {
        nameAlreadyExists: {
            code: 3201298,
            status: false,
            message: 'A state with this name already exists.',
        },
        codeAlreadyExists: {
            code: 3201297,
            status: false,
            message: 'A state with this code already exists.',
        },
        capitalAlreadyExists: {
            code: 3201296,
            status: false,
            message: 'A state with this capital already exists.',
        },
        noPermission: {
            code: 3201200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 3201299,
            status: false,
            message: 'The State could not be updated, an error has occurred.',
        },
        success: {
            code: 3211200,
            status: true,
            message: 'The State has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 3201300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 3201398,
            status: false,
            message: 'The State(s) could not be found.',
        },
        error: {
            code: 3201399,
            status: false,
            message: 'The State(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 3211300,
            status: true,
            message: 'The State(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 3201600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 3201699,
            status: false,
            message: 'The State could not be deleted, an error has occurred.',
        },
        success: {
            code: 3211600,
            status: true,
            message: 'The State has been successfully deleted.',
        },
    },
};
