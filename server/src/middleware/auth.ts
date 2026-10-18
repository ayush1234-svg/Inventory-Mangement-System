import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: 'owner' | 'staff' };

    // Verify user still exists in DB
    const user = await User.findById(decoded.id).select('name email role');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists or session has expired.',
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
}

export function requireRole(role: 'owner' | 'staff') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions.',
      });
      return;
    }
    next();
  };
}
