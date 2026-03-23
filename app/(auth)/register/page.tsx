'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import StarEyeLogo from '@/components/icons/StarEyeLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useToast from '@/lib/hooks/use-toast';
import { useT } from '@/lib/i18n';

export default function RegisterPage() {
  const toast = useToast();
  const t = useT();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t.common.required;
    if (!formData.email) newErrors.email = t.auth.login.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t.auth.login.emailInvalid;
    }
    if (!formData.password) newErrors.password = t.auth.login.passwordRequired;
    else if (formData.password.length < 8) {
      newErrors.password = t.settings.pwTooShort;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.settings.pwNoMatch;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes('email already exists')) {
          setErrors({ email: '이미 사용 중인 이메일입니다.' });
        } else {
          toast.error(data.error || '회원가입에 실패했습니다.');
        }
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: formData.email.toLowerCase(),
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error(t.auth.register.signInFailed);
        window.location.href = '/login';
        return;
      }

      toast.success(t.auth.register.welcome);

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
      toast.error(t.auth.register.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-green-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <StarEyeLogo size={48} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t.auth.register.title}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t.auth.register.subtitle}</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.auth.register.name}
              type="text"
              placeholder={t.auth.register.namePlaceholder}
              value={formData.name}
              onChange={handleChange('name')}
              error={errors.name}
              leftIcon={<User size={16} />}
              autoComplete="name"
            />

            <Input
              label={t.auth.register.email}
              type="email"
              placeholder={t.auth.register.emailPlaceholder}
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
              leftIcon={<Mail size={16} />}
              autoComplete="email"
            />

            <div>
              <Input
                label={t.auth.register.password}
                type={showPassword ? 'text' : 'password'}
                placeholder={t.auth.register.passwordPlaceholder}
                value={formData.password}
                onChange={handleChange('password')}
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
                autoComplete="new-password"
              />
            </div>

            <Input
              label={t.auth.register.confirmPassword}
              type={showPassword ? 'text' : 'password'}
              placeholder={t.auth.register.confirmPlaceholder}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
              leftIcon={<Lock size={16} />}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              size="lg"
            >
              {t.auth.register.submit}
            </Button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            디자인플로우를 시작하세요.{' '}
            <Link href="/login" className="font-medium transition-colors" style={{ color: 'var(--accent-primary)' }}>
              {t.auth.register.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
