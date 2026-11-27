'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Mail, Phone, Globe } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, Button, StatusBadge, LoadingState, ErrorState, InstagramIcon as Instagram } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

function CustomerDetailContent() {
  const { id } = useParams();

  const { data: contact, isLoading, error, refetch } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => apiFetch(`/contacts/${id}`),
  });

  if (isLoading) {
    return (
      <AppShell title="Customer Profile">
        <LoadingState message="Loading customer 360° view..." />
      </AppShell>
    );
  }

  if (error || !contact) {
    return (
      <AppShell title="Customer Profile">
        <ErrorState message={error?.message || 'Contact not found'} onRetry={refetch} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={contact.company?.name || contact.name}
      subtitle={`${contact.isCustomer ? 'Existing Customer' : 'Contact'} · ${contact.name}`}
      actions={
        <div className="flex gap-2">
          <Link href="/customers">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4" /> Customers
            </Button>
          </Link>
          <Link href={`/opportunities?new=1&contactId=${contact.id}`}>
            <Button size="sm">
              <Sparkles className="w-4 h-4" /> Create New Opportunity
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Completed Deals */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Deals &amp; Completed Services</h2>
            {contact.deals?.length ? (
              <div className="divide-y divide-slate-100">
                {contact.deals.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{d.serviceName}</p>
                      <p className="text-xs text-slate-500">Closed {formatDate(d.closedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(d.dealValue, d.currency)}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No closed deals yet.</p>
            )}
          </Card>

          {/* Active & Past Opportunities */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Service Opportunities</h2>
              <Link
                href={`/opportunities?new=1&contactId=${contact.id}`}
                className="text-xs font-medium text-indigo-600 hover:underline"
              >
                + Add Opportunity
              </Link>
            </div>
            {contact.opportunities?.length ? (
              <div className="divide-y divide-slate-100">
                {contact.opportunities.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-indigo-600">{opp.serviceName}</p>
                      <p className="text-xs text-slate-500">{opp.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {formatCurrency(opp.estimatedValue, opp.currency)}
                      </span>
                      <StatusBadge status={opp.stage} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No opportunities yet.</p>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Activity Timeline</h2>
            <div className="space-y-3">
              {contact.activityLogs?.map((act) => (
                <div key={act.id} className="flex gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-900">{act.title}</p>
                    <p className="text-[11px] text-slate-400">{formatDateTime(act.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Info Sidebar */}
        <div className="space-y-5">
          <Card className="p-5 space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-slate-900">Contact Details</h3>
            {contact.instagramUsername && (
              <p className="flex items-center gap-2 text-slate-700">
                <Instagram className="w-4 h-4 text-pink-500" />@{contact.instagramUsername}
              </p>
            )}
            {contact.email && (
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                {contact.email}
              </p>
            )}
            {contact.phone && (
              <p className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                {contact.phone}
              </p>
            )}
            {contact.company?.website && (
              <p className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-slate-400" />
                {contact.company.website}
              </p>
            )}
          </Card>

          <Card className="p-5 space-y-2 text-xs">
            <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
            <div className="flex justify-between">
              <span className="text-slate-500">Conversations</span>
              <span className="font-semibold">{contact.conversations?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Quotations</span>
              <span className="font-semibold">{contact.quotations?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Meetings</span>
              <span className="font-semibold">{contact.meetings?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Follow-ups</span>
              <span className="font-semibold">{contact.followUps?.length || 0}</span>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <CustomerDetailContent />
    </Suspense>
  );
}

