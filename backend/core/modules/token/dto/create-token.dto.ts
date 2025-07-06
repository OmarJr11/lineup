export class CreateTokenDto {
    idUser?: number;
    idBusiness?: number;
    token: string;
    refresh: string;
    creationDate: Date;
}