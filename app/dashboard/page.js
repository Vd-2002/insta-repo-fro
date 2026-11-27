'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Clock,
  Trophy,
  IndianRupee,
  TrendingUp,
  Plus,
  Search,
  MessageSquare,
  X,
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
  EmptyState,
  InstagramIcon,
} from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate, LEAD_STATUS_COLUMNS } from '@/lib/format';
import { useAuth, useToast } from '@/components/providers';

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currency = user?.currency || 'INR';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [quickNote, setQuickNote] = useState('');

  const [leadForm, setLeadForm] = useState({
    contactName: '',
    instagramUsername: '',
    companyName: '',
    estimatedValue: '',
    notes: '',
  });

  const { data: dashData, isLoading: loadingDash, error: dashError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch('/dashboard'),
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['leads', search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      return apiFetch(`/leads?${params.toString()}`);
    },
  });

  const createLead = useMutation({
    mutationFn: (payload) => apiFetch('/leads', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setNewLeadOpen(false);
      setLeadForm({ contactName: '', instagramUsername: '', companyName: '', estimatedValue: '', notes: '' });
      toast('Lead added');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const updateLeadStatus = useMutation({
    mutationFn: ({ id, status }) =>
      apiFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (selectedLead?.id === updated.id) setSelectedLead(updated);
      toast('Lead status updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const addNote = useMutation({
    mutationFn: ({ id, note }) =>
      apiFetch(`/leads/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
    onSuccess: () => {
      setQuickNote('');
      toast('Note saved');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const m = dashData?.metrics || {};
  const kpis = [
    { label: 'Total Leads', value: m.totalLeads ?? 0, icon: Users, tone: 'text-indigo-600 bg-indigo-50' },
    { label: 'Follow-ups Due', value: m.followUpsDueToday ?? 0, icon: Clock, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Deals Won', value: m.dealsWon ?? 0, icon: Trophy, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Deal Value', value: formatCurrency(m.totalDealValue, currency), icon: IndianRupee, tone: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pipeline Value', value: formatCurrency(m.pipelineValue, currency), icon: TrendingUp, tone: 'text-blue-600 bg-blue-50' },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Your Instagram leads and pipeline overview"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/inbox">
            <Button variant="secondary" size="sm">
              <MessageSquare className="w-4 h-4" /> Open DMs
            </Button>
          </Link>
          <Button size="sm" onClick={() => setNewLeadOpen(true)}>
            <Plus className="w-4 h-4" /> Add Lead
          </Button>
        </div>
      }
    >
      {loadingDash ? (
        <LoadingState message="Loading your dashboard..." />
      ) : dashError ? (
        <ErrorState message={dashError.message} onRetry={refetch} />
      ) : (
        <div className="space-y-6">
          {/* Compact KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.tone}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                </Card>
              );
            })}
          </div>

          {/* Leads Section Right on Dashboard */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Your Leads</h2>
                <p className="text-xs text-slate-500">Update status directly or click a lead for quick notes &amp; details</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search leads..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="">All Statuses</option>
                  {LEAD_STATUS_COLUMNS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                  <option value="LOST">Lost</option>
                </select>
              </div>
            </div>

            {loadingLeads ? (
              <LoadingState message="Loading leads..." />
            ) : leads.length === 0 ? (
              <EmptyState
                title="No leads yet"
                description="Add a lead manually or connect Instagram to sync incoming DMs."
                action={
                  <Button size="sm" onClick={() => setNewLeadOpen(true)}>
                    <Plus className="w-4 h-4" /> Add Lead
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-y border-slate-200 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Lead / Company</th>
                      <th className="px-4 py-3 font-medium">Instagram</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Value</th>
                      <th className="px-4 py-3 font-medium">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {lead.company?.name || lead.contact?.name}
                          </p>
                          <p className="text-xs text-slate-500">{lead.contact?.name}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {lead.contact?.instagramUsername ? (
                            <span className="inline-flex items-center gap-1">
                              <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />@
                              {lead.contact.instagramUsername}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus.mutate({ id: lead.id, status: e.target.value })}
                            className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-800"
                          >
                            {LEAD_STATUS_COLUMNS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                            <option value="LOST">Lost</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatCurrency(lead.estimatedValue, lead.currency)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Slide-over Lead Quick Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-[1px]">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedLead.company?.name || selectedLead.contact?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedLead.contact?.name}{' '}
                    {selectedLead.contact?.instagramUsername
                      ? `· @${selectedLead.contact.instagramUsername}`
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-medium text-slate-600">Current Stage</span>
                <StatusBadge status={selectedLead.status} />
              </div>

              <Select
                label="Update Status"
                value={selectedLead.status}
                onChange={(e) => updateLeadStatus.mutate({ id: selectedLead.id, status: e.target.value })}
              >
                {LEAD_STATUS_COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
                <option value="LOST">Lost</option>
              </Select>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Value</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(selectedLead.estimatedValue, selectedLead.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Source</span>
                  <span className="font-medium text-slate-800">{selectedLead.source}</span>
                </div>
                {selectedLead.notes && (
                  <div className="pt-2">
                    <p className="text-slate-500 mb-1">Notes</p>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg">{selectedLead.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <Textarea
                  label="Add Quick Note"
                  rows={3}
                  placeholder="Write a note..."
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!quickNote.trim() || addNote.isPending}
                  onClick={() => addNote.mutate({ id: selectedLead.id, note: quickNote })}
                >
                  Save Note
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <Link href="/inbox" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <MessageSquare className="w-4 h-4" /> Open DMs
                </Button>
              </Link>
              <Link href={`/leads/${selectedLead.id}`} className="flex-1">
                <Button className="w-full">Full Details</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <Modal open={newLeadOpen} onClose={() => setNewLeadOpen(false)} title="Add New Lead">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLead.mutate({
              ...leadForm,
              source: 'INSTAGRAM',
              estimatedValue: leadForm.estimatedValue ? Number(leadForm.estimatedValue) : undefined,
            });
          }}
          className="space-y-3"
        >
          <Input
            label="Contact Name *"
            value={leadForm.contactName}
            onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
            required
          />
          <Input
            label="Instagram Username"
            placeholder="@username"
            value={leadForm.instagramUsername}
            onChange={(e) => setLeadForm({ ...leadForm, instagramUsername: e.target.value })}
          />
          <Input
            label="Company Name"
            value={leadForm.companyName}
            onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
          />
          <Input
            label="Estimated Value"
            type="number"
            value={leadForm.estimatedValue}
            onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: e.target.value })}
          />
          <Textarea
            label="Notes"
            rows={2}
            value={leadForm.notes}
            onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setNewLeadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? 'Saving...' : 'Save Lead'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
