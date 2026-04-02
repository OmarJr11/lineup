import type * as jwt from 'jsonwebtoken';
import type { StatusEnum } from '../enums';

export interface ITokenGenerate {
  username?: string;
  path?: string;
  isBusiness?: boolean;
  email: string;
  sub: number;
  status: StatusEnum;
  idUser?: number;
  idBusiness?: number;
  options?: jwt.SignOptions;
}
