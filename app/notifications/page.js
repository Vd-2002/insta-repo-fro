'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Check } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, Button, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useToast } from '@/components/providers';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('/notifications'),
  });

  const markRead = useMutation({
    mutationFn: (id) => apiFetch(`/notifications/${id}`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiFetch('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast('All notifications marked as read');
    },
  });

  const enableBrowserNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast('Browser notifications are not supported here', 'error');
      return;
    }
    const perm = await Notification.requestPermission();
    toast(perm === 'granted' ? 'Browser notifications enabled' : 'Permission denied', perm === 'granted' ? 'success' : 'error');
  };

  const notifications = data?.notifications || [];

  return (
    <AppShell
      title="Notifications"
      subtitle="Follow-up reminders, meeting alerts, and new Instagram messages"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={enableBrowserNotifications}>
            <Bell className="w-4 h-4" /> Enable Browser Alerts
          </Button>
          <Button size="sm" onClick={() => markAllRead.mutate()} disabled={!data?.unreadCount}>
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingState message="Loading notifications..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : notifications.length === 0 ? (
        <EmptyState title="All caught up" description="You have no notifications right now." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 ${n.isRead ? 'bg-white' : 'bg-indigo-50/40'}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                </div>
                <p className="text-xs text-slate-600">{n.message}</p>
                <p className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>
                  <Check className="w-3.5 h-3.5" /> Read
                </Button>
              )}
            </div>
          ))}
        </Card>
      )}
    </AppShell>
  );
}

