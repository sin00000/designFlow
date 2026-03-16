import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const tag = searchParams.get('tag') || undefined;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (tag && tag !== 'All') {
      // SQLite: tags stored as JSON string — check if tag name appears in the JSON
      where.tags = { contains: `"${tag}"` };
    }

    const [posts, total] = await Promise.all([
      db.communityPost.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: true,
              ratings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.communityPost.count({ where }),
    ]);

    // Mask user info for anonymous posts
    const maskedPosts = posts.map((post) => ({
      ...post,
      user: post.isAnonymous
        ? { id: 'anonymous', name: 'Anonymous', username: null, image: null, avatar: null }
        : post.user,
    }));

    return NextResponse.json({
      data: maskedPosts,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    console.error('[COMMUNITY_GET]', error);
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
    const { imageUrl, title, description, tags, isAnonymous, projectId } = body;

    if (!imageUrl || !title) {
      return NextResponse.json(
        { error: 'imageUrl and title are required' },
        { status: 400 }
      );
    }

    // Validate project belongs to user if provided
    if (projectId) {
      const project = await db.project.findFirst({
        where: { id: projectId, userId: session.user.id },
      });
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    const post = await db.communityPost.create({
      data: {
        userId: session.user.id,
        imageUrl,
        title,
        description: description || null,
        tags: JSON.stringify(tags || []),
        isAnonymous: isAnonymous || false,
        projectId: projectId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            ratings: true,
          },
        },
      },
    });

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    console.error('[COMMUNITY_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
