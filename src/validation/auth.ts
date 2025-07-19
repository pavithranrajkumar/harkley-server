import { z } from 'zod';

// Signup validation schema
export const signupSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Validation types
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
