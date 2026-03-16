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
    const search = searchParams.get('search') || '';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const projectId = searchParams.get('projectId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id,
    };

    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search } },
          { notes: { contains: search } },
        ],
      });
    }

    if (tags.length > 0) {
      // SQLite: tags stored as JSON string — check if any tag name appears in the JSON
      andConditions.push({
        OR: tags.map((tag: string) => ({ tags: { contains: `"${tag}"` } })),
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (projectId) {
      where.linkedProjectId = projectId;
    }

    const [references, total] = await Promise.all([
      db.reference.findMany({
        where,
        include: {
          linkedProject: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.reference.count({ where }),
    ]);

    return NextResponse.json({
      data: references,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error('[REFERENCES_GET]', error);
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
    const { imageUrl, sourceUrl, title, tags, notes, linkedProjectId } = body;

    if (!imageUrl || !title) {
      return NextResponse.json(
        { error: 'imageUrl and title are required' },
        { status: 400 }
      );
    }

    // Validate project belongs to user if provided
    if (linkedProjectId) {
      const project = await db.project.findFirst({
        where: { id: linkedProjectId, userId: session.user.id },
      });
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    const reference = await db.reference.create({
      data: {
        userId: session.user.id,
        imageUrl,
        sourceUrl: sourceUrl || null,
        title,
        tags: JSON.stringify(tags || []),
        notes: notes || null,
        linkedProjectId: linkedProjectId || null,
      },
      include: {
        linkedProject: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    return NextResponse.json({ data: reference }, { status: 201 });
  } catch (error) {
    console.error('[REFERENCES_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
