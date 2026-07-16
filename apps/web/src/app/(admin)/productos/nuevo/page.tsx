'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save, MapPin, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toaster';

interface StockRow { ubicacionId: number; cantidad: number; }

export default function NuevoProductoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '', descripcion: '', precioBase: '',
    categoriaId: '', destacado: false, imagen: '',
    sku: '', tamano: 'M', material: 'Algodón',
  });
  const [stocks, setStocks] = useState<StockRow[]>([]);

  const { data: cats } = useQuery({ queryKey: ['cats'], queryFn: () => api.get('/categories').then((r) => r.data) });
  const { data: ubicaciones } = useQuery({ queryKey: ['ubicaciones'], queryFn: () => api.get('/inventory/ubicaciones').then((r) => r.data) });

  const addStockRow = () => {
    const usadas = new Set(stocks.map((s) => s.ubicacionId));
    const disponible = ubicaciones?.find((u: any) => !usadas.has(u.id));
    if (disponible) setStocks((p) => [...p, { ubicacionId: disponible.id, cantidad: 0 }]);
  };
  const updateStock = (idx: number, field: 'ubicacionId' | 'cantidad', value: number) =>
    setStocks((p) => p.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  const removeStock = (idx: number) => setStocks((p) => p.filter((_, i) => i !== idx));

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // 1) Crear producto
      const prod = await api.post('/products', {
        nombre: form.nombre, descripcion: form.descripcion,
        precioBase: Number(form.precioBase),
        categoriaId: form.categoriaId ? Number(form.categoriaId) : undefined,
        destacado: form.destacado,
        imagen: form.imagen || undefined,
      }).then(r => r.data);

      // 2) Si hay SKU, crear item
      let itemId: number | null = null;
      if (form.sku) {
        const item = await api.post(`/products/${prod.id}/items`, {
          codigoSku: form.sku, tamano: form.tamano, material: form.material,
        }).then(r => r.data);
        itemId = item.id;
      }

      // 3) Si hay stocks asignados, crearlos
      if (itemId && stocks.length > 0) {
        for (const s of stocks) {
          if (s.cantidad > 0) {
            await api.post('/inventory/set-stock', {
              itemId, ubicacionId: s.ubicacionId, cantidad: s.cantidad,
            }).catch(() => {}); // ignorar si endpoint falla
          }
        }
      }
      return prod;
    },
    onSuccess: () => { toast({ title: '✅ Producto creado' }); router.push('/productos'); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message?.toString(), variant: 'destructive' }),
  });

  return (
    <div className="max-w-3xl">
      <Link href="/productos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" />Volver</Link>
      <h1 className="text-2xl font-bold mb-6">Nuevo producto</h1>

      <Card className="mb-4"><CardContent className="p-6 flex flex-col gap-4">
        <p className="font-bold text-sm">Información básica</p>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Nombre *</label>
          <Input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Descripción</label>
          <textarea className="w-full min-h-[80px] bg-input border border-border rounded-md px-3 py-2 text-sm" value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">URL Imagen (opcional)</label>
          <Input placeholder="https://..." value={form.imagen} onChange={(e) => setForm((p) => ({ ...p, imagen: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Precio base (S/.) *</label>
            <Input type="number" step="0.10" value={form.precioBase} onChange={(e) => setForm((p) => ({ ...p, precioBase: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Categoría</label>
            <select className="h-10 w-full bg-input border border-border rounded-md px-3 text-sm" value={form.categoriaId} onChange={(e) => setForm((p) => ({ ...p, categoriaId: e.target.value }))}>
              <option value="">Sin categoría</option>
              {cats?.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.destacado} onChange={(e) => setForm((p) => ({ ...p, destacado: e.target.checked }))} />
          <span className="text-sm">Marcar como destacado</span>
        </label>
      </CardContent></Card>

      <Card className="mb-4"><CardContent className="p-6 flex flex-col gap-4">
        <p className="font-bold text-sm">Item / SKU (opcional)</p>
        <p className="text-xs text-muted-foreground">Si no creas un item ahora, podrás hacerlo después desde la edición del producto.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">SKU</label>
            <Input placeholder="Ej: CAM-NRT-M-001" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Talla / Tamaño</label>
            <Input value={form.tamano} onChange={(e) => setForm((p) => ({ ...p, tamano: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Material</label>
            <Input value={form.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} />
          </div>
        </div>
      </CardContent></Card>

      {form.sku && (
        <Card className="mb-4"><CardContent className="p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm flex items-center gap-2"><MapPin className="w-4 h-4" />Stock inicial por ubicación</p>
            {ubicaciones && stocks.length < ubicaciones.length && (
              <Button size="sm" variant="outline" className="gap-1" onClick={addStockRow}><Plus className="w-3 h-3" />Asignar ubicación</Button>
            )}
          </div>
          {stocks.length === 0 && <p className="text-xs text-muted-foreground">Agrega ubicaciones para asignar stock inicial</p>}
          {stocks.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select className="flex-1 h-10 bg-input border border-border rounded-md px-3 text-sm" value={s.ubicacionId} onChange={(e) => updateStock(idx, 'ubicacionId', Number(e.target.value))}>
                {ubicaciones?.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
              <Input type="number" min="0" placeholder="Stock" className="w-24" value={s.cantidad} onChange={(e) => updateStock(idx, 'cantidad', Number(e.target.value))} />
              <button onClick={() => removeStock(idx)} className="p-2 text-accent hover:bg-secondary rounded-md"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </CardContent></Card>
      )}

      <Button size="lg" className="gap-2 w-full sm:w-auto" disabled={!form.nombre || !form.precioBase || isPending} onClick={() => mutate()}>
        <Save className="w-4 h-4" />{isPending ? 'Guardando...' : 'Crear producto'}
      </Button>
    </div>
  );
}
