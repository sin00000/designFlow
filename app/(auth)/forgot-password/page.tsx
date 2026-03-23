'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import StarEyeLogo from '@/components/icons/StarEyeLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useToast from '@/lib/hooks/use-toast';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-green-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-500/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <StarEyeLogo size={48} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>비밀번호 찾기</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            가입한 이메일로 재설정 링크를 보내드립니다
          </p>
        </div>

        <div className="rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>메일을 보냈습니다</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{email}</span>으로<br />
                비밀번호 재설정 링크를 전송했습니다.<br />
                메일함을 확인해주세요. (유효시간 1시간)
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-xs mt-4 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                다른 이메일로 재시도
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="이메일"
                type="email"
                placeholder="가입한 이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                autoFocus
              />
              <Button type="submit" variant="primary" fullWidth loading={loading} size="lg">
                재설정 링크 보내기
              </Button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={14} />
              로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
