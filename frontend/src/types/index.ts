export interface User {
  uid: string;
  username: string;
  email: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface BalanceData {
  balance: number;
  currency: string;
}
