import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || '';

    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const projects = await db.project.findMany({
      where,
      include: {
        _count: {
          select: {
            references: true,
            tasks: true,
          },
        },
        portfolioItem: {
          select: { id: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error('[PROJECTS_GET]', error);
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
    const { title, description, deadline, coverImage } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        userId: session.user.id,
        title,
        description: description || null,
        deadline: deadline ? new Date(deadline) : null,
        coverImage: coverImage || null,
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

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error('[PROJECTS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
