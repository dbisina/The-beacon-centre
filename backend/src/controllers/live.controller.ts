// backend/src/controllers/live.controller.ts
import { Request, Response } from 'express';
import { getLiveStatus } from '../services/liveStatus.service';
import { sendSuccess, sendError } from '../utils/responses';

export class LiveController {
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      // getLiveStatus() itself already degrades to {live:false, source:'none'}
      // on failure rather than throwing - this catch only guards against a
      // truly unexpected error so the response is still the standard envelope.
      const status = await getLiveStatus();
      res.set('Cache-Control', 'public, max-age=30');
      sendSuccess(res, 'Live status retrieved successfully', status);
    } catch (error) {
      // Never forward the raw error to a public, unauthenticated response -
      // an AxiosError from confirmVideoViaApi/searchLiveViaApi serializes
      // config.params (which carries YOUTUBE_API_KEY) back out via toJSON().
      console.error('[live.controller]', error);
      sendError(res, 'Failed to retrieve live status', 500);
    }
  }
}
