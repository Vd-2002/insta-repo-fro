'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Video, CheckCircle2 } from 'lucide-react';
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

export default function MeetingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [outcome, setOutcome] = useState('INTERESTED');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const [form, setForm] = useState({
    contactId: '',
    title: '',
    scheduledAt: '',
    durationMinutes: '30',
    meetingType: 'ONLINE',
    meetingLink: '',
    notes: '',
  });

  const { data: meetings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['meetings', filter],
    queryFn: () => apiFetch(`/meetings${filter ? `?filter=${filter}` : ''}`),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiFetch('/contacts'),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => apiFetch('/meetings', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreateOpen(false);
      toast('Meeting scheduled');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) =>
      apiFetch(`/meetings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCompleteTarget(null);
      toast('Meeting updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  return (
    <AppShell
      title="Meetings"
      subtitle="Schedule calls, track today's meetings, and record outcomes"
      actions={
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Schedule Meeting
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: '', label: 'All Meetings' },
            { key: 'today', label: 'Today' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key || 'all'}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
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
          <LoadingState message="Loading meetings..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : meetings.length === 0 ? (
          <EmptyState
            title="No meetings found"
            description="Schedule a discovery or proposal review meeting with your lead."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((m) => (
              <Card key={m.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{m.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {m.contact?.name} {m.company?.name ? `· ${m.company.name}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <span className="font-medium text-slate-800">When:</span> {formatDateTime(m.scheduledAt)} (
                    {m.durationMinutes} min)
                  </p>
                  {m.meetingLink && (
                    <a
                      href={m.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Meeting Link
                    </a>
                  )}
                  {m.outcome && (
                    <p>
                      <span className="font-medium text-slate-800">Outcome:</span>{' '}
                      <StatusBadge status={m.outcome} />
                    </p>
                  )}
                  {m.notes && <p className="text-slate-500 pt-1">{m.notes}</p>}
                </div>

                {m.status === 'SCHEDULED' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        setCompleteTarget(m);
                        setOutcome('INTERESTED');
                        setOutcomeNotes(m.notes || '');
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Complete &amp; Log Outcome
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateMutation.mutate({ id: m.id, status: 'CANCELLED' })}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Schedule Meeting">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              ...form,
              scheduledAt: new Date(form.scheduledAt).toISOString(),
              durationMinutes: Number(form.durationMinutes),
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
          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date & Time *"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              required
            />
            <Input
              label="Duration (min)"
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            />
          </div>
          <Input
            label="Meeting Link"
            placeholder="https://meet.google.com/..."
            value={form.meetingLink}
            onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Meeting Modal */}
      <Modal
        open={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        title="Complete Meeting & Select Outcome"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate({
              id: completeTarget.id,
              status: 'COMPLETED',
              outcome,
              notes: outcomeNotes,
            });
          }}
          className="space-y-3"
        >
          <Select label="Meeting Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="INTERESTED">Interested</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="NEED_CHANGES">Need Changes</option>
            <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="DEAL_WON">Deal Won</option>
            <option value="DEAL_LOST">Deal Lost</option>
          </Select>
          <Textarea
            label="Meeting Notes"
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCompleteTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" disabled={updateMutation.isPending}>
              Mark Completed
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

