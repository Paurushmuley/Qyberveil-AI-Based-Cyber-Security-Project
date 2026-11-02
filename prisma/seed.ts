import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding initial system user and demo project in Qyberveil...');

  const demoPasswordHash = await bcrypt.hash('Qyberveil2026!', 12);

  const user = await prisma.user.upsert({
    where: { id: 'demo-system-user' },
    update: {
      name: 'Security Lead',
      passwordHash: demoPasswordHash,
    },
    create: {
      id: 'demo-system-user',
      email: 'security-lead@qyberveil.local',
      name: 'Security Lead',
      passwordHash: demoPasswordHash,
      role: UserRole.SECURITY_ANALYST,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'demo-qyberveil-project' },
    update: {},
    create: {
      id: 'demo-qyberveil-project',
      name: 'Qyberveil Core API & Web Showcase',
      description: 'Production sample application with authorized API endpoints and baseline security monitoring.',
      userId: user.id,
    },
  });

  await prisma.authorizedTarget.upsert({
    where: { id: 'demo-authorized-target' },
    update: {
      inScopePaths: ['/', '/get', '/post', '/headers', '/cookies'],
    },
    create: {
      id: 'demo-authorized-target',
      projectId: project.id,
      url: 'https://httpbin.org',
      host: 'httpbin.org',
      inScopePaths: ['/', '/get', '/post', '/headers', '/cookies'],
      excludedPaths: ['/delete'],
      isVerified: true,
      verificationMethod: 'DOCUMENTED_AUTHORIZATION',
      verificationStatus: 'VERIFIED',
      authorizationNotes: 'Demonstration testing scope for Qyberveil security assessment.',
    },
  });

  console.log(`✅ Seed completed: User (${user.email}), Project (${project.name})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
