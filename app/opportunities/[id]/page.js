'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, Button, Select, StatusBadge, LoadingState, ErrorState } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDateTime, OPPORTUNITY_STAGES } from '@/lib/format';
import { useToast } from '@/components/providers';

function OpportunityDetailContent() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: opp, isLoading, error, refetch } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => apiFetch(`/opportunities/${id}`),
  });

  const stageMutation = useMutation({
    mutationFn: (stage) => apiFetch(`/opportunities/${id}`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast('Stage updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const closeDealMutation = useMutation({
    mutationFn: (status) =>
      apiFetch('/deals', {
        method: 'POST',
        body: JSON.stringify({
          contactId: opp.contactId,
          opportunityId: opp.id,
          title: opp.title,
          serviceName: opp.serviceName,
          dealValue: Number(opp.estimatedValue || 0),
          status,
        }),
      }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast(status === 'WON' ? 'Opportunity accepted & Deal created!' : 'Opportunity marked rejected');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  if (isLoading) {
    return (
      <AppShell title="Opportunity Detail">
        <LoadingState message="Loading opportunity..." />
      </AppShell>
    );
  }
  if (error || !opp) {
    return (
      <AppShell title="Opportunity Detail">
        <ErrorState message={error?.message || 'Opportunity not found'} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={opp.title}
      subtitle={`${opp.serviceName} · ${opp.company?.name || opp.contact?.name}`}
      actions={
        <Link href="/opportunities">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" /> Pipeline
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Opportunity Overview</h2>
            <p className="text-xs text-slate-600 mb-4">{opp.notes || 'No notes added yet.'}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <p className="text-slate-400">Customer</p>
                <Link href={`/customers/${opp.contactId}`} className="font-semibold text-indigo-600 hover:underline">
                  {opp.company?.name || opp.contact?.name}
                </Link>
              </div>
              <div>
                <p className="text-slate-400">Service</p>
                <p className="font-semibold text-slate-900">{opp.serviceName}</p>
              </div>
              <div>
                <p className="text-slate-400">Estimated Value</p>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(opp.estimatedValue, opp.currency)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Activity Timeline</h2>
            <div className="space-y-3">
              {opp.activityLogs?.length ? (
                opp.activityLogs.map((a) => (
                  <div key={a.id} className="flex gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{a.title}</p>
                      <p className="text-[11px] text-slate-400">{formatDateTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No activity recorded yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Stage</span>
              <StatusBadge status={opp.stage} />
            </div>
            <Select
              label="Change Stage"
              value={opp.stage}
              onChange={(e) => stageMutation.mutate(e.target.value)}
            >
              {OPPORTUNITY_STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </Select>

            {!['ACCEPTED', 'REJECTED'].includes(opp.stage) && (
              <div className="pt-2 space-y-2 border-t border-slate-100">
                <Button
                  variant="success"
                  className="w-full"
                  onClick={() => closeDealMutation.mutate('WON')}
                  disabled={closeDealMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4" /> Accept &amp; Close Deal
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => closeDealMutation.mutate('LOST')}
                  disabled={closeDealMutation.isPending}
                >
                  <XCircle className="w-4 h-4" /> Reject Opportunity
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function OpportunityDetailPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <OpportunityDetailContent />
    </Suspense>
  );
}

