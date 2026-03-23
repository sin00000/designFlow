'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import StarEyeLogo from '@/components/icons/StarEyeLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useToast from '@/lib/hooks/use-toast';
import { useT } from '@/lib/i18n';

export default function LoginPage() {
  const toast = useToast();
  const t = useT();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = t.auth.login.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t.auth.login.emailInvalid;
    if (!password) newErrors.password = t.auth.login.passwordRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'No account found with this email') {
          setErrors({ email: t.auth.login.emailRequired });
        } else if (result.error === 'Invalid password') {
          setErrors({ password: t.auth.login.loginFailed });
        } else {
          toast.error(t.auth.login.loginFailed);
        }
        return;
      }

      toast.success(t.auth.login.welcomeBack);

      // Migrate guest portfolio items if any
      try {
        const raw = localStorage.getItem('dr_wep_guest');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.items?.length > 0) {
            await fetch('/api/portfolio/migrate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: parsed.items }),
            });
            localStorage.removeItem('dr_wep_guest');
          }
        }
      } catch {}

      window.location.href = '/';
    } catch {
      toast.error(t.auth.login.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Background gradient */}
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
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <StarEyeLogo size={48} className="mb-3" />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(34,197,94,0.08))',
              border: '1px solid rgba(22,163,74,0.3)',
              color: '#16a34a',
            }}
          >
            <span>✦</span>
            <span>당신을 위한 디자인 요정</span>
            <span>✦</span>
          </motion.div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.auth.login.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t.auth.login.subtitle}</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.auth.login.email}
              type="email"
              placeholder={t.auth.register.emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={errors.email}
              leftIcon={<Mail size={16} />}
              autoComplete="email"
            />

            <Input
              label={t.auth.login.password}
              type={showPassword ? 'text' : 'password'}
              placeholder={t.auth.register.passwordPlaceholder}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
              }}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              size="lg"
            >
              {t.auth.login.submit}
            </Button>
          </form>

          <div className="text-center mt-3">
            <Link
              href="/forgot-password"
              className="text-sm transition-colors hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              비밀번호를 잃어버리셨나요?
            </Link>
          </div>

          <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border-default)' }}>
            <Link
              href="/register"
              className="flex items-center justify-center w-full py-3 rounded-2xl text-base font-semibold transition-all hover:opacity-90"
              style={{
                background: 'rgba(var(--accent-primary-rgb),0.1)',
                color: 'var(--accent-primary)',
                border: '1.5px solid rgba(var(--accent-primary-rgb),0.3)',
              }}
            >
              계정 만들기
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
