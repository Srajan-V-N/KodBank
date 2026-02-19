import { Request, Response, NextFunction } from 'express';
import { getBalance } from '../services/user.service';
import { successResponse } from '../utils/apiResponse';

export async function balance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const amount = await getBalance(userId);
    res
      .status(200)
      .json(successResponse('Balance retrieved', { balance: amount, currency: 'INR' }));
  } catch (err) {
    next(err);
  }
}
