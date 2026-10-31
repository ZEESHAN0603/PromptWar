import { Router } from 'express';
import { TimelineController } from '../controllers/timeline.controller.js';

export const timelineRouter = Router({ mergeParams: true });
timelineRouter.post('/', TimelineController.createTimelineItem);
timelineRouter.get('/', TimelineController.listTimelineItems);
timelineRouter.get('/:timelineItemId', TimelineController.getTimelineItemById);
timelineRouter.patch('/:timelineItemId', TimelineController.updateTimelineItem);
timelineRouter.delete('/:timelineItemId', TimelineController.deleteTimelineItem);

