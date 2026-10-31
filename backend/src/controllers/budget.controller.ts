import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getParam } from '../utils/params.js';
import {
  createBudgetCategorySchema,
  updateBudgetCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
} from '../validators/budget.validator.js';

export class BudgetController {
  // ==========================================
  // Category Endpoints
  // ==========================================

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const validatedInput = createBudgetCategorySchema.parse(req.body);
      const result = await BudgetService.createCategory(req.user.id, eventId, validatedInput);
      ApiResponse.created(res, result, 'Budget category created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const result = await BudgetService.listCategories(req.user.id, eventId);
      ApiResponse.success(res, result, 'Budget categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const categoryId = getParam(req, 'categoryId');
      const validatedInput = updateBudgetCategorySchema.parse(req.body);
      const result = await BudgetService.updateCategory(req.user.id, eventId, categoryId, validatedInput);
      ApiResponse.success(res, result, 'Budget category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const categoryId = getParam(req, 'categoryId');
      const result = await BudgetService.deleteCategory(req.user.id, eventId, categoryId);
      ApiResponse.success(res, result, 'Budget category deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Expense Endpoints
  // ==========================================

  static async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const validatedInput = createExpenseSchema.parse(req.body);
      const result = await BudgetService.createExpense(req.user.id, eventId, validatedInput);
      ApiResponse.created(res, result, 'Expense created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const query = listExpensesQuerySchema.parse(req.query);
      const result = await BudgetService.listExpenses(req.user.id, eventId, query);
      ApiResponse.success(res, result, 'Expenses retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const expenseId = getParam(req, 'expenseId');
      const result = await BudgetService.getExpenseById(req.user.id, eventId, expenseId);
      ApiResponse.success(res, result, 'Expense retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const expenseId = getParam(req, 'expenseId');
      const validatedInput = updateExpenseSchema.parse(req.body);
      const result = await BudgetService.updateExpense(req.user.id, eventId, expenseId, validatedInput);
      ApiResponse.success(res, result, 'Expense updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const expenseId = getParam(req, 'expenseId');
      const result = await BudgetService.deleteExpense(req.user.id, eventId, expenseId);
      ApiResponse.success(res, result, 'Expense deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Budget Summary Endpoint
  // ==========================================

  static async getBudgetSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const result = await BudgetService.getBudgetSummary(req.user.id, eventId);
      ApiResponse.success(res, result, 'Budget summary calculated successfully');
    } catch (error) {
      next(error);
    }
  }
}
