'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Send, FileCode2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import {
  Card,
  Button,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  InstagramIcon,
} from '@/components/ui';
import { apiFetch } from '@/lib/api';
import { formatDateTime, LEAD_STATUS_COLUMNS } from '@/lib/format';
import { useToast } from '@/components/providers';

export default function InboxPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [messageText, setMessageText] = useState('');

  const { data: conversations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['conversations', search, unreadOnly],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (unreadOnly) params.set('unread', 'true');
      return apiFetch(`/conversations?${params.toString()}`);
    },
  });

  const activeId = selectedId || conversations[0]?.id || null;

  const { data: activeConv, isLoading: loadingConv } = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => apiFetch(`/conversations/${activeId}`),
    enabled: Boolean(activeId),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiFetch('/templates'),
  });

  const sendMessage = useMutation({
    mutationFn: (payload) => apiFetch('/messages', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['conversation', activeId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const updateLeadStatus = useMutation({
    mutationFn: ({ leadId, status }) =>
      apiFetch(`/leads/${leadId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', activeId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Lead status updated');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const applyTemplate = (tpl) => {
    const contactName = activeConv?.contact?.name || 'there';
    const companyName = activeConv?.contact?.company?.name || 'your brand';
    const website = activeConv?.contact?.company?.website || 'your website';
    const service = activeConv?.contact?.leads?.[0]?.service?.name || 'our services';

    const rendered = tpl.body
      .replace(/\{\{name\}\}/g, contactName)
      .replace(/\{\{company\}\}/g, companyName)
      .replace(/\{\{website\}\}/g, website)
      .replace(/\{\{service\}\}/g, service);

    setMessageText(rendered);
  };

  const activeLead = activeConv?.contact?.leads?.[0];

  return (
    <AppShell title="DMs" subtitle="All your Instagram conversations and their current status">
      {isLoading ? (
        <LoadingState message="Loading DMs..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : conversations.length === 0 ? (
        <EmptyState
          title="No DMs yet"
          description="Your Instagram DMs will appear here once your account is connected or conversations are started."
        />
      ) : (
        <Card className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[75vh]">
          {/* Left: DM List */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search DMs..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUnreadOnly(false)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    !unreadOnly ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All DMs
                </button>
                <button
                  onClick={() => setUnreadOnly(true)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    unreadOnly ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Unread
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[65vh]">
              {conversations.map((conv) => {
                const isSelected = conv.id === activeId;
                const leadStatus = conv.contact?.leads?.[0]?.status;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-indigo-50/70' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {conv.contact?.name}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <InstagramIcon className="w-3 h-3 text-pink-500" />
                        {conv.contact?.instagramUsername ? `@${conv.contact.instagramUsername}` : 'Manual'}
                      </span>
                      {leadStatus && <StatusBadge status={leadStatus} />}
                    </div>
                    <p className="text-xs text-slate-600 truncate">{conv.lastMessagePreview || 'No messages'}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Active DM Thread */}
          <div className="lg:col-span-8 flex flex-col bg-slate-50/40">
            {loadingConv || !activeConv ? (
              <LoadingState message="Loading messages..." />
            ) : (
              <>
                <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">{activeConv.contact?.name}</h2>
                    <p className="text-xs text-slate-500">
                      {activeConv.contact?.instagramUsername
                        ? `@${activeConv.contact.instagramUsername}`
                        : activeConv.contact?.email}{' '}
                      · {activeConv.contact?.company?.name || 'No company'}
                    </p>
                  </div>

                  {activeLead && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Lead Status:</span>
                      <select
                        value={activeLead.status}
                        onChange={(e) =>
                          updateLeadStatus.mutate({ leadId: activeLead.id, status: e.target.value })
                        }
                        className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
                      >
                        {LEAD_STATUS_COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                        <option value="LOST">Lost</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[54vh]">
                  {activeConv.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.direction === 'OUTBOUND' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                          msg.direction === 'OUTBOUND'
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1">
                        {formatDateTime(msg.sentAt)} ·{' '}
                        {msg.status === 'UNAVAILABLE' ? 'Status unavailable' : msg.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                  {templates.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <FileCode2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 shrink-0"
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!messageText.trim()) return;
                      sendMessage.mutate({ conversationId: activeConv.id, body: messageText });
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Reply to DM..."
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    <Button type="submit" disabled={sendMessage.isPending || !messageText.trim()}>
                      <Send className="w-4 h-4" /> Send
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
