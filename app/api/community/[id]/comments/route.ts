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
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const comments = await db.comment.findMany({
      where: { postId: params.id },
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
    });

    // Mask anonymous comments
    const maskedComments = comments.map((comment) => ({
      ...comment,
      user: comment.isAnonymous && comment.userId !== currentUserId
        ? { id: 'anonymous', name: 'Anonymous', username: null, image: null, avatar: null }
        : comment.user,
    }));

    return NextResponse.json({ data: maskedComments });
  } catch (error) {
    console.error('[COMMENTS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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

    const body = await request.json();
    const { content, isAnonymous } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: {
        postId: params.id,
        userId: session.user.id,
        content: content.trim(),
        isAnonymous: isAnonymous || false,
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
      },
    });

    // Notify post owner (not if commenting on own post)
    if (post.userId !== session.user.id) {
      const commenterName = comment.isAnonymous ? 'Someone' : (comment.user.name || 'Someone');
      await db.notification.create({
        data: {
          userId: post.userId,
          type: 'COMMENT',
          title: 'New comment on your post',
          body: `${commenterName} commented on "${post.title}"`,
          link: `/community/${params.id}`,
        },
      });
    }

    const maskedComment = {
      ...comment,
      user: comment.isAnonymous
        ? { id: 'anonymous', name: 'Anonymous', username: null, image: null, avatar: null }
        : comment.user,
    };

    return NextResponse.json({ data: maskedComment }, { status: 201 });
  } catch (error) {
    console.error('[COMMENTS_POST]', error);
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

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    const comment = await db.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('[COMMENTS_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
