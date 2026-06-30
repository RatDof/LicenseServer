import { Response } from 'express';
import { LicenseService } from '../services/licenseService';
import { AuthenticatedRequest } from '../types';

export class LicenseController {
  static async getLicenses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await LicenseService.getLicenses(req.query as Record<string, string>);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }

  static async getLicenseById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const license = await LicenseService.getLicenseById(req.params.id);
      res.json({ success: true, data: license });
    } catch (err) {
      res.status(404).json({ success: false, error: (err as Error).message });
    }
  }

  static async createLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productId, userId, type, expiresAt, maxDevices, note } = req.body;
      if (!productId || !type) {
        res.status(400).json({ success: false, error: 'productId and type are required' });
        return;
      }
      const license = await LicenseService.createLicense(
        { productId, userId, type, expiresAt: expiresAt ? new Date(expiresAt) : undefined, maxDevices, note },
        req.user!.userId
      );
      res.status(201).json({ success: true, message: 'License created', data: license });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async bulkCreateLicenses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productId, type, count, expiresAt, maxDevices, note } = req.body;
      if (!productId || !type || !count) {
        res.status(400).json({ success: false, error: 'productId, type, and count are required' });
        return;
      }
      const licenses = await LicenseService.bulkCreateLicenses(
        { productId, type, count: parseInt(count, 10), expiresAt: expiresAt ? new Date(expiresAt) : undefined, maxDevices, note },
        req.user!.userId
      );
      res.status(201).json({ success: true, message: `${licenses.length} licenses created`, data: licenses });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async updateLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const license = await LicenseService.updateLicense(req.params.id, req.body, req.user!.userId);
      res.json({ success: true, message: 'License updated', data: license });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async deleteLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await LicenseService.deleteLicense(req.params.id, req.user!.userId);
      res.json({ success: true, message: 'License deleted' });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async suspendLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const license = await LicenseService.suspendLicense(req.params.id, req.user!.userId);
      res.json({ success: true, message: 'License suspended', data: license });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async resumeLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const license = await LicenseService.resumeLicense(req.params.id, req.user!.userId);
      res.json({ success: true, message: 'License resumed', data: license });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async getUserLicenses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params.userId || req.user!.userId;
      const licenses = await LicenseService.getUserLicenses(userId);
      res.json({ success: true, data: licenses });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }

  static async validateLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { key, deviceId } = req.body;
      if (!key || !deviceId) {
        res.status(400).json({ success: false, error: 'key and deviceId are required' });
        return;
      }
      const ip = req.socket.remoteAddress || 'unknown';
      const result = await LicenseService.validateLicense(key, deviceId, ip);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }
}
