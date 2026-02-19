'use client';

import { useState } from 'react';
import apiClient from '@/lib/axios';
import type { ApiResponse, BalanceData } from '@/types';

export function useBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('INR');

  const fetchBalance = async (): Promise<number | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ApiResponse<BalanceData>>('/user/balance');
      const { balance: amount, currency: cur } = res.data.data;
      setBalance(amount);
      setCurrency(cur);
      return amount;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Failed to fetch balance';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { balance, currency, isLoading, error, fetchBalance };
}
