'use client';
import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Toast { id: string; title: string; description?: string; variant?: 'default' | 'destructive'; }

let toasts: Toast[] = [];
let listeners: (() => void)[] = [];

export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, title, description, variant }];
  listeners.forEach((l) => l());
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); listeners.forEach((l) => l()); }, 4000);
}

export function Toaster() {
  const [list, setList] = React.useState<Toast[]>([]);
  React.useEffect(() => {
    const update = () => setList([...toasts]);
    listeners.push(update);
    return () => { listeners = listeners.filter((l) => l !== update); };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)]">
      {list.map((t) => (
        <div key={t.id} className={cn('flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-md animate-in',
          t.variant === 'destructive' ? 'bg-accent text-accent-foreground border-accent' : 'bg-card text-card-foreground border-border')}>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{t.title}</p>
            {t.description && <p className={cn('text-xs mt-0.5', t.variant === 'destructive' ? 'opacity-90' : 'text-muted-foreground')}>{t.description}</p>}
          </div>
          <button onClick={() => { toasts = toasts.filter((x) => x.id !== t.id); listeners.forEach((l) => l()); }} className="opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
