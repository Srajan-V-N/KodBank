import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  uid: z
    .string()
    .min(3, 'UID must be at least 3 characters')
    .max(50, 'UID must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'UID can only contain letters, numbers, and underscores'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  phone: z.string().min(7, 'Invalid phone number').max(20),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
