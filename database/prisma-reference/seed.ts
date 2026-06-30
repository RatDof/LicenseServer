import { PrismaClient, Role, LicenseStatus, LicenseType, TransactionType, LogAction } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 5;
  return Array.from({ length: segments }, () =>
    Array.from({ length: segmentLength }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@licenseserver.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@licenseserver.com',
      password: adminPassword,
      role: Role.ADMIN,
      balance: 10000,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create reseller user
  const resellerPassword = await bcrypt.hash('Reseller@123', 12);
  const reseller = await prisma.user.upsert({
    where: { email: 'reseller@licenseserver.com' },
    update: {},
    create: {
      username: 'reseller1',
      email: 'reseller@licenseserver.com',
      password: resellerPassword,
      role: Role.RESELLER,
      balance: 5000,
      isActive: true,
    },
  });
  console.log('✅ Reseller user created:', reseller.email);

  // Create regular users
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const userPassword = await bcrypt.hash(`User${i}@123`, 12);
    const user = await prisma.user.upsert({
      where: { email: `user${i}@licenseserver.com` },
      update: {},
      create: {
        username: `user${i}`,
        email: `user${i}@licenseserver.com`,
        password: userPassword,
        role: Role.USER,
        balance: Math.floor(Math.random() * 1000),
        isActive: true,
      },
    });
    users.push(user);
    console.log(`✅ User ${i} created:`, user.email);
  }

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { name: 'Basic License' },
      update: {},
      create: {
        name: 'Basic License',
        description: 'Basic access to the platform with standard features',
        price: 9.99,
        isActive: true,
        version: '1.0',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Pro License' },
      update: {},
      create: {
        name: 'Pro License',
        description: 'Professional access with advanced features and priority support',
        price: 29.99,
        isActive: true,
        version: '2.0',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Enterprise License' },
      update: {},
      create: {
        name: 'Enterprise License',
        description: 'Full enterprise access with unlimited features and dedicated support',
        price: 99.99,
        isActive: true,
        version: '3.0',
      },
    }),
    prisma.product.upsert({
      where: { name: 'Lifetime License' },
      update: {},
      create: {
        name: 'Lifetime License',
        description: 'One-time purchase for permanent access',
        price: 299.99,
        isActive: true,
        version: '1.0',
      },
    }),
  ]);
  console.log('✅ Products created:', products.length);

  // Create licenses
  const statuses = [LicenseStatus.ACTIVE, LicenseStatus.SUSPENDED, LicenseStatus.EXPIRED];
  const types = [LicenseType.TIME_LIMITED, LicenseType.PERMANENT, LicenseType.TRIAL];

  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const product = products[i % products.length];
    const type = types[i % types.length];
    const status = statuses[i % statuses.length];
    const expiresAt = type === LicenseType.PERMANENT ? null : new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);

    await prisma.license.create({
      data: {
        key: generateLicenseKey(),
        userId: user.id,
        productId: product.id,
        status,
        type,
        expiresAt,
        maxDevices: Math.floor(Math.random() * 3) + 1,
      },
    });
  }
  console.log('✅ Licenses created: 20');

  // Create transactions for admin
  const txTypes = [TransactionType.TOPUP, TransactionType.LICENSE_PURCHASE, TransactionType.TRANSFER_IN];
  for (let i = 0; i < 10; i++) {
    const amount = Math.floor(Math.random() * 500) + 10;
    await prisma.transaction.create({
      data: {
        userId: admin.id,
        type: txTypes[i % txTypes.length],
        amount,
        balanceBefore: 10000 - amount * i,
        balanceAfter: 10000 - amount * (i - 1),
        description: `Sample transaction ${i + 1}`,
        reference: uuidv4(),
      },
    });
  }
  console.log('✅ Transactions created: 10');

  // Create some logs
  const actions = [LogAction.LOGIN, LogAction.LICENSE_CREATE, LogAction.API_ACCESS, LogAction.LICENSE_UPDATE];
  for (let i = 0; i < 15; i++) {
    await prisma.log.create({
      data: {
        userId: i % 2 === 0 ? admin.id : users[i % users.length].id,
        action: actions[i % actions.length],
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: Math.random() > 0.2,
        details: { info: `Sample log entry ${i + 1}` },
      },
    });
  }
  console.log('✅ Logs created: 15');

  // Create default settings
  const defaultSettings = [
    { key: 'site_name', value: 'LicenseServer', group: 'general' },
    { key: 'site_description', value: 'Professional License Management Platform', group: 'general' },
    { key: 'allow_registration', value: 'true', group: 'auth' },
    { key: 'require_email_verification', value: 'false', group: 'auth' },
    { key: 'max_login_attempts', value: '5', group: 'auth' },
    { key: 'session_timeout', value: '86400', group: 'auth' },
    { key: 'default_license_duration', value: '30', group: 'license' },
    { key: 'max_licenses_per_user', value: '10', group: 'license' },
    { key: 'allow_license_transfer', value: 'true', group: 'license' },
    { key: 'currency', value: 'USD', group: 'billing' },
    { key: 'min_topup', value: '10', group: 'billing' },
    { key: 'maintenance_mode', value: 'false', group: 'system' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Settings created:', defaultSettings.length);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📋 Default Credentials:');
  console.log('   Admin:    admin@licenseserver.com / Admin@123456');
  console.log('   Reseller: reseller@licenseserver.com / Reseller@123');
  console.log('   Users:    user1@licenseserver.com / User1@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
