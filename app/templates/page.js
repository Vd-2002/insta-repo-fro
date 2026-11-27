'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Copy } from 'lucide-react';
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
import { useToast } from '@/components/providers';

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'OUTREACH',
    body: 'Hi {{name}}, I came across {{company}} and noticed...',
  });

  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiFetch('/templates'),
  });

  const createTpl = useMutation({
    mutationFn: (payload) => apiFetch('/templates', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setModalOpen(false);
      toast('Template saved');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  const deleteTpl = useMutation({
    mutationFn: (id) => apiFetch(`/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast('Template deleted');
    },
    onError: (err) => toast(err.message, 'error'),
  });

  return (
    <AppShell
      title="Message Templates"
      subtitle="Reusable Instagram outreach messages with dynamic variables"
      actions={
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> New Template
        </Button>
      }
    >
      {isLoading ? (
        <LoadingState message="Loading templates..." />
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create reusable outreach templates with {{name}}, {{company}}, {{website}}, and {{service}}."
          action={
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" /> Create Template
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className="p-5 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">{t.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
                    {t.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{t.body}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Variables: {Array.isArray(t.variables) && t.variables.length ? t.variables.join(', ') : 'None'}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(t.body);
                      toast('Template copied to clipboard');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTpl.mutate(t.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Message Template">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTpl.mutate(form);
          }}
          className="space-y-3"
        >
          <Input
            label="Template Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="OUTREACH">Outreach</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="PRICING">Pricing</option>
            <option value="UPSELL">Upsell</option>
          </Select>
          <Textarea
            label="Message Body *"
            rows={5}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            required
          />
          <p className="text-[11px] text-slate-500">
            Supported variables: <code>{'{{name}}'}</code>, <code>{'{{company}}'}</code>,{' '}
            <code>{'{{website}}'}</code>, <code>{'{{service}}'}</code>
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTpl.isPending}>
              Save Template
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

