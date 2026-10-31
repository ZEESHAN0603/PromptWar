import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller.js';

export const budgetCategoryRouter = Router({ mergeParams: true });
budgetCategoryRouter.post('/', BudgetController.createCategory);
budgetCategoryRouter.get('/', BudgetController.listCategories);
budgetCategoryRouter.patch('/:categoryId', BudgetController.updateCategory);
budgetCategoryRouter.delete('/:categoryId', BudgetController.deleteCategory);

export const expenseRouter = Router({ mergeParams: true });
expenseRouter.post('/', BudgetController.createExpense);
expenseRouter.get('/', BudgetController.listExpenses);
expenseRouter.get('/:expenseId', BudgetController.getExpenseById);
expenseRouter.patch('/:expenseId', BudgetController.updateExpense);
expenseRouter.delete('/:expenseId', BudgetController.deleteExpense);

export const budgetSummaryRouter = Router({ mergeParams: true });
budgetSummaryRouter.get('/', BudgetController.getBudgetSummary);

