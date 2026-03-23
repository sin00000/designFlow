'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import StarEyeLogo from '@/components/icons/StarEyeLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useToast from '@/lib/hooks/use-toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error('유효하지 않은 링크입니다.'); return; }
    if (password.length < 8) { toast.error('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (password !== confirm) { toast.error('비밀번호가 일치하지 않습니다.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>유효하지 않은 링크입니다.</p>
        <Link href="/forgot-password" className="text-sm mt-3 inline-block" style={{ color: 'var(--accent-primary)' }}>
          비밀번호 찾기로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-green-500" />
          </div>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>비밀번호가 변경되었습니다</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>잠시 후 로그인 화면으로 이동합니다…</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="새 비밀번호"
              type={showPassword ? 'text' : 'password'}
              placeholder="8자 이상 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <Input
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호를 다시 입력"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            leftIcon={<Lock size={16} />}
            error={confirm && password !== confirm ? '비밀번호가 일치하지 않습니다' : undefined}
          />

          <Button type="submit" variant="primary" fullWidth loading={loading} size="lg"
            disabled={!password || !confirm || password !== confirm}>
            비밀번호 변경
          </Button>
        </form>
      )}

      {!done && (
        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            로그인으로 돌아가기
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>새 비밀번호 설정</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
