import type { NextFunction, Request, Response } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export const isAuthenticated = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '').trim();

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  // TODO: Verify Supabase JWT and attach user payload.
  req.user = {
    id: 'placeholder-user-id'
  };

  next();
};
