export interface IResponse {
    code: number;
    status: boolean;
    message: string;
}

export interface IResponseWithData {
    [key: string]: IResponse;
}
