'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Clock,
  FileText,
  Calendar,
  Trophy,
  Sparkles,
  Tag,
  Send,
} from 'lucide-react';
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
  InstagramIcon as Instagram,
} from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDateTime, LEAD_STATUS_COLUMNS } from '@/lib/format';
import { useToast } from '@/components/providers';

function LeadDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [note, setNote] = useState('');
  const [followUpModal, setFollowUpModal] = useState(false);
  const [pricingModal, setPricingModal] = useState(false);
  const [meetingModal, setMeetingModal] = useState(false);
  const [dealModal, setDealModal] = useState(false);

  const [fuForm, setFuForm] = useState({ title: '', dueAt: '', notes: '' });
  const [pricingForm, setPricingForm] = useState({ serviceName: 'Website Development', amount: '35000', notes: '' });
  const [mtgForm, setMtgForm] = useState({ title: '', scheduledAt: '', durationMinutes: '30', meetingLink: '' });
  const [dealForm, setDealForm] = useState({ title: '', serviceName: '', dealValue: '', status: 'WON', paymentStatus: 'PENDING' });

  const { data: lead, isLoading, error, refetch } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => apiFetch(`/leads/${id}`),
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['lead', id] });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status) => apiFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      refreshAll();
      toast('Lead status updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const noteMutation = useMutation({
    mutationFn: (text) => apiFetch(`/leads/${id}/notes`, { method: 'POST', body: JSON.stringify({ note: text }) }),
    onSuccess: () => {
      setNote('');
      refreshAll();
      toast('Note added');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const fuMutation = useMutation({
    mutationFn: (payload) => apiFetch('/followups', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setFollowUpModal(false);
      refreshAll();
      toast('Follow-up scheduled');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const pricingMutation = useMutation({
    mutationFn: (payload) => apiFetch('/quotations/pricings', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setPricingModal(false);
      refreshAll();
      toast('Pricing shared recorded');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const meetingMutation = useMutation({
    mutationFn: (payload) => apiFetch('/meetings', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setMeetingModal(false);
      refreshAll();
      toast('Meeting scheduled');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const dealMutation = useMutation({
    mutationFn: (payload) => apiFetch('/deals', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setDealModal(false);
      refreshAll();
      toast('Deal recorded!');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const setQuickFollowUpDays = (days) => {
    const dt = new Date(Date.now() + days * 86400 * 1000);
    dt.setHours(16, 0, 0, 0);
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFuForm((f) => ({ ...f, dueAt: localIso }));
  };

  if (isLoading) {
    return (
      <AppShell title="Lead Detail">
        <LoadingState message="Loading lead details..." />
      </AppShell>
    );
  }
  if (error || !lead) {
    return (
      <AppShell title="Lead Detail">
        <ErrorState message={error?.message || 'Lead not found'} onRetry={refetch} />
      </AppShell>
    );
  }

  const conversations = lead.contact?.conversations || [];

  return (
    <AppShell
      title={lead.company?.name || lead.contact?.name}
      subtitle={`Lead · ${lead.source} · ${lead.contact?.instagramUsername ? `@${lead.contact.instagramUsername}` : ''}`}
      actions={
        <Link href="/leads">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" /> Back to Pipeline
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Section */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact Information */}
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{lead.contact?.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{lead.company?.name || 'Independent Contact'}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
                  {lead.contact?.instagramUsername && (
                    <span className="flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-500" />@{lead.contact.instagramUsername}
                    </span>
                  )}
                  {lead.contact?.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {lead.contact.email}
                    </span>
                  )}
                  {lead.contact?.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {lead.contact.phone}
                    </span>
                  )}
                  {lead.company?.website && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {lead.company.website}
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/customers/${lead.contactId}`}>
                <Button variant="secondary" size="sm">
                  View Full Contact Profile
                </Button>
              </Link>
            </div>
          </Card>

          {/* Conversation Preview */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Conversation History</h3>
              <Link href="/inbox" className="text-xs font-medium text-indigo-600 hover:underline">
                Open in Inbox
              </Link>
            </div>
            {conversations.length > 0 && conversations[0].messages?.length > 0 ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {conversations[0].messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.direction === 'OUTBOUND' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${
                        msg.direction === 'OUTBOUND'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-800'
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {formatDateTime(msg.sentAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No messages recorded yet.</p>
            )}
          </Card>

          {/* Add Note */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Add Internal Note</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Write a note about this lead..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => note.trim() && noteMutation.mutate(note)}
                disabled={noteMutation.isPending || !note.trim()}
              >
                <Send className="w-3.5 h-3.5" /> Save Note
              </Button>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity Timeline</h3>
            <div className="space-y-3.5">
              {lead.activityLogs?.length ? (
                lead.activityLogs.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{act.title}</p>
                      {act.description && <p className="text-slate-600 mt-0.5">{act.description}</p>}
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(act.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No activity recorded yet.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Lead Status</span>
              <StatusBadge status={lead.status} />
            </div>
            <Select
              label="Change Stage"
              value={lead.status}
              onChange={(e) => statusMutation.mutate(e.target.value)}
            >
              {LEAD_STATUS_COLUMNS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
              <option value="LOST">Lost</option>
              <option value="ARCHIVED">Archived</option>
            </Select>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-medium text-slate-900">{lead.service?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Value</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(lead.estimatedValue, lead.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Next Follow-up</span>
                <span className="font-medium text-slate-900">
                  {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : 'Not scheduled'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Quick Actions
            </h3>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => {
                setQuickFollowUpDays(2);
                setFuForm((f) => ({ ...f, title: `Follow up with ${lead.contact?.name}` }));
                setFollowUpModal(true);
              }}
            >
              <Clock className="w-4 h-4 text-amber-600" /> Schedule Follow-up
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => {
                setPricingForm({
                  serviceName: lead.service?.name || 'Website Development',
                  amount: String(lead.estimatedValue || 35000),
                  notes: '',
                });
                setPricingModal(true);
              }}
            >
              <Tag className="w-4 h-4 text-violet-600" /> Share Pricing
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push(`/quotations?new=1&contactId=${lead.contactId}&leadId=${lead.id}`)}
            >
              <FileText className="w-4 h-4 text-indigo-600" /> Create Quotation
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => {
                setMtgForm({
                  title: `Discovery Call - ${lead.company?.name || lead.contact?.name}`,
                  scheduledAt: '',
                  durationMinutes: '30',
                  meetingLink: '',
                });
                setMeetingModal(true);
              }}
            >
              <Calendar className="w-4 h-4 text-cyan-600" /> Schedule Meeting
            </Button>
            <Button
              variant="success"
              className="w-full justify-start"
              onClick={() => {
                setDealForm({
                  title: `${lead.company?.name || lead.contact?.name} - ${lead.service?.name || 'Service'}`,
                  serviceName: lead.service?.name || 'Website Development',
                  dealValue: String(lead.estimatedValue || 35000),
                  status: 'WON',
                  paymentStatus: 'PENDING',
                });
                setDealModal(true);
              }}
            >
              <Trophy className="w-4 h-4" /> Mark Deal Done
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => router.push(`/opportunities?new=1&contactId=${lead.contactId}`)}
            >
              <Sparkles className="w-4 h-4 text-purple-600" /> Create Opportunity
            </Button>
          </Card>

          {/* Tags */}
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {lead.contact?.tags?.length ? (
                lead.contact.tags.map((ct) => (
                  <span
                    key={ct.tagId}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    {ct.tag.name}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">No tags assigned</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Follow-up Modal */}
      <Modal open={followUpModal} onClose={() => setFollowUpModal(false)} title="Schedule Follow-up">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fuMutation.mutate({
              contactId: lead.contactId,
              leadId: lead.id,
              title: fuForm.title,
              dueAt: new Date(fuForm.dueAt).toISOString(),
              notes: fuForm.notes,
            });
          }}
          className="space-y-3"
        >
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 5, 7].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setQuickFollowUpDays(d)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300"
              >
                +{d} {d === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>
          <Input
            label="Reminder Title *"
            value={fuForm.title}
            onChange={(e) => setFuForm({ ...fuForm, title: e.target.value })}
            required
          />
          <Input
            label="Date & Time *"
            type="datetime-local"
            value={fuForm.dueAt}
            onChange={(e) => setFuForm({ ...fuForm, dueAt: e.target.value })}
            required
          />
          <Textarea
            label="Notes"
            value={fuForm.notes}
            onChange={(e) => setFuForm({ ...fuForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setFollowUpModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={fuMutation.isPending}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pricing Modal */}
      <Modal open={pricingModal} onClose={() => setPricingModal(false)} title="Record Pricing Shared">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pricingMutation.mutate({
              contactId: lead.contactId,
              leadId: lead.id,
              serviceName: pricingForm.serviceName,
              amount: Number(pricingForm.amount),
              notes: pricingForm.notes,
            });
          }}
          className="space-y-3"
        >
          <Input
            label="Service *"
            value={pricingForm.serviceName}
            onChange={(e) => setPricingForm({ ...pricingForm, serviceName: e.target.value })}
            required
          />
          <Input
            label="Amount *"
            type="number"
            value={pricingForm.amount}
            onChange={(e) => setPricingForm({ ...pricingForm, amount: e.target.value })}
            required
          />
          <Textarea
            label="Pricing Notes"
            value={pricingForm.notes}
            onChange={(e) => setPricingForm({ ...pricingForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setPricingModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pricingMutation.isPending}>
              Save Pricing
            </Button>
          </div>
        </form>
      </Modal>

      {/* Meeting Modal */}
      <Modal open={meetingModal} onClose={() => setMeetingModal(false)} title="Schedule Meeting">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            meetingMutation.mutate({
              contactId: lead.contactId,
              leadId: lead.id,
              title: mtgForm.title,
              scheduledAt: new Date(mtgForm.scheduledAt).toISOString(),
              durationMinutes: Number(mtgForm.durationMinutes),
              meetingLink: mtgForm.meetingLink,
            });
          }}
          className="space-y-3"
        >
          <Input
            label="Meeting Title *"
            value={mtgForm.title}
            onChange={(e) => setMtgForm({ ...mtgForm, title: e.target.value })}
            required
          />
          <Input
            label="Date & Time *"
            type="datetime-local"
            value={mtgForm.scheduledAt}
            onChange={(e) => setMtgForm({ ...mtgForm, scheduledAt: e.target.value })}
            required
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={mtgForm.durationMinutes}
            onChange={(e) => setMtgForm({ ...mtgForm, durationMinutes: e.target.value })}
          />
          <Input
            label="Meeting Link"
            placeholder="https://meet.google.com/..."
            value={mtgForm.meetingLink}
            onChange={(e) => setMtgForm({ ...mtgForm, meetingLink: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setMeetingModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={meetingMutation.isPending}>
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deal Modal */}
      <Modal open={dealModal} onClose={() => setDealModal(false)} title="Close Deal">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dealMutation.mutate({
              contactId: lead.contactId,
              leadId: lead.id,
              title: dealForm.title,
              serviceName: dealForm.serviceName,
              dealValue: Number(dealForm.dealValue),
              status: dealForm.status,
              paymentStatus: dealForm.paymentStatus,
            });
          }}
          className="space-y-3"
        >
          <Input
            label="Deal Title *"
            value={dealForm.title}
            onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
            required
          />
          <Input
            label="Service *"
            value={dealForm.serviceName}
            onChange={(e) => setDealForm({ ...dealForm, serviceName: e.target.value })}
            required
          />
          <Input
            label="Deal Value *"
            type="number"
            value={dealForm.dealValue}
            onChange={(e) => setDealForm({ ...dealForm, dealValue: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Outcome"
              value={dealForm.status}
              onChange={(e) => setDealForm({ ...dealForm, status: e.target.value })}
            >
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </Select>
            <Select
              label="Payment Status"
              value={dealForm.paymentStatus}
              onChange={(e) => setDealForm({ ...dealForm, paymentStatus: e.target.value })}
            >
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDealModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={dealMutation.isPending}>
              Save Deal
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

export default function LeadDetailPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <LeadDetailContent />
    </Suspense>
  );
}

