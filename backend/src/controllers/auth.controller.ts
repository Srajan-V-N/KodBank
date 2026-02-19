import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, logoutUser } from '../services/auth.service';
import { successResponse } from '../utils/apiResponse';
import { env } from '../config/env';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as RegisterInput;
    const user = await registerUser(input);
    res.status(201).json(successResponse('Registration successful', user));
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as LoginInput;
    const { token, user } = await loginUser(input);

    res.cookie('kodbank_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3_600_000, // 1 hour in ms
    });

    res.status(200).json(successResponse('Login successful', user));
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.kodbank_token as string | undefined;
    if (token && req.user) {
      await logoutUser(token, req.user.userId);
    }

    res.clearCookie('kodbank_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json(successResponse('Logged out successfully', null));
  } catch (err) {
    next(err);
  }
}
