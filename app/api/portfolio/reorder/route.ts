import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ids }: { ids: string[] } = await req.json();
    if (!Array.isArray(ids)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    // Update sortOrder for each id in the given order
    await Promise.all(
      ids.map((id, index) =>
        db.portfolio.updateMany({
          where: { id, userId: session.user.id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PORTFOLIO_REORDER]', err);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
