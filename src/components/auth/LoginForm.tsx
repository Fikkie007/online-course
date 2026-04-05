'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

interface LoginFormProps {
  callbackUrl?: string;
}

interface EmailCheckResult {
  exists: boolean;
  hasPassword: boolean;
}

declare global {
  interface Window {
    grecaptcha: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailCheck, setEmailCheck] = useState<EmailCheckResult | null>(null);
  const [showGoogleSuggestion, setShowGoogleSuggestion] = useState(false);
  const recaptchaLoaded = useRef(false);

  // Load reCAPTCHA script
  useEffect(() => {
    if (recaptchaLoaded.current) return;

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    recaptchaLoaded.current = true;
  }, []);

  // Check email on blur
  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return;

    setIsCheckingEmail(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setEmailCheck(data);
        if (data.exists && !data.hasPassword) {
          setShowGoogleSuggestion(true);
        } else {
          setShowGoogleSuggestion(false);
        }
      }
    } catch (err) {
      console.error('Error checking email:', err);
    }
    setIsCheckingEmail(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Get reCAPTCHA token
      let recaptchaToken: string | undefined;
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

      if (siteKey && window.grecaptcha) {
        recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'login' });
      }

      const result = await signIn('credentials', {
        email,
        password,
        recaptchaToken,
        redirect: false,
      });

      if (result?.error) {
        setError('Email atau password salah');
        setIsLoading(false);
      } else {
        // Success - redirect
        window.location.href = callbackUrl || '/student';
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailCheck(null);
              setShowGoogleSuggestion(false);
            }}
            onBlur={handleEmailBlur}
            required
            disabled={isLoading}
          />
          {isCheckingEmail && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Masukkan password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* Suggestion for Google users */}
      {showGoogleSuggestion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <p className="text-yellow-800">
            Email ini terdaftar melalui Google.{' '}
            <strong>Silakan login dengan Google</strong> atau{' '}
            <Link href="/set-password" className="underline font-medium">
              buat password
            </Link>{' '}
            untuk login dengan email.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Memproses...' : 'Masuk'}
      </Button>

      <div className="text-center text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Lupa password?
        </Link>
      </div>
    </form>
  );
}