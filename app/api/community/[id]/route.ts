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
    const currentUserId = session?.user?.id;

    const post = await db.communityPost.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            avatar: true,
            bio: true,
          },
        },
        comments: {
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
          },
          orderBy: { createdAt: 'asc' },
        },
        ratings: {
          select: {
            id: true,
            userId: true,
            value: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            userId: true,
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

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Mask user info for anonymous post
    const maskedPost = {
      ...post,
      user: post.isAnonymous && post.userId !== currentUserId
        ? { id: 'anonymous', name: 'Anonymous', username: null, image: null, avatar: null, bio: null }
        : post.user,
      // Mask anonymous comments too
      comments: post.comments.map(comment => ({
        ...comment,
        user: comment.isAnonymous && comment.userId !== currentUserId
          ? { id: 'anonymous', name: 'Anonymous', username: null, image: null, avatar: null }
          : comment.user,
      })),
      // Include current user's rating
      userRating: currentUserId ? post.ratings.find(r => r.userId === currentUserId)?.value || null : null,
      isOwner: currentUserId === post.userId,
    };

    return NextResponse.json({ data: maskedPost });
  } catch (error) {
    console.error('[COMMUNITY_POST_GET]', error);
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

    const post = await db.communityPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.communityPost.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('[COMMUNITY_POST_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
