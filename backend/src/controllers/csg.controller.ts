// backend/src/controllers/csg.controller.ts
import { Request, Response } from 'express';
import { CsgService, CreateCsgRequest, UpdateCsgRequest, CreateCsgUpdateRequest } from '../services/csg.service';
import { sendSuccess, sendError } from '../utils/responses';
import { AuthenticatedRequest, AuthenticatedUserRequest } from '../types';

export class CsgController {
  static async getAllCsgs(req: Request, res: Response): Promise<void> {
    try {
      const result = await CsgService.getAllCsgs();

      if (result.success) {
        sendSuccess(res, 'CSGs retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve CSGs', 500, error);
    }
  }

  static async getCsgById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const result = await CsgService.getCsgById(id);

      if (result.success) {
        sendSuccess(res, 'CSG retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'CSG not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve CSG', 500, error);
    }
  }

  static async getCsgUpdates(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);

      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const result = await CsgService.getCsgUpdates(csgId, req.appUser!.id);

      if (result.success) {
        sendSuccess(res, 'CSG updates retrieved successfully', result.data);
      } else {
        const statusCode = result.error === 'Not a member of this CSG' ? 403 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve CSG updates', 500, error);
    }
  }

  static async getAdminMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);

      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const result = await CsgService.getAdminMembers(csgId);

      if (result.success) {
        sendSuccess(res, 'CSG members retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve CSG members', 500, error);
    }
  }

  /** POST /api/csgs/:id/join - a request with registration details, answered by a leader. */
  static async joinCsg(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);
      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const result = await CsgService.requestToJoin(csgId, req.appUser!.id, {
        fullName: body.fullName,
        dateOfBirth: body.dateOfBirth,
        addressStreet: body.addressStreet,
        addressArea: body.addressArea,
      });

      if (result.success) {
        const message = result.data.status === 'APPROVED' ? 'Already a member' : 'Request sent';
        sendSuccess(res, message, result.data, result.data.status === 'PENDING' ? 201 : 200);
      } else {
        const statusCode = result.error === 'CSG not found' ? 404 : result.error.startsWith('Failed') ? 500 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to send join request', 500, error);
    }
  }

  /** GET /api/csgs/:id/membership - the caller's standing in this group. */
  static async getMyMembership(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);
      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }
      const result = await CsgService.getMyMembership(csgId, req.appUser!.id);
      if (result.success) sendSuccess(res, 'Membership retrieved', result.data);
      else sendError(res, result.error, 500, result.details);
    } catch (error) {
      sendError(res, 'Failed to retrieve membership', 500, error);
    }
  }

  /** GET /api/csgs/mine - groups the caller belongs to or has asked to join. */
  static async getMyMemberships(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const result = await CsgService.getMyMemberships(req.appUser!.id);
      if (result.success) sendSuccess(res, 'Memberships retrieved', result.data);
      else sendError(res, result.error, 500, result.details);
    } catch (error) {
      sendError(res, 'Failed to retrieve memberships', 500, error);
    }
  }

  /** GET /api/csgs/:id/members - names of fellow members, approved members only. */
  static async getPeers(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);
      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }
      const result = await CsgService.getPeers(csgId, req.appUser!.id);
      if (result.success) sendSuccess(res, 'Members retrieved', result.data);
      else sendError(res, result.error, result.error === 'Not a member of this CSG' ? 403 : 500, result.details);
    } catch (error) {
      sendError(res, 'Failed to retrieve members', 500, error);
    }
  }

  /** GET /api/csgs/:id/admin/requests - pending join requests, full registration. */
  static async getAdminRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);
      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }
      const result = await CsgService.getAdminMembers(csgId, 'PENDING');
      if (result.success) sendSuccess(res, 'Join requests retrieved', result.data);
      else sendError(res, result.error, 500, result.details);
    } catch (error) {
      sendError(res, 'Failed to retrieve join requests', 500, error);
    }
  }

  /** POST /api/csgs/:id/members/:membershipId/approve | /decline */
  static reviewRequest(decision: 'APPROVED' | 'REJECTED') {
    return async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const csgId = parseInt(req.params.id);
        const membershipId = parseInt(req.params.membershipId);
        if (isNaN(csgId) || isNaN(membershipId)) {
          sendError(res, 'Invalid ID', 400);
          return;
        }
        const result = await CsgService.reviewRequest(csgId, membershipId, req.admin!.id, decision);
        if (result.success) {
          sendSuccess(res, decision === 'APPROVED' ? 'Request approved' : 'Request declined', result.data);
        } else {
          const statusCode =
            result.error === 'Request not found' ? 404 : result.error.startsWith('This request') ? 409 : 500;
          sendError(res, result.error, statusCode, result.details);
        }
      } catch (error) {
        sendError(res, 'Failed to update request', 500, error);
      }
    };
  }

  static async leaveCsg(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);

      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const result = await CsgService.leaveCsg(csgId, req.appUser!.id);

      if (result.success) {
        sendSuccess(res, 'Left CSG successfully', result.data);
      } else {
        const statusCode = result.error === 'Membership not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to leave CSG', 500, error);
    }
  }

  static async rsvp(req: AuthenticatedUserRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);

      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const result = await CsgService.rsvp(csgId, req.appUser!.id);

      if (result.success) {
        sendSuccess(res, 'RSVP recorded successfully', result.data);
      } else {
        const statusCode = result.error === 'Not a member of this CSG' ? 403 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to record RSVP', 500, error);
    }
  }

  static async createUpdate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);

      if (isNaN(csgId)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const payload: CreateCsgUpdateRequest = req.body;

      if (!payload.body) {
        sendError(res, 'Missing required field: body', 400);
        return;
      }

      const result = await CsgService.createUpdate(csgId, req.admin!.id, payload);

      if (result.success) {
        sendSuccess(res, 'CSG update created successfully', result.data, 201);
      } else {
        const statusCode = result.error === 'CSG not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create CSG update', 500, error);
    }
  }

  static async createCsg(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const data: CreateCsgRequest = req.body;

      if (!data.name) {
        sendError(res, 'Missing required field: name', 400);
        return;
      }

      const result = await CsgService.createCsg(data);

      if (result.success) {
        sendSuccess(res, 'CSG created successfully', result.data, 201);
      } else {
        sendError(res, result.error, 400, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to create CSG', 500, error);
    }
  }

  static async updateCsg(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const data: UpdateCsgRequest = req.body;
      const result = await CsgService.updateCsg(id, data);

      if (result.success) {
        sendSuccess(res, 'CSG updated successfully', result.data);
      } else {
        const statusCode = result.error === 'CSG not found' ? 404 : 400;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to update CSG', 500, error);
    }
  }

  static async deleteCsg(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 'Invalid CSG ID', 400);
        return;
      }

      const result = await CsgService.deleteCsg(id);

      if (result.success) {
        sendSuccess(res, 'CSG deleted successfully', result.data);
      } else {
        const statusCode = result.error === 'CSG not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to delete CSG', 500, error);
    }
  }

  static async removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const csgId = parseInt(req.params.id);
      const membershipId = parseInt(req.params.membershipId);

      if (isNaN(csgId) || isNaN(membershipId)) {
        sendError(res, 'Invalid CSG or membership ID', 400);
        return;
      }

      const result = await CsgService.removeMember(csgId, membershipId);

      if (result.success) {
        sendSuccess(res, 'Member removed successfully', result.data);
      } else {
        const statusCode = result.error === 'Membership not found' ? 404 : 500;
        sendError(res, result.error, statusCode, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to remove member', 500, error);
    }
  }

  static async getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await CsgService.getAdminStats();

      if (result.success) {
        sendSuccess(res, 'CSG statistics retrieved successfully', result.data);
      } else {
        sendError(res, result.error, 500, result.details);
      }
    } catch (error) {
      sendError(res, 'Failed to retrieve CSG statistics', 500, error);
    }
  }
}
