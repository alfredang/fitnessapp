import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import type { ClassStatus } from '../lib/types';

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center text-slate-500">
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: ClassStatus }) {
  const styles: Record<ClassStatus, string> = {
    OPEN: 'bg-green-100 text-green-700',
    CLOSED: 'bg-slate-200 text-slate-600',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return <span className={`badge ${styles[status]}`}>{status}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  className = '',
}: {
  onConfirm: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      className={className}
      onClick={() => {
        if (window.confirm('Are you sure?')) onConfirm();
      }}
    >
      {children}
    </button>
  );
}
