import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        references: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
        },
        workImages: {
          orderBy: { createdAt: 'desc' },
        },
        portfolioItem: true,
        communityPosts: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            averageRating: true,
            ratingCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            references: true,
            tasks: true,
            communityPosts: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error('[PROJECT_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, deadline, progress, status, coverImage } = body;

    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json({ error: 'Progress must be between 0 and 100' }, { status: 400 });
    }

    const updated = await db.project.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(progress !== undefined && { progress: Math.round(progress) }),
        ...(status !== undefined && { status }),
        ...(coverImage !== undefined && { coverImage }),
      },
      include: {
        _count: {
          select: {
            references: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[PROJECT_PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await db.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await db.project.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('[PROJECT_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
