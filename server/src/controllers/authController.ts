import { Request, Response } from 'express';
import { env } from '../config/env.js';
import * as authService from '../services/authService.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const { user, token } = await authService.loginUser(email, password);

  // Set secure HttpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    message: 'Login successful',
    token, // Also return token in JSON for clients preferring Authorization header
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const user = await authService.getMe(req.user.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
