import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { layout, bgColor, font } = await req.json();

    const data: Record<string, string> = {};

    if (layout !== undefined) {
      const valid = ['grid', 'editorial', 'book', 'network'];
      if (!valid.includes(layout)) return NextResponse.json({ error: 'Invalid layout' }, { status: 400 });
      data.portfolioLayout = layout;
    }

    if (bgColor !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(bgColor)) return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
      data.portfolioBgColor = bgColor;
    }

    if (font !== undefined) {
      const validFonts = ['default', 'nanum-myeongjo', 'mona12', 'school-safety', 'yoon-cho-woo-san', 'yangjin'];
      if (!validFonts.includes(font)) return NextResponse.json({ error: 'Invalid font' }, { status: 400 });
      data.portfolioFont = font;
    }

    await db.user.update({ where: { id: session.user.id }, data });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PORTFOLIO_LAYOUT_PUT]', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
