'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, List, Search } from 'lucide-react';
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
  InstagramIcon as Instagram,
} from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate, LEAD_STATUS_COLUMNS } from '@/lib/format';
import { useToast } from '@/components/providers';

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    contactName: '',
    instagramUsername: '',
    companyName: '',
    website: '',
    email: '',
    phone: '',
    industry: '',
    source: 'INSTAGRAM',
    serviceId: '',
    estimatedValue: '',
    notes: '',
  });

  const { data: leads = [], isLoading, error, refetch } = useQuery({
    queryKey: ['leads', search, sourceFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (sourceFilter) params.set('source', sourceFilter);
      if (statusFilter) params.set('status', statusFilter);
      return apiFetch(`/leads?${params.toString()}`);
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiFetch('/services'),
  });

  const createLead = useMutation({
    mutationFn: (payload) => apiFetch('/leads', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Lead created successfully');
      setModalOpen(false);
      setForm({
        contactName: '',
        instagramUsername: '',
        companyName: '',
        website: '',
        email: '',
        phone: '',
        industry: '',
        source: 'INSTAGRAM',
        serviceId: '',
        estimatedValue: '',
        notes: '',
      });
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) =>
      apiFetch(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Lead stage updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createLead.mutate({
      ...form,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      serviceId: form.serviceId || undefined,
    });
  };

  return (
    <AppShell
      title="Leads Pipeline"
      subtitle="Track Instagram outreach from New Lead to Deal Done"
      actions={
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Lead
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filters Bar */}
        <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contact, @handle, company..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="">All Sources</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="MANUAL">Manual</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              <option value="">Active Pipeline</option>
              {LEAD_STATUS_COLUMNS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
              <option value="LOST">Lost</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView('kanban')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                view === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                view === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>
        </Card>

        {isLoading ? (
          <LoadingState message="Loading leads..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found"
            description="Create a new lead from an Instagram conversation or manual outreach."
            action={
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" /> Create Lead
              </Button>
            }
          />
        ) : view === 'kanban' && !statusFilter ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {LEAD_STATUS_COLUMNS.map((col) => {
              const colLeads = leads.filter((l) => l.status === col.key);
              const colValue = colLeads.reduce((s, l) => s + Number(l.estimatedValue || 0), 0);
              return (
                <div
                  key={col.key}
                  className="w-72 shrink-0 bg-slate-100/80 rounded-xl p-3 border border-slate-200/70 flex flex-col max-h-[72vh]"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-800">{col.label}</h3>
                      <p className="text-[11px] text-slate-500">{formatCurrency(colValue)}</p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white text-slate-700 border border-slate-200">
                      {colLeads.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto pr-0.5">
                    {colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white rounded-lg p-3 border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-colors"
                      >
                        <Link href={`/leads/${lead.id}`} className="block">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {lead.company?.name || lead.contact?.name}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Instagram className="w-3 h-3 text-pink-500" />
                            {lead.contact?.instagramUsername ? `@${lead.contact.instagramUsername}` : lead.contact?.name}
                          </p>
                          {lead.service && (
                            <p className="text-xs text-indigo-600 font-medium mt-1.5 truncate">
                              {lead.service.name}
                            </p>
                          )}
                        </Link>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                          <span className="text-xs font-semibold text-slate-800">
                            {formatCurrency(lead.estimatedValue, lead.currency)}
                          </span>
                          <select
                            value={lead.status}
                            onChange={(e) => updateStatus.mutate({ id: lead.id, status: e.target.value })}
                            className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
                          >
                            {LEAD_STATUS_COLUMNS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                            <option value="LOST">Lost</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Contact / Company</th>
                  <th className="px-4 py-3 font-medium">Instagram</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium text-indigo-600 hover:underline">
                        {lead.company?.name || lead.contact?.name}
                      </Link>
                      <p className="text-xs text-slate-500">{lead.contact?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {lead.contact?.instagramUsername ? `@${lead.contact.instagramUsername}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{lead.service?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatCurrency(lead.estimatedValue, lead.currency)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Lead">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Name *"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              required
            />
            <Input
              label="Instagram Username"
              placeholder="@agencyname"
              value={form.instagramUsername}
              onChange={(e) => setForm({ ...form, instagramUsername: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company Name"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
            <Input
              label="Website"
              placeholder="https://"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="INSTAGRAM">Instagram</option>
              <option value="MANUAL">Manual</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="OTHER">Other</option>
            </Select>
            <Select
              label="Service"
              value={form.serviceId}
              onChange={(e) => {
                const svc = services.find((s) => s.id === e.target.value);
                setForm({
                  ...form,
                  serviceId: e.target.value,
                  estimatedValue: svc ? String(svc.defaultPrice) : form.estimatedValue,
                });
              }}
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Input
              label="Estimated Value"
              type="number"
              value={form.estimatedValue}
              onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
            />
          </div>
          <Textarea
            label="Notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

