import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './isAuthenticated.js';

export const isAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  // TODO: Query admins table with req.user.id.
  const isUserAdmin = false;

  if (!isUserAdmin) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  next();
};
