import { PrismaClient, WorkspaceRole, WorkflowStatus, ArtifactType } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Demo Users
  const passwordHash = await argon2.hash('Password123!');

  const userDemo = await prisma.user.upsert({
    where: { email: 'demo@workroom.io' },
    update: {},
    create: {
      email: 'demo@workroom.io',
      passwordHash,
      displayName: 'Demo User',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Demo',
    },
  });

  const userChets = await prisma.user.upsert({
    where: { email: 'chets@workroom.io' },
    update: {},
    create: {
      email: 'chets@workroom.io',
      passwordHash,
      displayName: 'Chets (Lead)',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Chets',
    },
  });

  console.log(` Created users: ${userDemo.email}, ${userChets.email}`);

  // 2. Create Default Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'my-first-team' },
    update: {},
    create: {
      name: 'My First Team',
      slug: 'my-first-team',
      description: 'Main collaborative workspace for WorkRoom',
      members: {
        create: [
          { userId: userDemo.id, role: WorkspaceRole.OWNER },
          { userId: userChets.id, role: WorkspaceRole.EDITOR },
        ],
      },
    },
  });

  console.log(` Created workspace: ${workspace.name}`);

  // 3. Create Section and Room
  const section =
    (await prisma.section.findFirst({
      where: { workspaceId: workspace.id, title: 'Planning & Product' },
    })) ??
    (await prisma.section.create({
      data: {
        workspaceId: workspace.id,
        title: 'Planning & Product',
        position: 0,
      },
    }));

  const room =
    (await prisma.room.findFirst({
      where: { workspaceId: workspace.id, sectionId: section.id, name: 'Sprint Backlog' },
    })) ??
    (await prisma.room.create({
      data: {
        workspaceId: workspace.id,
        sectionId: section.id,
        name: 'Sprint Backlog',
        icon: '🚀',
        position: 0,
      },
    }));

  // 4. Create Sample Workflow Task
  const workflow =
    (await prisma.workflow.findFirst({
      where: {
        workspaceId: workspace.id,
        artifactId: 'postit-1',
        title: 'Design Backend Architecture & Database Models',
      },
    })) ??
    (await prisma.workflow.create({
      data: {
        workspaceId: workspace.id,
        artifactType: ArtifactType.POSTIT_BLOCK,
        artifactId: 'postit-1',
        title: 'Design Backend Architecture & Database Models',
        status: WorkflowStatus.REVIEW,
        createdById: userDemo.id,
        assignees: {
          create: [{ userId: userChets.id }],
        },
      },
    }));

  // 5. Create Sample Comment
  const seedComment = 'PostgreSQL schema with Prisma ORM and RBAC permissions are configured!';
  const existingComment = await prisma.comment.findFirst({
    where: {
      workspaceId: workspace.id,
      workflowId: workflow.id,
      authorId: userChets.id,
      content: seedComment,
    },
  });
  if (!existingComment) {
    await prisma.comment.create({
      data: {
        workspaceId: workspace.id,
        workflowId: workflow.id,
        authorId: userChets.id,
        content: seedComment,
      },
    });
  }

  console.log(' Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
