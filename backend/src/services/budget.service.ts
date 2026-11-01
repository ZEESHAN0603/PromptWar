import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { EventService } from './event.service.js';
import {
  CreateBudgetCategoryInput,
  UpdateBudgetCategoryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
} from '../validators/budget.validator.js';

export class BudgetService {
  /**
   * Enforces event existence and ownership.
   */
  static async verifyEventOwnership(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw ApiError.notFound('Event not found');
    }

    return event;
  }

  // ==========================================
  // Budget Category Operations
  // ==========================================

  static async createCategory(userId: string, eventId: string, input: CreateBudgetCategoryInput) {
    await this.verifyEventOwnership(userId, eventId);

    // Check duplicate category name within this event
    const existing = await prisma.budgetCategory.findFirst({
      where: {
        eventId,
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw ApiError.conflict(`A budget category named "${input.name}" already exists for this event`);
    }

    const category = await prisma.budgetCategory.create({
      data: {
        eventId,
        name: input.name,
        allocatedAmount: input.allocatedAmount,
        description: input.description,
        color: input.color,
      },
    });

    await EventService.touchPlanningRevision(eventId);

    return {
      id: category.id,
      eventId: category.eventId,
      name: category.name,
      allocatedAmount: Number(category.allocatedAmount),
      description: category.description,
      color: category.color,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static async listCategories(userId: string, eventId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const categories = await prisma.budgetCategory.findMany({
      where: { eventId },
      include: {
        expenses: {
          select: {
            estimatedAmount: true,
            actualAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return categories.map((cat) => {
      const allocated = Number(cat.allocatedAmount);
      const totalEstimated = cat.expenses.reduce((sum, e) => sum + Number(e.estimatedAmount || 0), 0);
      const totalActual = cat.expenses.reduce((sum, e) => sum + Number(e.actualAmount || 0), 0);

      return {
        id: cat.id,
        eventId: cat.eventId,
        name: cat.name,
        allocatedAmount: allocated,
        actualSpent: totalActual,
        estimatedTotal: totalEstimated,
        expenseCount: cat.expenses.length,
        variance: allocated - totalActual,
        isOverspent: totalActual > allocated,
        description: cat.description,
        color: cat.color,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });
  }

  static async updateCategory(
    userId: string,
    eventId: string,
    categoryId: string,
    input: UpdateBudgetCategoryInput
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.budgetCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Budget category not found');
    }

    if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.budgetCategory.findFirst({
        where: {
          eventId,
          name: {
            equals: input.name,
            mode: 'insensitive',
          },
          id: { not: categoryId },
        },
      });

      if (duplicate) {
        throw ApiError.conflict(`A budget category named "${input.name}" already exists for this event`);
      }
    }

    const updated = await prisma.budgetCategory.update({
      where: { id: categoryId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.allocatedAmount !== undefined && { allocatedAmount: input.allocatedAmount }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.color !== undefined && { color: input.color }),
      },
    });

    await EventService.touchPlanningRevision(eventId);

    return {
      id: updated.id,
      eventId: updated.eventId,
      name: updated.name,
      allocatedAmount: Number(updated.allocatedAmount),
      description: updated.description,
      color: updated.color,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  static async deleteCategory(userId: string, eventId: string, categoryId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.budgetCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Budget category not found');
    }

    // Explicitly unassign expenses to prevent silent deletion
    await prisma.expense.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });

    await prisma.budgetCategory.delete({
      where: { id: categoryId },
    });

    await EventService.touchPlanningRevision(eventId);

    return {
      id: categoryId,
      deleted: true,
      message: 'Budget category deleted successfully. Associated expenses unassigned but preserved.',
    };
  }

  // ==========================================
  // Expense Operations
  // ==========================================

  static async createExpense(userId: string, eventId: string, input: CreateExpenseInput) {
    await this.verifyEventOwnership(userId, eventId);

    if (input.categoryId) {
      const category = await prisma.budgetCategory.findUnique({
        where: { id: input.categoryId },
      });
      if (!category || category.eventId !== eventId) {
        throw ApiError.badRequest('Assigned budget category does not belong to this event');
      }
    }

    const expense = await prisma.expense.create({
      data: {
        eventId,
        categoryId: input.categoryId || null,
        title: input.title,
        description: input.description,
        estimatedAmount: input.estimatedAmount,
        actualAmount: input.actualAmount ?? null,
        expenseDate: input.expenseDate ? new Date(input.expenseDate) : null,
        paymentStatus: input.paymentStatus,
        notes: input.notes,
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    await EventService.touchPlanningRevision(eventId);

    return {
      id: expense.id,
      eventId: expense.eventId,
      categoryId: expense.categoryId,
      categoryName: expense.category?.name || null,
      title: expense.title,
      description: expense.description,
      estimatedAmount: Number(expense.estimatedAmount),
      actualAmount: expense.actualAmount !== null ? Number(expense.actualAmount) : null,
      expenseDate: expense.expenseDate ? expense.expenseDate.toISOString() : null,
      paymentStatus: expense.paymentStatus,
      notes: expense.notes,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  static async listExpenses(userId: string, eventId: string, query: ListExpensesQuery) {
    await this.verifyEventOwnership(userId, eventId);

    const where: Record<string, any> = { eventId };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.paymentStatus && query.paymentStatus !== 'All') {
      where.paymentStatus = query.paymentStatus;
    }

    const orderByMap: Record<string, any> = {
      date_desc: { expenseDate: 'desc' },
      date_asc: { expenseDate: 'asc' },
      amount_desc: { actualAmount: 'desc' },
      amount_asc: { actualAmount: 'asc' },
      title_asc: { title: 'asc' },
    };

    const orderBy = orderByMap[query.sortBy] || { createdAt: 'desc' };
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, expenses] = await prisma.$transaction([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      expenses: expenses.map((e) => ({
        id: e.id,
        eventId: e.eventId,
        categoryId: e.categoryId,
        categoryName: e.category?.name || null,
        categoryColor: e.category?.color || null,
        title: e.title,
        description: e.description,
        estimatedAmount: Number(e.estimatedAmount),
        actualAmount: e.actualAmount !== null ? Number(e.actualAmount) : null,
        expenseDate: e.expenseDate ? e.expenseDate.toISOString() : null,
        paymentStatus: e.paymentStatus,
        notes: e.notes,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  static async getExpenseById(userId: string, eventId: string, expenseId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    await EventService.touchPlanningRevision(eventId);

    if (!expense || expense.eventId !== eventId) {
      throw ApiError.notFound('Expense not found');
    }

    return {
      id: expense.id,
      eventId: expense.eventId,
      categoryId: expense.categoryId,
      categoryName: expense.category?.name || null,
      categoryColor: expense.category?.color || null,
      title: expense.title,
      description: expense.description,
      estimatedAmount: Number(expense.estimatedAmount),
      actualAmount: expense.actualAmount !== null ? Number(expense.actualAmount) : null,
      expenseDate: expense.expenseDate ? expense.expenseDate.toISOString() : null,
      paymentStatus: expense.paymentStatus,
      notes: expense.notes,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }

  static async updateExpense(
    userId: string,
    eventId: string,
    expenseId: string,
    input: UpdateExpenseInput
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Expense not found');
    }

    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await prisma.budgetCategory.findUnique({
        where: { id: input.categoryId },
      });
      if (!category || category.eventId !== eventId) {
        throw ApiError.badRequest('Assigned budget category does not belong to this event');
      }
    }

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.estimatedAmount !== undefined && { estimatedAmount: input.estimatedAmount }),
        ...(input.actualAmount !== undefined && { actualAmount: input.actualAmount }),
        ...(input.expenseDate !== undefined && {
          expenseDate: input.expenseDate ? new Date(input.expenseDate) : null,
        }),
        ...(input.paymentStatus !== undefined && { paymentStatus: input.paymentStatus }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: {
        category: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    await EventService.touchPlanningRevision(eventId);

    return {
      id: updated.id,
      eventId: updated.eventId,
      categoryId: updated.categoryId,
      categoryName: updated.category?.name || null,
      title: updated.title,
      description: updated.description,
      estimatedAmount: Number(updated.estimatedAmount),
      actualAmount: updated.actualAmount !== null ? Number(updated.actualAmount) : null,
      expenseDate: updated.expenseDate ? updated.expenseDate.toISOString() : null,
      paymentStatus: updated.paymentStatus,
      notes: updated.notes,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  static async deleteExpense(userId: string, eventId: string, expenseId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Expense not found');
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    await EventService.touchPlanningRevision(eventId);

    return {
      id: expenseId,
      deleted: true,
    };
  }

  // ==========================================
  // Budget Summary & Calculations
  // ==========================================

  static async getBudgetSummary(userId: string, eventId: string) {
    const event = await this.verifyEventOwnership(userId, eventId);

    const [categories, expenses] = await Promise.all([
      prisma.budgetCategory.findMany({
        where: { eventId },
        include: {
          expenses: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.expense.findMany({
        where: { eventId },
      }),
    ]);

    const totalBudget = Number(event.budget);
    const totalAllocated = categories.reduce((sum, c) => sum + Number(c.allocatedAmount), 0);
    const totalEstimatedExpenses = expenses.reduce((sum, e) => sum + Number(e.estimatedAmount || 0), 0);
    const totalActualExpenses = expenses.reduce((sum, e) => sum + Number(e.actualAmount || 0), 0);
    const remainingBudget = totalBudget - totalActualExpenses;

    const budgetUtilization = totalBudget > 0 ? (totalActualExpenses / totalBudget) * 100 : 0;

    const warnings: string[] = [];

    // Category breakdown
    const categoryBreakdown = categories.map((cat) => {
      const allocated = Number(cat.allocatedAmount);
      const estimated = cat.expenses.reduce((sum, e) => sum + Number(e.estimatedAmount || 0), 0);
      const actual = cat.expenses.reduce((sum, e) => sum + Number(e.actualAmount || 0), 0);
      const variance = allocated - actual;
      const isOverspent = actual > allocated;

      if (isOverspent) {
        warnings.push(`Actual spending in "${cat.name}" exceeds allocated category budget by ₹${Math.abs(variance).toLocaleString()}`);
      }

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        allocatedAmount: allocated,
        estimatedExpenses: estimated,
        actualExpenses: actual,
        variance,
        isOverspent,
        expenseCount: cat.expenses.length,
      };
    });

    if (totalBudget > 0 && totalActualExpenses > totalBudget) {
      warnings.push(`Total actual spending (₹${totalActualExpenses.toLocaleString()}) exceeds the overall event budget (₹${totalBudget.toLocaleString()})`);
    }

    if (totalBudget > 0 && totalEstimatedExpenses > totalBudget) {
      warnings.push(`Total estimated expenses (₹${totalEstimatedExpenses.toLocaleString()}) exceed the overall event budget (₹${totalBudget.toLocaleString()})`);
    }

    return {
      eventId: event.id,
      currency: event.currency,
      totalBudget,
      totalAllocated,
      totalEstimatedExpenses,
      totalActualExpenses,
      remainingBudget,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100,
      categoryBreakdown,
      uncategorizedExpensesCount: expenses.filter((e) => !e.categoryId).length,
      warnings,
    };
  }
}

