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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reference = await db.reference.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        linkedProject: {
          select: { id: true, title: true, status: true, progress: true },
        },
      },
    });

    if (!reference) {
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
    }

    return NextResponse.json({ data: reference });
  } catch (error) {
    console.error('[REFERENCE_GET]', error);
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

    const reference = await db.reference.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!reference) {
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, tags, notes, linkedProjectId } = body;

    // Validate project belongs to user if provided
    if (linkedProjectId !== undefined && linkedProjectId !== null) {
      const project = await db.project.findFirst({
        where: { id: linkedProjectId, userId: session.user.id },
      });
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
    }

    const updated = await db.reference.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(notes !== undefined && { notes }),
        ...(linkedProjectId !== undefined && { linkedProjectId }),
      },
      include: {
        linkedProject: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[REFERENCE_PUT]', error);
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

    const reference = await db.reference.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!reference) {
      return NextResponse.json({ error: 'Reference not found' }, { status: 404 });
    }

    await db.reference.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Reference deleted' });
  } catch (error) {
    console.error('[REFERENCE_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
