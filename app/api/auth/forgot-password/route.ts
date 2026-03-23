import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ ok: true });

    // Delete existing tokens for this email
    await db.passwordResetToken.deleteMany({ where: { email: email.toLowerCase() } });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: { email: email.toLowerCase(), token, expires },
    });

    await sendPasswordResetEmail(email.toLowerCase(), token);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ error: '메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
