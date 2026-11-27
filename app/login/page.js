'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth, useToast } from '@/components/providers';
import { apiFetch } from '@/lib/api';
import { Button, Input, Card, InstagramIcon } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [connecting, setConnecting] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('demo@leadflow.io');
  const [password, setPassword] = useState('LeadFlow@123');
  const [submitting, setSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const handleConnectInstagram = async () => {
    setInfoMessage('');
    setConnecting(true);
    try {
      const res = await apiFetch('/integrations/instagram/login?mode=json');
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      setInfoMessage(
        err.message ||
          'Meta API credentials are not configured yet. You can explore the CRM using the Demo Workspace below.'
      );
      setConnecting(false);
    }
  };

  const handleDemoLogin = async () => {
    setInfoMessage('');
    setSubmitting(true);
    try {
      await login('demo@leadflow.io', 'LeadFlow@123');
      toast('Signed in to Demo Workspace');
      router.push('/dashboard');
    } catch (err) {
      setInfoMessage(err.message || 'Demo login failed');
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setInfoMessage('');
    setSubmitting(true);
    try {
      await login(email, password);
      toast('Welcome back to LeadFlow!');
      router.push('/dashboard');
    } catch (err) {
      setInfoMessage(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <InstagramIcon className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LeadFlow</h1>
          <p className="text-sm text-slate-500 mt-1">
            Connect your Instagram account to manage leads &amp; DMs in one place
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <Button
            onClick={handleConnectInstagram}
            disabled={connecting}
            className="w-full py-3 text-sm font-semibold bg-gradient-to-r from-pink-600 via-rose-500 to-indigo-600 hover:opacity-95 text-white border-0 shadow-sm"
          >
            <InstagramIcon className="w-5 h-5" />
            {connecting ? 'Connecting to Instagram...' : 'Connect with your Instagram Account'}
          </Button>

          {infoMessage && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              {infoMessage}
            </div>
          )}

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">or</span>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleDemoLogin}
            disabled={submitting}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {submitting ? 'Opening workspace...' : 'Continue with Demo Workspace'}
          </Button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowEmailLogin((v) => !v)}
              className="text-xs text-slate-500 hover:text-indigo-600 underline"
            >
              {showEmailLogin ? 'Hide email login' : 'Sign in with email & password'}
            </button>
          </div>

          {showEmailLogin && (
            <form onSubmit={handleEmailSubmit} className="space-y-3 pt-2 border-t border-slate-100">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                Sign in <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
