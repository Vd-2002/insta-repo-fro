'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { Card, StatusBadge, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/components/providers';

export default function DealsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: deals = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deals', statusFilter],
    queryFn: () => apiFetch(`/deals${statusFilter ? `?status=${statusFilter}` : ''}`),
  });

  const updatePayment = useMutation({
    mutationFn: ({ id, paymentStatus }) =>
      apiFetch(`/deals/${id}`, { method: 'PATCH', body: JSON.stringify({ paymentStatus }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast('Payment status updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  return (
    <AppShell title="Deals" subtitle="Closed won and lost deals">
      <div className="space-y-4">
        <div className="flex gap-2">
          {['', 'WON', 'LOST'].map((st) => (
            <button
              key={st || 'ALL'}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st || 'All Deals'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingState message="Loading deals..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : deals.length === 0 ? (
          <EmptyState title="No deals yet" description="Close a lead or opportunity to record a deal." />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Deal</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Closed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">{d.title}</td>
                    <td className="px-4 py-3">
                      <Link href={`/customers/${d.contactId}`} className="text-indigo-600 hover:underline text-xs font-medium">
                        {d.company?.name || d.contact?.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{d.serviceName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(d.dealValue, d.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={d.paymentStatus}
                        onChange={(e) => updatePayment.mutate({ id: d.id, paymentStatus: e.target.value })}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(d.closedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

