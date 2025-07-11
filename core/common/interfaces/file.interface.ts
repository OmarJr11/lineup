export interface IFileInterface {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

export interface IFileUploadInterface {
    url: string;
    name: string;
    extension: string;
    directory: string;
}