'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Minus, Trash2, CreditCard, Search, Banknote, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, cn } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';

interface POSItem { id: number; sku: string; nombre: string; precio: number; qty: number; }

export default function POSPage() {
  const [items, setItems] = useState<POSItem[]>([]);
  const [search, setSearch] = useState('');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [ubicacionId, setUbicacionId] = useState<number | null>(null);

  const { data: ubicaciones } = useQuery({ queryKey: ['ubicaciones'], queryFn: () => api.get('/inventory/ubicaciones').then((r) => r.data) });
  const { data: products } = useQuery({
    queryKey: ['pos-prod', search],
    queryFn: () => api.get('/products', { params: { search, limit: 10 } }).then((r) => r.data),
    enabled: search.length > 1,
  });

  const total = items.reduce((a, i) => a + i.precio * i.qty, 0);
  const totalItems = items.reduce((a, i) => a + i.qty, 0);

  const addItem = (p: any) => {
    const fi = p.items?.[0];
    if (!fi) { toast({ title: 'Sin SKU disponible', variant: 'destructive' }); return; }
    const precio = Number(p.precioBase);
    setItems((prev) => {
      const ex = prev.find((i) => i.id === fi.id);
      return ex ? prev.map((i) => i.id === fi.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { id: fi.id, sku: fi.codigoSku, nombre: p.nombre, precio, qty: 1 }];
    });
    setSearch('');
  };

  const { mutate: sale, isPending } = useMutation({
    mutationFn: () => api.post('/pos/sale', {
      items: items.map((i) => ({ itemId: i.id, cantidad: i.qty, precio: i.precio })),
      pagos: [{ metodo, monto: total }],
      ubicacionId: ubicacionId ?? undefined,
    }),
    onSuccess: () => { setItems([]); toast({ title: '✅ Venta registrada', description: `Total: ${formatPrice(total)}` }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Punto de Venta</h1>
        <p className="text-muted-foreground text-sm mt-1">Registra ventas en tienda física</p>
      </div>

      {/* Selector de tienda */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-1.5 block">Local donde vendes</label>
        <select className="h-10 w-full max-w-xs bg-input border border-border rounded-md px-3 text-sm" value={ubicacionId ?? ''} onChange={(e) => setUbicacionId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">Seleccionar local...</option>
          {ubicaciones?.filter((u: any) => u.tipo === 'tienda').map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Buscar por SKU o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} />
            {products?.data?.length > 0 && search && (
              <div className="absolute z-20 left-0 right-0 border border-border bg-card rounded-md mt-1 shadow-xl max-h-64 overflow-auto">
                {products.data.map((p: any) => (
                  <button key={p.id} onClick={() => addItem(p)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary text-sm text-left border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.items?.[0]?.codigoSku}</p>
                    </div>
                    <span className="font-bold">{formatPrice(p.precioBase)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Card><CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium">Items</p>
              {items.length > 0 && <span className="text-xs text-muted-foreground">{totalItems} {totalItems === 1 ? 'unidad' : 'unidades'}</span>}
            </div>
            {items.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Busca y agrega productos arriba</p>
            : <div className="flex flex-col gap-2">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 p-3 rounded-md border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{it.nombre}</p>
                      <p className="text-xs text-muted-foreground font-mono">{it.sku}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setItems((p) => p.map((i) => i.id === it.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))} className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-secondary"><Minus className="w-3 h-3" /></button>
                      <span className="w-7 text-center text-sm">{it.qty}</span>
                      <button onClick={() => setItems((p) => p.map((i) => i.id === it.id ? { ...i, qty: i.qty + 1 } : i))} className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-secondary"><Plus className="w-3 h-3" /></button>
                    </div>
                    <span className="w-20 text-right font-bold text-sm">{formatPrice(it.precio * it.qty)}</span>
                    <button onClick={() => setItems((p) => p.filter((i) => i.id !== it.id))} className="text-accent p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>}
          </CardContent></Card>
        </div>

        <Card className="lg:sticky lg:top-20 h-fit">
          <CardContent className="p-5 flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ id: 'EFECTIVO', label: 'Efectivo', icon: Banknote }, { id: 'YAPE', label: 'Yape', icon: Smartphone }, { id: 'TARJETA', label: 'Tarjeta', icon: CreditCard }].map((m) => (
                  <button key={m.id} onClick={() => setMetodo(m.id)} className={cn('flex flex-col items-center gap-1 p-2 rounded-md border transition-colors', metodo === m.id ? 'border-foreground bg-secondary' : 'border-border hover:border-muted-foreground')}>
                    <m.icon className="w-4 h-4" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="flex justify-between text-2xl font-bold"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
            <Button className="w-full gap-2 h-12" disabled={items.length === 0 || isPending} onClick={() => sale()}>
              <CreditCard className="w-5 h-5" />{isPending ? 'Procesando...' : 'Cobrar'}
            </Button>
            {items.length > 0 && <Button variant="outline" className="w-full" onClick={() => setItems([])}>Cancelar venta</Button>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
