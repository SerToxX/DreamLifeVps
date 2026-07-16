'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatPrice } from '@/lib/utils';

const COLORS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  CONFIRMADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  EN_PREPARACION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  ENVIADO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  CANCELADO: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function MisPedidosPage() {
  const router = useRouter();
  const { isAuthenticated, user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && (!isAuthenticated || user?.type !== 'cliente')) router.replace('/login');
  }, [hydrated, isAuthenticated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then((r) => r.data),
    enabled: isAuthenticated && user?.type === 'cliente',
  });

  if (!hydrated) return <div className="container mx-auto py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Mis pedidos</h1>
      <p className="text-muted-foreground mb-8">Historial de tus compras</p>

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-lg skeleton" />)}</div>
      ) : !data?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium mb-1">Aún no has hecho ningún pedido</p>
            <p className="text-sm text-muted-foreground mb-6">Explora nuestro catálogo y haz tu primera compra</p>
            <Link href="/catalogo"><Button className="gap-2">Ver catálogo<ArrowRight className="w-4 h-4" /></Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-sm text-muted-foreground">#{p.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${COLORS[p.estado] ?? 'bg-secondary'}`}>{p.estado}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</p>
                    {p.detalles?.length > 0 && <p className="text-xs text-muted-foreground mt-1">{p.detalles.length} {p.detalles.length === 1 ? 'producto' : 'productos'}</p>}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold">{formatPrice(p.total)}</p>
                    <p className="text-xs text-muted-foreground">{p.canal === 'ONLINE' ? 'Online' : p.canal}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
