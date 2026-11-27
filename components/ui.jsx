'use client';

import React from 'react';
import { Loader2, AlertTriangle, Inbox, X } from 'lucide-react';
import { getStatusBadgeClass, formatLabel } from '@/lib/format';

export function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-xs ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-xs',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 border-transparent',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent',
  };
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}
      <input
        className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}
      <select
        className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}
      <textarea
        className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export function StatusBadge({ status, label }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(
        status
      )}`}
    >
      {label || formatLabel(status)}
    </span>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]">
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-slate-600 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Processing...' : confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <Card className="p-8 text-center">
      <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Unable to load data</h3>
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  );
}

export function EmptyState({ title = 'No records yet', description = 'Get started by creating your first item.', action }) {
  return (
    <Card className="p-10 text-center">
      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Inbox className="w-5 h-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">{description}</p>
      {action}
    </Card>
  );
}

