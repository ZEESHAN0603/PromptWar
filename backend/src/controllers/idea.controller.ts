import { Request, Response, NextFunction } from 'express';
import {
  generateIdeasForEvent,
  getEventIdeas,
  getIdeaById,
  saveIdea,
  removeSavedIdea,
  deleteIdea,
  toggleSaveIdea,
  createIdea,
} from '../services/idea.service.js';
import { generateIdeasInputSchema } from '../validators/idea.validator.js';
import { getParam } from '../utils/params.js';

export async function generateIdeasHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const userId = req.user!.id;

    const validatedInput = generateIdeasInputSchema.parse(req.body);

    const result = await generateIdeasForEvent(eventId, userId, validatedInput);

    res.status(200).json({
      success: true,
      message: `Generated ${result.totalGenerated} personalized celebration ideas.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEventIdeasHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const category = req.query.category as string | undefined;
    const generationId = req.query.generationId as string | undefined;
    const userId = req.user!.id;

    const ideas = await getEventIdeas(eventId, userId, category, generationId);

    res.status(200).json({
      success: true,
      data: { ideas },
    });
  } catch (error) {
    next(error);
  }
}

export async function getIdeaByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const ideaId = getParam(req, 'id');
    const userId = req.user!.id;

    const idea = await getIdeaById(eventId, ideaId, userId);

    res.status(200).json({
      success: true,
      data: { idea },
    });
  } catch (error) {
    next(error);
  }
}

export async function saveIdeaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const ideaId = getParam(req, 'id');
    const userId = req.user!.id;

    const updated = await saveIdea(eventId, ideaId, userId);

    res.status(200).json({
      success: true,
      message: 'Idea saved to favorites',
      data: { idea: updated },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeSavedIdeaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const ideaId = getParam(req, 'id');
    const userId = req.user!.id;

    const updated = await removeSavedIdea(eventId, ideaId, userId);

    res.status(200).json({
      success: true,
      message: 'Idea removed from favorites',
      data: { idea: updated },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteIdeaHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = getParam(req, 'eventId');
    const ideaId = getParam(req, 'id');
    const userId = req.user!.id;

    const result = await deleteIdea(eventId, ideaId, userId);

    res.status(200).json({
      success: true,
      message: 'Celebration idea deleted successfully',
      data: result,
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
