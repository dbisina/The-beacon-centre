// backend/src/controllers/events.controller.ts
import { Request, Response } from 'express';
import { EventRsvpStatus } from '@prisma/client';
import { EventsService } from '../services/events.service';
import { EventsAdminService } from '../services/eventsAdmin.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedUserRequest } from '../types';
import { viewerOf } from '../middleware/viewerAuth';

const RSVP_STATUSES: EventRsvpStatus[] = ['GOING', 'MAYBE', 'NOT_GOING'];

const idOf = (req: Request) => {
  const id = parseInt(req.params.id);
  return isNaN(id) ? null : id;
};

/** The status for a service failure: missing -> 404, a full event -> 409, bad input -> 400. */
const statusFor = (error: string) =>
  error.endsWith('not found') ? 404
  : error === 'This event is full' || error === 'Registration is closed' ? 409
  : error.startsWith('Failed') ? 500
  : 400;

export class EventsController {
  // ─── Members and guests ───

  static async list(req: Request, res: Response): Promise<void> {
    const result = await EventsService.listUpcoming(viewerOf(req));
    if (result.success) sendSuccess(res, 'Events retrieved', result.data);
    else sendError(res, result.error, 500, result.details);
  }

  static async get(req: Request, res: Response): Promise<void> {
    const id = idOf(req);
    if (!id) return void sendError(res, 'Invalid event ID', 400);
    const result = await EventsService.getEvent(id, viewerOf(req));
    if (result.success) sendSuccess(res, 'Event retrieved', result.data);
    else sendError(res, result.error, statusFor(result.error), result.details);
  }

  static async rsvp(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    const id = idOf(req);
    if (!id) return void sendError(res, 'Invalid event ID', 400);
    const status = (req.body ?? {}).status as EventRsvpStatus;
    if (!RSVP_STATUSES.includes(status)) return void sendError(res, 'status must be GOING, MAYBE or NOT_GOING', 400);
    const result = await EventsService.setRsvp(id, req.appUser!.id, status);
    if (result.success) sendSuccess(res, 'RSVP saved', result.data);
    else sendError(res, result.error, statusFor(result.error), result.details);
  }

  static async clearRsvp(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    const id = idOf(req);
    if (!id) return void sendError(res, 'Invalid event ID', 400);
    const result = await EventsService.clearRsvp(id, req.appUser!.id);
    if (result.success) sendSuccess(res, 'RSVP removed', result.data);
    else sendError(res, result.error, statusFor(result.error), result.details);
  }

  static async register(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    const id = idOf(req);
    if (!id) return void sendError(res, 'Invalid event ID', 400);
    const result = await EventsService.register(id, req.appUser!.id, (req.body ?? {}).answers);
    if (result.success) sendSuccess(res, 'Registered', result.data, 201);
    else sendError(res, result.error, statusFor(result.error), result.details);
  }

  // ─── Admin ───

  static async adminList(_req: Request, res: Response): Promise<void> {
    const result = await EventsAdminService.list();
    if (result.success) sendSuccess(res, 'Events retrieved', result.data);
    else sendError(res, result.error, 500, result.details);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const result = await EventsAdminService.create(req.body ?? {});
    if (result.success) sendSuccess(res, 'Event created', result.data, 201);
    else sendError(res, result.error, statusFor(result.error), result.details);
  }

  static async update(req: Request, res: Response): Promise<void> {
    const id = idOf(req);
    if (!id) return void sendError(res, 'Invalid event ID', 400);
    const result = await EventsAdminService.update(id, req.body ?? {});
    if (result.success) sendSuccess(res, 'Event updated', result.data);
    else sendError(res, result.error, statusFor(result.error), result.details);
  }

  static async saveForm(req: Request, res: Response): Promise<void> {
    const id = idOf(req);
    if (!id) return void sendError(res, 'Invalid event ID', 400);
    const result = await EventsAdminService.saveForm(id, req.body ?? {});
    if (result.success) sendSuccess(res, 'Form saved', result.data);
    else sendError(res, result.error, statusFor(result.error), result.details);
  }

  static async responses(req: Request, res: Response): Promise<void> {
    const id = idOf(req);
    if (!id) return void sendError(res, 'Invalid event ID', 400);
    const result = await EventsAdminService.responses(id);
    if (result.success) sendSuccess(res, 'Responses retrieved', result.data);
    else sendError(res, result.error, statusFor(result.error), result.details);
  }

  static async responsesCsv(req: Request, res: Response): Promise<void> {
    const id = idOf(req);
    if (!id) return void sendError(res, 'Invalid event ID', 400);
    const result = await EventsAdminService.responsesCsv(id);
    if (!result.success) return void sendError(res, result.error, statusFor(result.error), result.details);
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="${result.data.filename}"`);
    res.set('Cache-Control', 'no-store');
    res.send(result.data.csv);
  }
}
