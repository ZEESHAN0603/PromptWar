import { Response } from 'express';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
}

export class ApiResponse {
  /**
   * Sends a standardized successful JSON response
   */
  static success<T>(
    res: Response,
    data: T = {} as T,
    message = 'Operation completed successfully',
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Standardized 201 Created response
   */
  static created<T>(
    res: Response,
    data: T = {} as T,
    message = 'Resource created successfully'
  ): Response {
    return ApiResponse.success(res, data, message, 201);
  }
}

