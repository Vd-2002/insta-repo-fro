'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import {
  Card,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency, OPPORTUNITY_STAGES } from '@/lib/format';
import { useToast } from '@/components/providers';

export default function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    contactId: '',
    serviceId: '',
    serviceName: '',
    title: '',
    estimatedValue: '',
    notes: '',
  });

  const { data: opportunities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['opportunities', search],
    queryFn: () => apiFetch(`/opportunities${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiFetch('/contacts'),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiFetch('/services'),
  });

  const createOpp = useMutation({
    mutationFn: (payload) => apiFetch('/opportunities', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
      toast('Opportunity created for existing contact');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const updateStage = useMutation({
    mutationFn: ({ id, stage }) =>
      apiFetch(`/opportunities/${id}`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Opportunity stage updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  return (
    <AppShell
      title="Opportunities"
      subtitle="Sell new services to existing customers and active contacts"
      actions={
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Opportunity
        </Button>
      }
    >
      <div className="space-y-4">
        <Card className="p-3.5 flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search service, contact, company..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
        </Card>

        {isLoading ? (
          <LoadingState message="Loading opportunities..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : opportunities.length === 0 ? (
          <EmptyState
            title="No opportunities yet"
            description="Create a new service opportunity for an existing customer without duplicating their contact."
            action={
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" /> Create Opportunity
              </Button>
            }
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {OPPORTUNITY_STAGES.map((col) => {
              const colOpps = opportunities.filter((o) => o.stage === col.key);
              const colValue = colOpps.reduce((s, o) => s + Number(o.estimatedValue || 0), 0);
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
                      {colOpps.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 overflow-y-auto pr-0.5">
                    {colOpps.map((opp) => (
                      <div
                        key={opp.id}
                        className="bg-white rounded-lg p-3 border border-slate-200/90 shadow-2xs hover:border-indigo-300"
                      >
                        <Link href={`/opportunities/${opp.id}`} className="block">
                          <p className="text-sm font-semibold text-slate-900 truncate">{opp.serviceName}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {opp.company?.name || opp.contact?.name}
                          </p>
                        </Link>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                          <span className="text-xs font-semibold text-slate-800">
                            {formatCurrency(opp.estimatedValue, opp.currency)}
                          </span>
                          <select
                            value={opp.stage}
                            onChange={(e) => updateStage.mutate({ id: opp.id, stage: e.target.value })}
                            className="text-[11px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
                          >
                            {OPPORTUNITY_STAGES.map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Opportunity">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createOpp.mutate({
              contactId: form.contactId,
              serviceId: form.serviceId || undefined,
              serviceName: form.serviceName,
              title: form.title,
              estimatedValue: Number(form.estimatedValue || 0),
              notes: form.notes,
            });
          }}
          className="space-y-3"
        >
          <Select
            label="Existing Contact / Customer *"
            value={form.contactId}
            onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            required
          >
            <option value="">Select contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company?.name ? `${c.company.name} — ` : ''}
                {c.name} {c.isCustomer ? '(Customer)' : ''}
              </option>
            ))}
          </Select>

          <Select
            label="Service"
            value={form.serviceId}
            onChange={(e) => {
              const svc = services.find((s) => s.id === e.target.value);
              const contact = contacts.find((c) => c.id === form.contactId);
              setForm({
                ...form,
                serviceId: e.target.value,
                serviceName: svc ? svc.name : form.serviceName,
                estimatedValue: svc ? String(svc.defaultPrice) : form.estimatedValue,
                title: svc
                  ? `${contact?.company?.name || contact?.name || 'Client'} - ${svc.name}`
                  : form.title,
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
            label="Service Name *"
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            required
          />
          <Input
            label="Opportunity Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Input
            label="Estimated Value"
            type="number"
            value={form.estimatedValue}
            onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
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
            <Button type="submit" disabled={createOpp.isPending}>
              {createOpp.isPending ? 'Creating...' : 'Create Opportunity'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

