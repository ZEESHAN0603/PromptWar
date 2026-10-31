import { Router } from 'express';
import { TaskController } from '../controllers/task.controller.js';

export const taskRouter = Router({ mergeParams: true });

// Task CRUD
taskRouter.post('/', TaskController.createTask);
taskRouter.get('/', TaskController.listTasks);
taskRouter.get('/:taskId', TaskController.getTaskById);
taskRouter.patch('/:taskId', TaskController.updateTask);
taskRouter.delete('/:taskId', TaskController.deleteTask);

// Task Dependencies
taskRouter.post('/:taskId/dependencies', TaskController.createDependency);
taskRouter.get('/:taskId/dependencies', TaskController.listDependencies);
taskRouter.delete('/:taskId/dependencies/:dependencyId', TaskController.deleteDependency);

