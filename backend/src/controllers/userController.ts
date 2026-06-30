import { Response } from 'express';
import { UserService } from '../services/userService';
import { AuthenticatedRequest } from '../types';

export class UserController {
  static async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await UserService.getUsers(req.query as Record<string, string>);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }

  static async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (err) {
      res.status(404).json({ success: false, error: (err as Error).message });
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json({ success: true, message: 'User created', data: user });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await UserService.updateUser(req.params.id, req.body, req.user!.userId);
      res.json({ success: true, message: 'User updated', data: user });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await UserService.deleteUser(req.params.id, req.user!.userId);
      res.json({ success: true, message: 'User deleted' });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async adjustBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amount, type, description } = req.body;
      if (!amount || !type) {
        res.status(400).json({ success: false, error: 'Amount and type required' });
        return;
      }
      const result = await UserService.adjustBalance(
        req.params.id, amount, type, description || '', req.user!.userId
      );
      res.json({ success: true, message: 'Balance adjusted', data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }
}
