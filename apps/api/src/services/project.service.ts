import { prisma } from './prisma.service.js';
import { CreateProjectInput, UpdateProjectInput } from '@vulnsight/validation';

export class ProjectService {
  /**
   * Get all projects for a given user (or default user in demo mode)
   */
  public static async listProjects(userId?: string) {
    const where = userId ? { userId } : {};
    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            targets: true,
            scans: true,
          },
        },
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? undefined,
      userId: p.userId,
      targetCount: p._count.targets,
      scanCount: p._count.scans,
      lastScanAt: p.scans[0]?.createdAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  public static async getProjectById(id: string, userId?: string) {
    const where: { id: string; userId?: string } = { id };
    if (userId) where.userId = userId;

    const project = await prisma.project.findFirst({
      where,
      include: {
        targets: true,
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { targets: true, scans: true },
        },
      },
    });

    return project;
  }

  public static async createProject(data: CreateProjectInput, userId: string) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        userId,
      },
    });
  }

  public static async updateProject(id: string, data: UpdateProjectInput, userId?: string) {
    const where: { id: string; userId?: string } = { id };
    if (userId) where.userId = userId;

    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  public static async deleteProject(id: string, userId?: string) {
    const where: { id: string; userId?: string } = { id };
    if (userId) where.userId = userId;

    return prisma.project.delete({
      where: { id },
    });
  }
}
