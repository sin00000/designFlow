import { Resend } from 'resend';

export async function sendPasswordResetEmail(email: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: 'DesignFlow <noreply@designflow.app>',
    to: email,
    subject: '비밀번호 재설정 안내',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f9fafb; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0;">DesignFlow</h1>
          <p style="font-size: 13px; color: #6b7280; margin-top: 4px;">당신을 위한 디자인 요정</p>
        </div>
        <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 8px;">비밀번호 재설정</h2>
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
          비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정하세요.<br/>
          이 링크는 <strong>1시간</strong> 후 만료됩니다.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #16a34a; color: #fff; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          비밀번호 재설정
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
          본인이 요청하지 않으셨다면 이 메일을 무시하세요. 비밀번호는 변경되지 않습니다.
        </p>
      </div>
    `,
  });
}
