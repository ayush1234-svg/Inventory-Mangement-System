import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  errors?: any;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;

  // Handle Mongoose duplicate key error (E11000)
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values((err as any).errors || {}).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
    });
    return;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: `Invalid format for ${(err as any).path}: ${(err as any).value}`,
    });
    return;
  }

  // General server error
  const message =
    statusCode === 500 && env.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred on the server.'
      : err.message || 'Internal Server Error';

  console.error(`❌ [${new Date().toISOString()}] Error ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
