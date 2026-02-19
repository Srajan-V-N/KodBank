import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json(errorResponse('Internal server error'));
}
