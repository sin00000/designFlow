import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { generateSlug } from '@/lib/utils';

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

    const portfolioItem = await db.portfolio.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
            progress: true,
            description: true,
            coverImage: true,
          },
        },
      },
    });

    if (!portfolioItem) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    return NextResponse.json({ data: portfolioItem });
  } catch (error) {
    console.error('[PORTFOLIO_GET_ONE]', error);
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

    const portfolioItem = await db.portfolio.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!portfolioItem) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, imageUrl, tags, isPublic, layout, template, coverColor, mediaItems, videoUrl, linkUrl } = body;

    let slug = portfolioItem.publicSlug;

    // Generate slug if making public for the first time
    if (isPublic && !portfolioItem.publicSlug) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { username: true },
      });
      const baseSlug = generateSlug(title || portfolioItem.title);
      const username = user?.username || session.user.id.slice(0, 8);
      slug = `${username}-${baseSlug}-${Date.now().toString(36)}`;
    }

    const updated = await db.portfolio.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(isPublic !== undefined && { isPublic }),
        ...(isPublic !== undefined && { publicSlug: isPublic ? slug : null }),
        ...(layout !== undefined && { layout }),
        ...(template !== undefined && { template }),
        ...(coverColor !== undefined && { coverColor }),
        ...(mediaItems !== undefined && { mediaItems: JSON.stringify(mediaItems) }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
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

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[PORTFOLIO_PUT]', error);
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

    const portfolioItem = await db.portfolio.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!portfolioItem) {
      return NextResponse.json({ error: 'Portfolio item not found' }, { status: 404 });
    }

    await db.portfolio.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Portfolio item deleted' });
  } catch (error) {
    console.error('[PORTFOLIO_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
