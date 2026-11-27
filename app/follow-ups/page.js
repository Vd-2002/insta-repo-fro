'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, CalendarClock, XCircle } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useToast } from '@/components/providers';

export default function FollowUpsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState('PENDING');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ contactId: '', title: '', dueAt: '', notes: '' });

  const { data: followUps = [], isLoading, error, refetch } = useQuery({
    queryKey: ['followups', filter],
    queryFn: () => {
      if (filter === 'TODAY') return apiFetch('/followups?due=today');
      return apiFetch(`/followups${filter ? `?status=${filter}` : ''}`);
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiFetch('/contacts'),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => apiFetch('/followups', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
      toast('Follow-up scheduled');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) =>
      apiFetch(`/followups/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Follow-up updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const setQuickDays = (days) => {
    const dt = new Date(Date.now() + days * 86400 * 1000);
    dt.setHours(16, 0, 0, 0);
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm((f) => ({ ...f, dueAt: localIso }));
  };

  return (
    <AppShell
      title="Follow-ups"
      subtitle="Never miss an outreach or quotation follow-up"
      actions={
        <Button
          size="sm"
          onClick={() => {
            setQuickDays(1);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Schedule Follow-up
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'PENDING', label: 'Pending' },
            { key: 'TODAY', label: 'Due Today / Overdue' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingState message="Loading follow-ups..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : followUps.length === 0 ? (
          <EmptyState
            title="No follow-ups in this view"
            description="Schedule a follow-up for any lead or opportunity."
          />
        ) : (
          <div className="space-y-3">
            {followUps.map((fu) => {
              const isDue = fu.status === 'PENDING' && new Date(fu.dueAt) <= new Date();
              return (
                <Card key={fu.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{fu.title}</h3>
                      <StatusBadge
                        status={fu.status}
                        label={isDue ? 'Follow-up Due' : undefined}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {fu.contact?.name} {fu.contact?.company?.name ? `(${fu.contact.company.name})` : ''} · Due{' '}
                      {formatDateTime(fu.dueAt)}
                    </p>
                    {fu.notes && <p className="text-xs text-slate-600">{fu.notes}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {fu.leadId && (
                      <Link href={`/leads/${fu.leadId}`}>
                        <Button variant="secondary" size="sm">
                          Open Lead
                        </Button>
                      </Link>
                    )}
                    {fu.status === 'PENDING' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: fu.id, status: 'COMPLETED' })}
                        >
                          <Check className="w-3.5 h-3.5" /> Complete
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const nextDay = new Date(Date.now() + 2 * 86400 * 1000).toISOString();
                            updateMutation.mutate({ id: fu.id, status: 'RESCHEDULED', dueAt: nextDay });
                          }}
                        >
                          <CalendarClock className="w-3.5 h-3.5" /> +2 Days
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: fu.id, status: 'CANCELLED' })}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Follow-up">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              contactId: form.contactId,
              title: form.title,
              dueAt: new Date(form.dueAt).toISOString(),
              notes: form.notes,
            });
          }}
          className="space-y-3"
        >
          <Select
            label="Contact *"
            value={form.contactId}
            onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            required
          >
            <option value="">Select contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.company?.name ? `(${c.company.name})` : ''}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 5, 7].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setQuickDays(d)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 hover:bg-indigo-50"
              >
                +{d} {d === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>
          <Input
            label="Reminder *"
            placeholder="Follow up regarding website quotation"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Due Date & Time *"
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            required
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

