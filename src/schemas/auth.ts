import { z } from 'zod';
const getAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / 31_557_600_000);

export const RegisterSchema = z.object({
  name:            z.string().min(2).max(60).regex(/^[a-zA-Z\s\-]+$/),
  email:           z.string().email(),
  phone:           z.string().regex(/^\+?[0-9]{10,15}$/),
  password:        z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/^\S+$/),
  confirmPassword: z.string(),
  dob:             z.string()
                     .refine(d => getAge(d) >= 18, 'Must be 18+')
                     .refine(d => new Date(d) < new Date(), 'Cannot be future'),
  termsAccepted:   z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;