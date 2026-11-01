import { Request } from 'express';
import { ApiError } from './ApiError.js';

export function getParam(req: Request, key: string): string {
  const value = req.params[key];
  if (!value || typeof value !== 'string') {
    throw ApiError.badRequest(`Missing or invalid route parameter: ${key}`);
  }
  return value;
}

export function extractEventId(params: Record<string, any>): string {
  const eventId = params.eventId || params.id;
  if (!eventId || typeof eventId !== 'string') {
    throw ApiError.badRequest('Missing or invalid eventId parameter');
  }
  return eventId;
}


