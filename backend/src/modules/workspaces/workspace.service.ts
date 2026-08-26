import { prisma } from '../../config/prisma.js';
import { ERROR_CODES, ROLES, WorkspaceRoleType } from '../../constants/index.js';
import { AppError } from '../../middleware/errorHandler.js';

export class WorkspaceService {
  static async listUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                members: true,
                rooms: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      userRole: m.role,
      allowedRoomIds: m.allowedRoomIds,
    }));
  }

  static async createWorkspace(userId: string, data: { name: string; description?: string }) {
    const slugBase = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: ROLES.OWNER,
        },
      });

      // Create default General section and Room
      const section = await tx.section.create({
        data: {
          workspaceId: workspace.id,
          title: 'General',
          position: 0,
        },
      });

      await tx.room.create({
        data: {
          workspaceId: workspace.id,
          sectionId: section.id,
          name: 'Main Space',
          icon: '🏠',
          position: 0,
        },
      });

      return workspace;
    });
  }

  static async getWorkspaceDetails(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        sections: {
          orderBy: { position: 'asc' },
          include: {
            rooms: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Workspace not found', 404);
    }

    return workspace;
  }

  static async updateWorkspace(workspaceId: string, data: { name?: string; description?: string }) {
    return prisma.workspace.update({
      where: { id: workspaceId },
      data,
    });
  }

  static async inviteMember(
    workspaceId: string,
    email: string,
    role: WorkspaceRoleType,
    allowedRoomIds: string[] = []
  ) {
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        'No user found with this email address. They must register first.',
        404
      );
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        'User is already a member of this workspace',
        409
      );
    }

    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role,
        allowedRoomIds,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  static async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRoleType,
    allowedRoomIds?: string[]
  ) {
    // If demoting from owner, check if other owners exist
    if (role !== ROLES.OWNER) {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: ROLES.OWNER },
      });
      const target = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId } },
      });

      if (target?.role === ROLES.OWNER && ownerCount <= 1) {
        throw new AppError(
          ERROR_CODES.FORBIDDEN,
          'Cannot demote or remove the last Owner of the workspace. Transfer ownership first.',
          403
        );
      }
    }

    return prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      data: {
        role,
        ...(allowedRoomIds ? { allowedRoomIds } : {}),
      },
    });
  }

  static async removeMember(workspaceId: string, userId: string) {
    const ownerCount = await prisma.workspaceMember.count({
      where: { workspaceId, role: ROLES.OWNER },
    });
    const target = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (target?.role === ROLES.OWNER && ownerCount <= 1) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Cannot remove the last Owner of the workspace. Transfer ownership first.',
        403
      );
    }

    return prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }
}
