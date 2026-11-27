'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, Button, StatusBadge, LoadingState, ErrorState, EmptyState, InstagramIcon as Instagram } from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [customersOnly, setCustomersOnly] = useState(true);

  const { data: contacts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['contacts', customersOnly, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (customersOnly) params.set('customersOnly', 'true');
      if (search) params.set('search', search);
      return apiFetch(`/contacts?${params.toString()}`);
    },
  });

  return (
    <AppShell
      title="Customers & Contacts"
      subtitle="Existing customers and contacts with repeat service opportunities"
    >
      <div className="space-y-4">
        <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers, @handles..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomersOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                customersOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Existing Customers
            </button>
            <button
              onClick={() => setCustomersOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                !customersOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              All Contacts
            </button>
          </div>
        </Card>

        {isLoading ? (
          <LoadingState message="Loading customers..." />
        ) : error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : contacts.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Contacts become customers automatically when a deal is won."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((c) => {
              const totalWon = (c.deals || []).reduce((s, d) => s + Number(d.dealValue || 0), 0);
              return (
                <Card key={c.id} className="p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/customers/${c.id}`}
                          className="text-base font-semibold text-slate-900 hover:text-indigo-600"
                        >
                          {c.company?.name || c.name}
                        </Link>
                        <p className="text-xs text-slate-500">{c.name}</p>
                      </div>
                      {c.isCustomer && <StatusBadge status="WON" label="Customer" />}
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      {c.instagramUsername && (
                        <p className="flex items-center gap-1.5">
                          <Instagram className="w-3.5 h-3.5 text-pink-500" />@{c.instagramUsername}
                        </p>
                      )}
                      {c.company?.industry && (
                        <p className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {c.company.industry}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                      <div>
                        <p className="text-[11px] text-slate-400">Won Value</p>
                        <p className="text-xs font-semibold text-emerald-600">{formatCurrency(totalWon)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Opportunities</p>
                        <p className="text-xs font-semibold text-slate-900">{c._count?.opportunities || 0}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">Since</p>
                        <p className="text-xs font-semibold text-slate-900">
                          {c.customerSince ? formatDate(c.customerSince) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/customers/${c.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        View 360°
                      </Button>
                    </Link>
                    <Link href={`/opportunities?new=1&contactId=${c.id}`}>
                      <Button size="sm">
                        <Sparkles className="w-3.5 h-3.5" /> New Opp
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

