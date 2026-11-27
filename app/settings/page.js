'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, Button, Input, Select, LoadingState, InstagramIcon as Instagram } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useAuth, useToast } from '@/components/providers';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    currency: user?.currency || 'INR',
    timezone: user?.timezone || 'Asia/Kolkata',
  });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [svcForm, setSvcForm] = useState({ name: '', defaultPrice: '' });
  const [tagForm, setTagForm] = useState({ name: '', color: '#6366f1' });

  const { data: igStatus, isLoading: loadingIg } = useQuery({
    queryKey: ['ig-status'],
    queryFn: () => apiFetch('/integrations/instagram/status'),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiFetch('/services'),
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiFetch('/tags'),
  });

  const updateProfile = useMutation({
    mutationFn: (payload) => apiFetch('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await refreshUser();
      toast('Profile settings saved');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const updatePassword = useMutation({
    mutationFn: (payload) => apiFetch('/auth/password', { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setPwdForm({ currentPassword: '', newPassword: '' });
      toast('Password updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const createService = useMutation({
    mutationFn: (payload) => apiFetch('/services', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setSvcForm({ name: '', defaultPrice: '' });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast('Service added');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const createTag = useMutation({
    mutationFn: (payload) => apiFetch('/tags', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setTagForm({ name: '', color: '#6366f1' });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast('Tag added');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const deleteTag = useMutation({
    mutationFn: (id) => apiFetch(`/tags/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast('Tag removed');
    },
  });

  const handleConnectInstagram = async () => {
    try {
      const res = await apiFetch('/integrations/instagram/connect?mode=json');
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const disconnectIg = useMutation({
    mutationFn: (accountId) => apiFetch(`/integrations/instagram/disconnect/${accountId}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ig-status'] });
      toast('Instagram account disconnected');
    },
  });

  return (
    <AppShell title="Settings" subtitle="Workspace preferences, services, tags, and Instagram integration">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instagram Integration */}
        <Card className="p-5 space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-indigo-600 text-white flex items-center justify-center">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Instagram Integration</h2>
                <p className="text-xs text-slate-500">
                  Official Meta OAuth connection (never stores Instagram passwords)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  igStatus?.connected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {igStatus?.connected ? 'Connected' : 'Not Connected'}
              </span>
              <Button onClick={handleConnectInstagram}>Connect Instagram</Button>
            </div>
          </div>

          {loadingIg ? (
            <LoadingState message="Checking Instagram integration..." />
          ) : !igStatus?.configured ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Meta API credentials are not configured yet (Development Mode)</p>
                <p className="mt-0.5 text-amber-800">
                  The CRM works completely without Meta credentials. To enable live Instagram OAuth &amp; Webhooks,
                  set <code>META_APP_ID</code>, <code>META_APP_SECRET</code>, <code>META_REDIRECT_URI</code>, and{' '}
                  <code>META_WEBHOOK_VERIFY_TOKEN</code> in <code>backend/.env</code>.
                </p>
              </div>
            </div>
          ) : igStatus?.accounts?.length > 0 ? (
            <div className="space-y-2">
              {igStatus.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-900">@{acc.username}</span>
                    <span className="text-xs text-slate-500">({acc.accountType})</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => disconnectIg.mutate(acc.id)}>
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        {/* Profile & Preferences */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Profile &amp; Regional Settings</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfile.mutate(profileForm);
            }}
            className="space-y-3"
          >
            <Input
              label="Full Name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Currency"
                value={profileForm.currency}
                onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
              <Input
                label="Timezone"
                value={profileForm.timezone}
                onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              Save Profile
            </Button>
          </form>
        </Card>

        {/* Security */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Security</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePassword.mutate(pwdForm);
            }}
            className="space-y-3"
          >
            <Input
              label="Current Password"
              type="password"
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              required
            />
            <Input
              label="New Password"
              type="password"
              minLength={6}
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              required
            />
            <Button type="submit" variant="secondary" disabled={updatePassword.isPending}>
              Update Password
            </Button>
          </form>
        </Card>

        {/* Services Management */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Services Catalog</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createService.mutate({
                name: svcForm.name,
                defaultPrice: Number(svcForm.defaultPrice || 0),
              });
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Service name (e.g. SEO)"
              value={svcForm.name}
              onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })}
              className="flex-1"
              required
            />
            <Input
              placeholder="Default price"
              type="number"
              value={svcForm.defaultPrice}
              onChange={(e) => setSvcForm({ ...svcForm, defaultPrice: e.target.value })}
              className="w-32"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </form>
          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
            {services.map((s) => (
              <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800">{s.name}</span>
                <span className="text-slate-500">{formatCurrency(s.defaultPrice, s.currency)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tags Management */}
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Tags</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createTag.mutate(tagForm);
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Tag name (e.g. Hot Lead)"
              value={tagForm.name}
              onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
              className="flex-1"
              required
            />
            <input
              type="color"
              value={tagForm.color}
              onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
              className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
                <button onClick={() => deleteTag.mutate(t.id)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

