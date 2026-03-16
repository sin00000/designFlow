import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('[USER_ACCOUNT_DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
