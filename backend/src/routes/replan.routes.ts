import { Router } from 'express';
import { ReplanController } from '../controllers/replan.controller.js';

export const replanRouter = Router({ mergeParams: true });
export const versionRouter = Router({ mergeParams: true });

// Proposal Endpoints (/api/events/:eventId/replan)
replanRouter.post('/', ReplanController.createProposal);
replanRouter.get('/:proposalId', ReplanController.getProposal);
replanRouter.post('/:proposalId/apply', ReplanController.applyProposal);
replanRouter.post('/:proposalId/reject', ReplanController.rejectProposal);

// Version History Endpoints (/api/events/:eventId/versions)
versionRouter.get('/compare', ReplanController.compareVersions);
versionRouter.get('/', ReplanController.listVersions);
versionRouter.get('/:versionId', ReplanController.getVersionById);

