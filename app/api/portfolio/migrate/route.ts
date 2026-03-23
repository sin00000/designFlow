import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { items } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ migrated: 0 });
  }

  const created = await db.$transaction(
    items.map((item: {
      title: string;
      description?: string | null;
      imageUrl?: string | null;
      tags?: string[];
      isPublic?: boolean;
      coverColor?: string;
      linkUrl?: string | null;
    }) =>
      db.portfolio.create({
        data: {
          userId: session.user.id,
          title: item.title,
          description: item.description ?? null,
          imageUrl: item.imageUrl ?? null,
          tags: JSON.stringify(item.tags ?? []),
          isPublic: item.isPublic ?? true,
          coverColor: item.coverColor ?? '#16a34a',
          linkUrl: item.linkUrl ?? null,
          layout: 'grid',
          template: 'grid',
        },
      })
    )
  );

  return NextResponse.json({ migrated: created.length });
}
