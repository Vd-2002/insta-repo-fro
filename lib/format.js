export function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatLabel(str) {
  if (!str) return '';
  return String(str)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const LEAD_STATUS_COLUMNS = [
  { key: 'NEW_LEAD', label: 'New Lead', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { key: 'FOLLOW_UP', label: 'Follow-up', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'PRICING_SHARED', label: 'Pricing Shared', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { key: 'QUOTATION_SENT', label: 'Quotation Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'MEETING_SCHEDULED', label: 'Meeting Scheduled', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { key: 'MEETING_DONE', label: 'Meeting Done', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'DEAL_DONE', label: 'Deal Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export const OPPORTUNITY_STAGES = [
  { key: 'NEW_OPPORTUNITY', label: 'New Opportunity', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { key: 'FOLLOW_UP', label: 'Follow-up', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'QUOTATION_SENT', label: 'Quotation Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'UNDER_DISCUSSION', label: 'Under Discussion', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'ACCEPTED', label: 'Accepted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'REJECTED', label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export function getStatusBadgeClass(status) {
  const map = {
    NEW_LEAD: 'bg-sky-50 text-sky-700 border-sky-200',
    NEW_OPPORTUNITY: 'bg-sky-50 text-sky-700 border-sky-200',
    FOLLOW_UP: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    PRICING_SHARED: 'bg-violet-50 text-violet-700 border-violet-200',
    QUOTATION_SENT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    SENT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    UNDER_DISCUSSION: 'bg-purple-50 text-purple-700 border-purple-200',
    MEETING_SCHEDULED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    SCHEDULED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    MEETING_DONE: 'bg-teal-50 text-teal-700 border-teal-200',
    DEAL_DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    WON: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    LOST: 'bg-rose-50 text-rose-700 border-rose-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    ARCHIVED: 'bg-slate-100 text-slate-600 border-slate-200',
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

