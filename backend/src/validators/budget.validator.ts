import { z } from 'zod';

export const createBudgetCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100, 'Name must not exceed 100 characters'),
  allocatedAmount: z
    .preprocess((val) => (val === null || val === undefined || val === '' ? 0 : val), z.union([z.number(), z.string()]))
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, 'Allocated amount must be a non-negative number')
    .default(0),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().trim().max(30).optional().nullable(),
});

export const updateBudgetCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name cannot be empty').max(100).optional(),
  allocatedAmount: z
    .preprocess((val) => (val === null || val === undefined || val === '' ? undefined : val), z.union([z.number(), z.string()]).optional())
    .transform((val) => (val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'Allocated amount must be a non-negative number')
    .optional(),
  description: z.string().trim().max(500).optional().nullable(),
  color: z.string().trim().max(30).optional().nullable(),
});

export const createExpenseSchema = z.object({
  categoryId: z
    .preprocess((val) => (val === '' ? null : val), z.string().uuid('Invalid category ID').optional().nullable()),
  title: z.string().trim().min(1, 'Expense title is required').max(150),
  description: z.string().trim().max(500).optional().nullable(),
  estimatedAmount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, 'Estimated amount must be a non-negative number')
    .default(0),
  actualAmount: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'Actual amount must be a non-negative number')
    .optional()
    .nullable(),
  expenseDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Expense date must be a valid ISO date string'
    ),
  paymentStatus: z
    .enum(['pending', 'partially_paid', 'paid'])
    .default('pending'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateExpenseSchema = z.object({
  categoryId: z
    .preprocess((val) => (val === '' ? null : val), z.string().uuid('Invalid category ID').optional().nullable()),
  title: z.string().trim().min(1, 'Expense title cannot be empty').max(150).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  estimatedAmount: z
    .union([z.number(), z.string()])
    .transform((val) => (val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'Estimated amount must be non-negative')
    .optional(),
  actualAmount: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' || val === null ? null : Number(val)))
    .refine((val) => val === null || (!isNaN(val) && val >= 0), 'Actual amount must be non-negative')
    .optional()
    .nullable(),
  expenseDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Expense date must be a valid ISO date string'
    ),
  paymentStatus: z
    .enum(['pending', 'partially_paid', 'paid'])
    .optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const listExpensesQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  paymentStatus: z.enum(['pending', 'partially_paid', 'paid', 'All']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc', 'title_asc']).default('date_desc'),
});

export type CreateBudgetCategoryInput = z.infer<typeof createBudgetCategorySchema>;
export type UpdateBudgetCategoryInput = z.infer<typeof updateBudgetCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

