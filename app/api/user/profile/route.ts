import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        image: true,
        avatar: true,
        portfolioLayout: true,
        portfolioBgColor: true,
        portfolioFont: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            references: true,
            communityPosts: true,
            portfolioItems: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('[USER_PROFILE_GET]', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, username, bio, avatar } = await req.json();

    // Validate username format
    if (username !== undefined && username !== '') {
      if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        return NextResponse.json(
          { error: 'Username must be 3–30 characters: lowercase letters, numbers, underscores only' },
          { status: 400 }
        );
      }
      // Check uniqueness (excluding self)
      const existing = await db.user.findFirst({
        where: { username, NOT: { id: session.user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(username !== undefined && { username: username.trim() || null }),
        ...(bio !== undefined && { bio: bio.trim() || null }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        image: true,
        avatar: true,
      },
    });

    console.log('[USER_PROFILE_PUT] updated:', updated.id, updated.name, updated.username);
    return NextResponse.json({ data: updated, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('[USER_PROFILE_PUT]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
