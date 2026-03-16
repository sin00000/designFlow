import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { generateSlug } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolioItems = await db.portfolio.findMany({
      where: { userId: session.user.id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ data: portfolioItems });
  } catch (error) {
    console.error('[PORTFOLIO_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, imageUrl, tags, isPublic, layout, coverColor, projectId } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Validate project belongs to user if provided
    if (projectId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId: session.user.id },
      });
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Check if project already has portfolio item
      const existing = await db.portfolio.findFirst({
        where: { projectId },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'This project already has a portfolio item' },
          { status: 400 }
        );
      }
    }

    // Generate unique slug
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });

    let slug = null;
    if (isPublic) {
      const baseSlug = generateSlug(title);
      const username = user?.username || session.user.id.slice(0, 8);
      slug = `${username}-${baseSlug}-${Date.now().toString(36)}`;
    }

    const portfolioItem = await db.portfolio.create({
      data: {
        userId: session.user.id,
        projectId: projectId || null,
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        tags: JSON.stringify(tags || []),
        isPublic: isPublic || false,
        publicSlug: slug,
        layout: layout || 'grid',
        coverColor: coverColor || '#6366f1',
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ data: portfolioItem }, { status: 201 });
  } catch (error) {
    console.error('[PORTFOLIO_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
