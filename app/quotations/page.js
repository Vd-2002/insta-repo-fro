'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
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
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/components/providers';

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    contactId: '',
    serviceName: 'Website Development',
    discount: '0',
    tax: '0',
    notes: '',
    terms: '50% advance, 50% on delivery.',
    status: 'SENT',
    items: [{ title: 'Website Development', quantity: 1, unitPrice: 35000 }],
  });

  const { data: quotations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['quotations', statusFilter],
    queryFn: () => apiFetch(`/quotations${statusFilter ? `?status=${statusFilter}` : ''}`),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiFetch('/contacts'),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => apiFetch('/quotations', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
      toast('Quotation created');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) =>
      apiFetch(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Quotation status updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const subtotal = form.items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0);
  const total = Math.max(0, subtotal - Number(form.discount || 0) + Number(form.tax || 0));

  return (
    <AppShell
      title="Quotations"
      subtitle="Create commercial proposals and track client responses"
      actions={
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Quotation
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['', 'DRAFT', 'SENT', 'RESPONDED', 'ACCEPTED', 'REJECTED'].map((st) => (
            <button
              key={st || 'ALL'}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingState message="Loading quotations..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : quotations.length === 0 ? (
          <EmptyState
            title="No quotations yet"
            description="Create a quotation with line items and share it with your lead."
            action={
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="w-4 h-4" /> Create Quotation
              </Button>
            }
          />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Number</th>
                  <th className="px-4 py-3 font-medium">Contact / Company</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent Date</th>
                  <th className="px-4 py-3 font-medium">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                      {q.quotationNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{q.contact?.name}</p>
                      <p className="text-xs text-slate-500">{q.company?.name || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{q.serviceName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(q.total, q.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={q.status} />
                        {q.status === 'SENT' && q.responseStatus === 'NO_RESPONSE' && (
                          <span className="text-[11px] text-amber-600 font-medium">No Response</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(q.sentAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={q.status}
                        onChange={(e) => updateMutation.mutate({ id: q.id, status: e.target.value })}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="RESPONDED">Responded</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="EXPIRED">Expired</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Quotation" maxWidth="max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              ...form,
              discount: Number(form.discount || 0),
              tax: Number(form.tax || 0),
              items: form.items.map((i) => ({
                ...i,
                quantity: Number(i.quantity),
                unitPrice: Number(i.unitPrice),
              })),
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              label="Service Name *"
              value={form.serviceName}
              onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">Line Items</label>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    items: [...form.items, { title: '', quantity: 1, unitPrice: 0 }],
                  })
                }
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
                + Add Item
              </button>
            </div>
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  className="col-span-6 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg"
                  placeholder="Item title"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...form.items];
                    next[idx].title = e.target.value;
                    setForm({ ...form, items: next });
                  }}
                  required
                />
                <input
                  type="number"
                  min={1}
                  className="col-span-2 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg"
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...form.items];
                    next[idx].quantity = e.target.value;
                    setForm({ ...form, items: next });
                  }}
                  required
                />
                <input
                  type="number"
                  min={0}
                  className="col-span-3 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg"
                  value={item.unitPrice}
                  onChange={(e) => {
                    const next = [...form.items];
                    next[idx].unitPrice = e.target.value;
                    setForm({ ...form, items: next });
                  }}
                  required
                />
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
                    }
                    className="col-span-1 text-rose-500 flex justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Discount"
              type="number"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />
            <Input
              label="Tax"
              type="number"
              value={form.tax}
              onChange={(e) => setForm({ ...form, tax: e.target.value })}
            />
            <Select
              label="Initial Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Mark as Sent</option>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 flex items-center justify-between text-sm">
            <span className="text-slate-600">Quotation Total</span>
            <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>

          <Textarea
            label="Terms & Notes"
            value={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.value })}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

