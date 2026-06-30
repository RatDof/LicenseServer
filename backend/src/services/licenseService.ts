import prisma from '../utils/prisma';
import { LicenseStatus, LicenseType, LogAction } from '@prisma/client';
import { parsePagination, buildPaginatedResult, generateLicenseKey, generateBulkLicenseKeys } from '../utils/helpers';
import { PaginationQuery, PaginatedResult } from '../types';

export class LicenseService {
  static async getLicenses(
    query: PaginationQuery & { status?: string; type?: string; userId?: string; productId?: string }
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page, limit, skip, sortBy, sortOrder, search } = parsePagination(query);

    const where: Record<string, unknown> = {};
    if (search) where.key = { contains: search, mode: 'insensitive' };
    if (query.status) where.status = query.status as LicenseStatus;
    if (query.type) where.type = query.type as LicenseType;
    if (query.userId) where.userId = query.userId;
    if (query.productId) where.productId = query.productId;

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, username: true, email: true } },
          product: { select: { id: true, name: true, price: true } },
          _count: { select: { devices: true } },
        },
      }),
      prisma.license.count({ where }),
    ]);

    return buildPaginatedResult(licenses as unknown as Record<string, unknown>[], total, page, limit);
  }

  static async getLicenseById(id: string): Promise<Record<string, unknown>> {
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, email: true } },
        product: { select: { id: true, name: true, price: true } },
        devices: true,
      },
    });
    if (!license) throw new Error('License not found');
    return license as unknown as Record<string, unknown>;
  }

  static async createLicense(
    data: {
      productId: string;
      userId?: string;
      type: LicenseType;
      expiresAt?: Date;
      maxDevices?: number;
      note?: string;
      customKey?: string;
      customData?: Record<string, unknown>;
    },
    actorId: string
  ): Promise<Record<string, unknown>> {
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error('Product not found');

    let key = data.customKey?.trim();
    if (key) {
      const existing = await prisma.license.findUnique({ where: { key } });
      if (existing) throw new Error('Custom license key already exists, choose a different one');
    } else {
      key = generateLicenseKey();
    }

    const license = await prisma.license.create({
      data: {
        key,
        productId: data.productId,
        userId: data.userId,
        type: data.type,
        status: LicenseStatus.ACTIVE,
        expiresAt: data.type === LicenseType.PERMANENT ? null : data.expiresAt,
        maxDevices: data.maxDevices || 1,
        note: data.note,
        data: data.customData as object | undefined,
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
        product: { select: { id: true, name: true, price: true } },
      },
    });

    await prisma.log.create({
      data: {
        userId: actorId,
        action: LogAction.LICENSE_CREATE,
        success: true,
        details: { licenseId: license.id, key: license.key },
      },
    });

    return license as unknown as Record<string, unknown>;
  }

  static async resetHwid(id: string, actorId: string): Promise<Record<string, unknown>> {
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) throw new Error('License not found');

    await prisma.licenseDevice.deleteMany({ where: { licenseId: id } });

    await prisma.log.create({
      data: { userId: actorId, action: LogAction.LICENSE_UPDATE, success: true, details: { licenseId: id, action: 'hwid_reset' } },
    });

    return { message: 'All devices unlinked from this license' };
  }

  static async setCustomData(id: string, customData: Record<string, unknown>, actorId: string): Promise<Record<string, unknown>> {
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) throw new Error('License not found');

    const updated = await prisma.license.update({
      where: { id },
      data: { data: customData as object },
    });

    await prisma.log.create({
      data: { userId: actorId, action: LogAction.LICENSE_UPDATE, success: true, details: { licenseId: id, action: 'custom_data_update' } },
    });

    return updated as unknown as Record<string, unknown>;
  }

  static async bulkCreateLicenses(
    data: {
      productId: string;
      type: LicenseType;
      count: number;
      expiresAt?: Date;
      maxDevices?: number;
      note?: string;
    },
    actorId: string
  ): Promise<Record<string, unknown>[]> {
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error('Product not found');
    if (data.count > 500) throw new Error('Cannot generate more than 500 licenses at once');

    const keys = generateBulkLicenseKeys(data.count);
    const licenses = await prisma.$transaction(
      keys.map((key) =>
        prisma.license.create({
          data: {
            key,
            productId: data.productId,
            type: data.type,
            status: LicenseStatus.ACTIVE,
            expiresAt: data.type === LicenseType.PERMANENT ? null : data.expiresAt,
            maxDevices: data.maxDevices || 1,
            note: data.note,
          },
        })
      )
    );

    await prisma.log.create({
      data: {
        userId: actorId,
        action: LogAction.LICENSE_CREATE,
        success: true,
        details: { count: data.count, productId: data.productId },
      },
    });

    return licenses as unknown as Record<string, unknown>[];
  }

  static async updateLicense(
    id: string,
    data: {
      status?: LicenseStatus;
      type?: LicenseType;
      expiresAt?: Date;
      maxDevices?: number;
      userId?: string;
      note?: string;
    },
    actorId: string
  ): Promise<Record<string, unknown>> {
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) throw new Error('License not found');

    const updated = await prisma.license.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, username: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    });

    await prisma.log.create({
      data: {
        userId: actorId,
        action: LogAction.LICENSE_UPDATE,
        success: true,
        details: { licenseId: id, changes: data },
      },
    });

    return updated as unknown as Record<string, unknown>;
  }

  static async deleteLicense(id: string, actorId: string): Promise<void> {
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) throw new Error('License not found');
    await prisma.license.delete({ where: { id } });
    await prisma.log.create({
      data: {
        userId: actorId,
        action: LogAction.LICENSE_DELETE,
        success: true,
        details: { licenseId: id, key: license.key },
      },
    });
  }

  static async suspendLicense(id: string, actorId: string): Promise<Record<string, unknown>> {
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) throw new Error('License not found');
    const updated = await prisma.license.update({
      where: { id },
      data: { status: LicenseStatus.SUSPENDED },
    });
    await prisma.log.create({
      data: { userId: actorId, action: LogAction.LICENSE_SUSPEND, success: true, details: { licenseId: id } },
    });
    return updated as unknown as Record<string, unknown>;
  }

  static async resumeLicense(id: string, actorId: string): Promise<Record<string, unknown>> {
    const license = await prisma.license.findUnique({ where: { id } });
    if (!license) throw new Error('License not found');
    const updated = await prisma.license.update({
      where: { id },
      data: { status: LicenseStatus.ACTIVE },
    });
    await prisma.log.create({
      data: { userId: actorId, action: LogAction.LICENSE_RESUME, success: true, details: { licenseId: id } },
    });
    return updated as unknown as Record<string, unknown>;
  }

  static async getUserLicenses(userId: string): Promise<Record<string, unknown>[]> {
    const licenses = await prisma.license.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, name: true, version: true } },
        devices: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return licenses as unknown as Record<string, unknown>[];
  }

  static async validateLicense(key: string, deviceId: string, ip: string): Promise<Record<string, unknown>> {
    const license = await prisma.license.findUnique({
      where: { key },
      include: { product: true, user: true, devices: true },
    });

    if (!license) throw new Error('License not found');
    if (license.status === LicenseStatus.SUSPENDED) throw new Error('License is suspended');
    if (license.status === LicenseStatus.REVOKED) throw new Error('License is revoked');
    if (license.expiresAt && new Date() > license.expiresAt) {
      await prisma.license.update({ where: { id: license.id }, data: { status: LicenseStatus.EXPIRED } });
      throw new Error('License has expired');
    }

    const existingDevice = license.devices.find((d) => d.deviceId === deviceId);
    if (!existingDevice) {
      if (license.devices.length >= license.maxDevices) {
        throw new Error(`Max device limit reached (${license.maxDevices})`);
      }
      await prisma.licenseDevice.create({
        data: { licenseId: license.id, deviceId, ip, lastSeenAt: new Date() },
      });
    } else {
      await prisma.licenseDevice.update({
        where: { id: existingDevice.id },
        data: { lastSeenAt: new Date(), ip },
      });
    }

    return { valid: true, license } as unknown as Record<string, unknown>;
  }
}
