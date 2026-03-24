import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type {NextFunction, Request, Response} from 'express';

dotenv.config();

const { JWT_SECRET } = process.env;

interface AuthRequest extends Request {
  user?: unknown;
}

interface JwtPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  wage: number;
}

export async function validateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  const [, token] = req.headers.authorization?.split(' ') || [' ', ' '];

  if (!token || token.trim() === '') {
    return res.status(401).send('No token provided');
  }

  try {
    (req as AuthRequest).user = jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    return next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Token inválido' });
  }
}