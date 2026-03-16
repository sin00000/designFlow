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
    const post = await db.communityPost.findUnique({
      where: { id: params.id },
      select: {
        averageRating: true,
        ratingCount: true,
        ratings: {
          select: { value: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Rating distribution
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: post.ratings.filter((r) => r.value === star).length,
    }));

    return NextResponse.json({
      data: {
        average: post.averageRating,
        count: post.ratingCount,
        distribution,
      },
    });
  } catch (error) {
    console.error('[RATINGS_GET]', error);
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

    const body = await request.json();
    const { value } = body;

    if (!value || value < 1 || value > 5 || !Number.isInteger(value)) {
      return NextResponse.json(
        { error: 'Rating value must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    const post = await db.communityPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if already rated (to avoid duplicate notifications)
    const existingRating = await db.rating.findUnique({
      where: { postId_userId: { postId: params.id, userId: session.user.id } },
    });

    await db.rating.upsert({
      where: {
        postId_userId: {
          postId: params.id,
          userId: session.user.id,
        },
      },
      create: {
        postId: params.id,
        userId: session.user.id,
        value,
      },
      update: { value },
    });

    // Recalculate average
    const allRatings = await db.rating.findMany({
      where: { postId: params.id },
      select: { value: true },
    });

    const avg = allRatings.reduce((sum, r) => sum + r.value, 0) / allRatings.length;
    const rounded = Math.round(avg * 10) / 10;

    await db.communityPost.update({
      where: { id: params.id },
      data: {
        averageRating: rounded,
        ratingCount: allRatings.length,
      },
    });

    // Notify post owner only on first-time rating (not updates)
    if (!existingRating && post.userId !== session.user.id) {
      await db.notification.create({
        data: {
          userId: post.userId,
          type: 'RATING',
          title: 'New rating on your post',
          body: `Someone gave "${post.title}" ${value} star${value === 1 ? '' : 's'}`,
          link: `/community/${params.id}`,
        },
      });
    }

    return NextResponse.json({
      data: {
        average: rounded,
        count: allRatings.length,
        userRating: value,
      },
    });
  } catch (error) {
    console.error('[RATINGS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
