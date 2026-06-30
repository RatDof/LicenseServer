import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { Role, LogAction } from '@prisma/client';
import { parsePagination, buildPaginatedResult, generateReference } from '../utils/helpers';
import { PaginationQuery, PaginatedResult } from '../types';

export class UserService {
  static async getUsers(query: PaginationQuery & { role?: string; isActive?: string }): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page, limit, skip, sortBy, sortOrder, search } = parsePagination(query);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (query.role) where.role = query.role as Role;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true, username: true, email: true, role: true,
          balance: true, isActive: true, lastLoginAt: true,
          createdAt: true, updatedAt: true,
          _count: { select: { licenses: true, transactions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(users as unknown as Record<string, unknown>[], total, page, limit);
  }

  static async getUserById(id: string): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true, role: true,
        balance: true, isActive: true, avatar: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
        _count: { select: { licenses: true, transactions: true } },
      },
    });
    if (!user) throw new Error('User not found');
    return user as unknown as Record<string, unknown>;
  }

  static async createUser(data: {
    username: string;
    email: string;
    password: string;
    role?: Role;
    balance?: number;
  }): Promise<Record<string, unknown>> {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) throw new Error('Username or email already exists');

    const hashedPassword = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role || Role.USER,
        balance: data.balance || 0,
      },
      select: {
        id: true, username: true, email: true, role: true,
        balance: true, isActive: true, createdAt: true,
      },
    });

    await prisma.log.create({
      data: { userId: user.id, action: LogAction.USER_CREATE, success: true },
    });

    return user as unknown as Record<string, unknown>;
  }

  static async updateUser(
    id: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      role?: Role;
      isActive?: boolean;
      avatar?: string;
    },
    actorId: string
  ): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');

    const updateData: Record<string, unknown> = {};
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, username: true, email: true, role: true,
        balance: true, isActive: true, avatar: true, updatedAt: true,
      },
    });

    await prisma.log.create({
      data: { userId: actorId, action: LogAction.USER_UPDATE, success: true, details: { targetUserId: id } },
    });

    return updated as unknown as Record<string, unknown>;
  }

  static async deleteUser(id: string, actorId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    if (user.role === Role.ADMIN) throw new Error('Cannot delete admin user');

    await prisma.user.delete({ where: { id } });
    await prisma.log.create({
      data: { userId: actorId, action: LogAction.USER_DELETE, success: true, details: { deletedUserId: id } },
    });
  }

  static async adjustBalance(
    userId: string,
    amount: number,
    type: 'TOPUP' | 'DEDUCT',
    description: string,
    actorId: string
  ): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (type === 'DEDUCT' && user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    const balanceBefore = user.balance;
    const balanceAfter = type === 'TOPUP' ? user.balance + amount : user.balance - amount;

    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
        select: { id: true, username: true, balance: true },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: type === 'TOPUP' ? 'TOPUP' : 'DEDUCT',
          amount,
          balanceBefore,
          balanceAfter,
          description,
          reference: generateReference(),
        },
      }),
    ]);

    await prisma.log.create({
      data: {
        userId: actorId,
        action: type === 'TOPUP' ? LogAction.BALANCE_TOPUP : LogAction.BALANCE_DEDUCT,
        success: true,
        details: { targetUserId: userId, amount, type },
      },
    });

    return { user: updatedUser, transaction } as unknown as Record<string, unknown>;
  }
}
