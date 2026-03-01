import { z } from 'zod';
export const CheckoutSchema = z.object({
  addressId:     z.string().min(1, 'Please select a delivery address'),
  paymentMethod: z.enum(['stripe_card', 'cash', 'wallet']),
  promoCode:     z.string().min(4).max(20).optional().or(z.literal('')),
  tipAmount:     z.number().min(0).max(100).optional(),
  deliveryNotes: z.string().max(200).optional(),
});
export const CreateOrderSchema = CheckoutSchema.extend({
  restaurantId: z.string().min(1),
  userId:       z.string().min(1),
  subtotal:     z.number().positive(),
  deliveryFee:  z.number().min(0),
  tax:          z.number().min(0),
  total:        z.number().positive(),
  items: z.array(z.object({
    menuItemId:     z.string().min(1),
    quantity:       z.number().int().min(1).max(99),
    unitPrice:      z.number().positive(),
    customizations: z.record(z.string()).optional(),
  })).min(1, 'Cart is empty'),
});