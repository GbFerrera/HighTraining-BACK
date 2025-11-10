import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import authConfig from '../configs/auth';
import AppError from '../utils/AppError';

interface TokenPayload {
  sub: string;
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("JWT não informado", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const { sub: user_id } = verify(token, authConfig.jwt.secret) as TokenPayload;

    req.user = {
      id: Number(user_id)
    };

    return next();
    
  } catch {
    throw new AppError("JWT inválido", 401);
  }
}

export default ensureAuthenticated;
