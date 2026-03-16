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

    const userId = session.user.id;

    const [
      projectsCount,
      referencesCount,
      communityPostsCount,
      portfolioItemsCount,
      upcomingDeadlines,
      recentProjects,
      recentReferences,
      recentFeedback,
    ] = await Promise.all([
      db.project.count({ where: { userId, status: { not: 'COMPLETED' } } }),
      db.reference.count({ where: { userId } }),
      db.communityPost.count({ where: { userId } }),
      db.portfolio.count({ where: { userId } }),
      db.project.findMany({
        where: {
          userId,
          deadline: { gte: new Date() },
          status: { not: 'COMPLETED' },
        },
        select: {
          id: true,
          title: true,
          deadline: true,
          progress: true,
          status: true,
        },
        orderBy: { deadline: 'asc' },
        take: 5,
      }),
      db.project.findMany({
        where: { userId },
        include: {
          _count: {
            select: { references: true, tasks: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      db.reference.findMany({
        where: { userId },
        select: {
          id: true,
          imageUrl: true,
          title: true,
          tags: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      db.communityPost.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          imageUrl: true,
          averageRating: true,
          ratingCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    return NextResponse.json({
      data: {
        stats: {
          projectsCount,
          referencesCount,
          communityPostsCount,
          portfolioItemsCount,
        },
        upcomingDeadlines,
        recentProjects,
        recentReferences,
        recentFeedback,
      },
    });
  } catch (error) {
    console.error('[DASHBOARD_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
