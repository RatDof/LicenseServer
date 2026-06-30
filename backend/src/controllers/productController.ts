import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../utils/prisma';
import { parsePagination, buildPaginatedResult } from '../utils/helpers';
import { LogAction } from '@prisma/client';

export class ProductController {
  static async getProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, skip, sortBy, sortOrder, search } = parsePagination(req.query);

      const where: Record<string, unknown> = {};
      if (search) where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      if (req.query.isActive !== undefined) where.isActive = req.query.isActive === 'true';

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: { _count: { select: { licenses: true } } },
        }),
        prisma.product.count({ where }),
      ]);

      res.json({ success: true, data: buildPaginatedResult(products as unknown as Record<string, unknown>[], total, page, limit) });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }

  static async getProductById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { licenses: true } } },
      });
      if (!product) { res.status(404).json({ success: false, error: 'Product not found' }); return; }
      res.json({ success: true, data: product });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }

  static async createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, price, version } = req.body;
      if (!name) { res.status(400).json({ success: false, error: 'Name is required' }); return; }

      const product = await prisma.product.create({
        data: { name, description, price: parseFloat(price) || 0, version },
      });

      await prisma.log.create({
        data: { userId: req.user!.userId, action: LogAction.PRODUCT_CREATE, success: true, details: { productId: product.id } },
      });

      res.status(201).json({ success: true, message: 'Product created', data: product });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async updateProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, price, isActive, version } = req.body;
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: { name, description, price: price !== undefined ? parseFloat(price) : undefined, isActive, version },
      });

      await prisma.log.create({
        data: { userId: req.user!.userId, action: LogAction.PRODUCT_UPDATE, success: true, details: { productId: product.id } },
      });

      res.json({ success: true, message: 'Product updated', data: product });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }

  static async deleteProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const licenseCount = await prisma.license.count({ where: { productId: req.params.id } });
      if (licenseCount > 0) {
        res.status(400).json({ success: false, error: 'Cannot delete product with existing licenses' });
        return;
      }

      await prisma.product.delete({ where: { id: req.params.id } });
      await prisma.log.create({
        data: { userId: req.user!.userId, action: LogAction.PRODUCT_DELETE, success: true, details: { productId: req.params.id } },
      });

      res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
      res.status(400).json({ success: false, error: (err as Error).message });
    }
  }
}
