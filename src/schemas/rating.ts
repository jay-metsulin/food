import { z } from 'zod';
export const RatingSchema = z.object({
  restaurantRating: z.number().int().min(1, 'Please rate the restaurant').max(5),
  riderRating:      z.number().int().min(1, 'Please rate the rider').max(5),
  review:           z.string().max(500).optional(),
  tags:             z.array(z.string()).max(10).optional(),
});
export type RatingInput = z.infer<typeof RatingSchema>;