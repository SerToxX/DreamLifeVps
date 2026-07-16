'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Smartphone, Truck, Banknote } from 'lucide-react';
import api from '@/lib/api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const [metodo, setMetodo] = useState('YAPE');
  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '', notas: '' });

  useEffect(() => {
    if (hydrated && (!isAuthenticated || user?.type !== 'cliente')) {
      toast({ title: 'Debes iniciar sesión', variant: 'destructive' });
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, user, router]);

  // Precargar datos del cliente
  useEffect(() => {
    if (isAuthenticated && user?.type === 'cliente') {
      api.get('/customers/me').then((r) => {
        setForm({
          nombre: `${r.data.nombre} ${r.data.apellido ?? ''}`.trim(),
          telefono: r.data.telefono ?? '',
          direccion: r.data.direccion ?? '',
          notas: '',
        });
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const total = items.reduce((a, i) => a + i.precio * i.qty, 0);
  const envio = total >= 199 ? 0 : 15;

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/checkout', {
      items: items.map((i) => ({ itemId: i.id, cantidad: i.qty, precio: i.precio })),
      metodoPago: metodo,
      direccionEnvio: form.direccion,
      telefonoEnvio: form.telefono,
      notas: form.notas,
    }),
    onSuccess: () => {
      clear();
      toast({ title: '¡Pedido realizado!', description: 'Te contactaremos pronto' });
      router.push('/mis-pedidos');
    },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message?.toString() ?? 'Intenta de nuevo', variant: 'destructive' }),
  });

  if (!hydrated || !isAuthenticated) return null;
  if (items.length === 0) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
        <Link href="/catalogo"><Button>Ver catálogo</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/carrito" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" />Volver al carrito</Link>
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card><CardContent className="p-5">
            <p className="font-bold mb-4 flex items-center gap-2"><Truck className="w-4 h-4" />Datos de envío</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Nombre completo</label><Input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Teléfono</label><Input value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Notas (opcional)</label><Input value={form.notas} onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-muted-foreground mb-1 block">Dirección</label><Input value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} placeholder="Av. ..., distrito, referencia" /></div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-5">
            <p className="font-bold mb-4">Método de pago</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'YAPE', label: 'Yape', icon: Smartphone },
                { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                { id: 'EFECTIVO', label: 'Contraentrega', icon: Banknote },
              ].map((m) => (
                <button key={m.id} onClick={() => setMetodo(m.id)} className={cn('flex flex-col items-center gap-1 p-3 rounded-md border transition-colors', metodo === m.id ? 'border-foreground bg-secondary' : 'border-border hover:border-muted-foreground')}>
                  <m.icon className="w-5 h-5" /><span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </CardContent></Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-20"><CardContent className="p-5">
          <p className="font-bold mb-4">Resumen</p>
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0">
                  <p className="truncate">{it.nombre}</p>
                  <p className="text-muted-foreground">x{it.qty}</p>
                </div>
                <span className="font-medium">{formatPrice(it.precio * it.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span>{envio === 0 ? 'Gratis' : formatPrice(envio)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>Total</span><span>{formatPrice(total + envio)}</span></div>
          </div>
          <Button className="w-full mt-4 h-12" disabled={!form.direccion || !form.telefono || isPending} onClick={() => mutate()}>{isPending ? 'Procesando...' : 'Confirmar pedido'}</Button>
        </CardContent></Card>
      </div>
    </div>
  );
}
