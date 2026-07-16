'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/toaster';

export default function ProductosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => api.get('/products', { params: { search, limit: 100 } }).then((r) => r.data),
  });

  const { mutate: del } = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast({ title: '🗑️ Producto eliminado' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message, variant: 'destructive' }),
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.total ?? 0} productos en catálogo</p>
        </div>
        <Link href="/productos/nuevo"><Button className="gap-2"><Plus className="w-4 h-4" />Nuevo producto</Button></Link>
      </div>

      <div className="relative max-w-md mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por SKU, nombre o descripción..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-border bg-secondary/50">
              <tr className="text-left">
                {['SKU', 'Producto', 'Categoría', 'Precio', 'Items', 'Estado', 'Acción'].map((h) => (
                  <th key={h} className="p-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando...</td></tr>
              ) : !data?.data?.length ? (
                <tr><td colSpan={7} className="p-12 text-center">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Sin productos</p>
                </td></tr>
              ) : data.data.map((p: any) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="p-3 font-mono text-xs">{p.items?.[0]?.codigoSku ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.imagenes?.[0]?.url && <img src={p.imagenes[0].url} className="w-10 h-10 rounded object-cover" alt="" />}
                      <span className="font-medium">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{p.categoria?.nombre ?? '—'}</td>
                  <td className="p-3 font-bold">{formatPrice(p.precioBase)}</td>
                  <td className="p-3 text-muted-foreground">{p.items?.length ?? 0}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-secondary text-muted-foreground'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/productos/${p.id}`}><button className="p-1.5 hover:bg-secondary rounded-md" title="Editar"><Edit className="w-4 h-4" /></button></Link>
                      <button
                        className="p-1.5 hover:bg-secondary rounded-md text-accent"
                        onClick={() => { if (confirm(`¿Eliminar "${p.nombre}"?`)) del(p.id); }}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
