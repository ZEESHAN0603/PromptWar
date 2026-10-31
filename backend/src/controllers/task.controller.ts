import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getParam } from '../utils/params.js';
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
  createTaskDependencySchema,
} from '../validators/task.validator.js';

export class TaskController {
  // ==========================================
  // Task Operations
  // ==========================================

  static async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const validatedInput = createTaskSchema.parse(req.body);
      const result = await TaskService.createTask(req.user.id, eventId, validatedInput);
      ApiResponse.created(res, result, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const query = listTasksQuerySchema.parse(req.query);
      const result = await TaskService.listTasks(req.user.id, eventId, query);
      ApiResponse.success(res, result, 'Tasks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const taskId = getParam(req, 'taskId');
      const result = await TaskService.getTaskById(req.user.id, eventId, taskId);
      ApiResponse.success(res, result, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const taskId = getParam(req, 'taskId');
      const validatedInput = updateTaskSchema.parse(req.body);
      const result = await TaskService.updateTask(req.user.id, eventId, taskId, validatedInput);
      ApiResponse.success(res, result, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const taskId = getParam(req, 'taskId');
      const result = await TaskService.deleteTask(req.user.id, eventId, taskId);
      ApiResponse.success(res, result, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Task Dependency Operations
  // ==========================================

  static async createDependency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const taskId = getParam(req, 'taskId');
      const validatedInput = createTaskDependencySchema.parse(req.body);
      const result = await TaskService.createDependency(req.user.id, eventId, taskId, validatedInput);
      ApiResponse.created(res, result, 'Task dependency established successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listDependencies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const taskId = getParam(req, 'taskId');
      const result = await TaskService.listDependencies(req.user.id, eventId, taskId);
      ApiResponse.success(res, result, 'Task dependencies retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteDependency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const taskId = getParam(req, 'taskId');
      const dependencyId = getParam(req, 'dependencyId');
      const result = await TaskService.deleteDependency(req.user.id, eventId, taskId, dependencyId);
      ApiResponse.success(res, result, 'Task dependency removed successfully');
    } catch (error) {
      next(error);
    }
  }
}
