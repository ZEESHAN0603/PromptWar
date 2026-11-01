import { Request, Response, NextFunction } from 'express';
import { getEventIdeas, toggleSaveIdea, createIdea } from '../services/idea.service.js';
import { getParam } from '../utils/params.js';

export async function getEventIdeasHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const category = req.query.category as string | undefined;
    const userId = req.user!.id;

    const ideas = await getEventIdeas(eventId, userId, category);

    res.status(200).json({
      success: true,
      data: { ideas },
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleSaveIdeaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const ideaId = getParam(req, 'id');
    const userId = req.user!.id;

    const updated = await toggleSaveIdea(eventId, ideaId, userId);

    res.status(200).json({
      success: true,
      data: { idea: updated },
    });
  } catch (error) {
    next(error);
  }
}

export async function createIdeaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const userId = req.user!.id;

    const created = await createIdea(eventId, userId, req.body);

    res.status(201).json({
      success: true,
      data: { idea: created },
    });
  } catch (error) {
    next(error);
  }
}
