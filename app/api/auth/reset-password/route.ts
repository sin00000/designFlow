import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });

    const record = await db.passwordResetToken.findUnique({ where: { token } });
    if (!record) return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 400 });
    if (record.expires < new Date()) {
      await db.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: '링크가 만료되었습니다. 다시 요청해주세요.' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await db.user.update({ where: { email: record.email }, data: { password: hashed } });
    await db.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
