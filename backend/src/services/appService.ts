import prisma from '../utils/prisma';
import { LicenseStatus, LicenseType } from '@prisma/client';

export class AppService {
  static async checkLicenseForApp(key: string, deviceId: string, ip: string): Promise<Record<string, unknown>> {
    const license = await prisma.license.findUnique({
      where: { key },
      include: { product: true, user: true, devices: true },
    });

    if (!license) {
      return { success: false, message: 'License not found' };
    }

    if (license.status === LicenseStatus.SUSPENDED) {
      return { success: false, message: 'License is suspended' };
    }

    if (license.status === LicenseStatus.REVOKED) {
      return { success: false, message: 'License is revoked' };
    }

    if (license.expiresAt && new Date() > license.expiresAt) {
      await prisma.license.update({ where: { id: license.id }, data: { status: LicenseStatus.EXPIRED } });
      return { success: false, message: 'License has expired' };
    }

    const existingDevice = license.devices.find((d) => d.deviceId === deviceId);
    if (!existingDevice) {
      if (license.devices.length >= license.maxDevices) {
        return { success: false, message: `Max device limit reached (${license.maxDevices})` };
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

    return {
      success: true,
      message: 'License is valid',
      info: {
        username: key,
        subscription: license.type,
        expiry: license.expiresAt,
        status: license.status,
        data: license.data ?? {},
      },
    };
  }
}
