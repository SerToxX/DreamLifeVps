'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Users, Package, AlertTriangle, TrendingUp, DollarSign, TrendingDown, ArrowUpRight, ArrowDownRight, Store } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';

type Periodo = 'hoy' | 'semana' | 'mes' | 'anio';

const PERIODOS: { id: Periodo; label: string; chartLabel: string }[] = [
  { id: 'hoy', label: 'Hoy', chartLabel: 'últimas 24h' },
  { id: 'semana', label: 'Semana', chartLabel: 'últimos 7 días' },
  { id: 'mes', label: 'Mes', chartLabel: 'últimos 30 días' },
  { id: 'anio', label: 'Año', chartLabel: 'últimos 12 meses' },
];

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('semana');

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dash-sum', periodo],
    queryFn: () => api.get('/dashboard/summary', { params: { periodo } }).then((r) => r.data),
  });
  const { data: chart } = useQuery({
    queryKey: ['dash-chart', periodo],
    queryFn: () => api.get('/dashboard/sales-chart', { params: { periodo } }).then((r) => r.data),
  });
  const { data: top } = useQuery({
    queryKey: ['dash-top', periodo],
    queryFn: () => api.get('/dashboard/top-products', { params: { periodo } }).then((r) => r.data),
  });
  const { data: expCat } = useQuery({
    queryKey: ['dash-exp-cat', periodo],
    queryFn: () => api.get('/dashboard/expenses-by-category', { params: { periodo } }).then((r) => r.data),
  });
  const { data: revChan } = useQuery({
    queryKey: ['dash-rev-chan', periodo],
    queryFn: () => api.get('/dashboard/revenue-by-channel', { params: { periodo } }).then((r) => r.data),
  });

  const periodoActual = PERIODOS.find((p) => p.id === periodo)!;
  const ingresos = summary?.ingresos ?? 0;
  const egresos = summary?.egresos ?? 0;
  const ganancia = summary?.gananciaNeta ?? 0;
  const margenPct = ingresos > 0 ? (ganancia / ingresos) * 100 : 0;

  const kpis = [
    { label: 'Ingresos', value: formatPrice(ingresos), sub: `${summary?.ventasPeriodo?.cantidad ?? 0} ventas`, icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
    { label: 'Egresos', value: formatPrice(egresos), sub: `del período`, icon: TrendingDown, color: 'text-accent' },
    { label: 'Ganancia neta', value: formatPrice(ganancia), sub: `${margenPct.toFixed(1)}% margen`, icon: DollarSign, color: ganancia >= 0 ? '' : 'text-accent' },
    { label: 'Pedidos pendientes', value: summary?.pedidosPendientes ?? 0, sub: 'por procesar', icon: ShoppingBag },
    { label: 'Clientes', value: summary?.totalClientes ?? 0, sub: 'activos', icon: Users },
    { label: 'Alertas stock', value: summary?.alertasStock ?? 0, sub: 'bajo mínimo', icon: AlertTriangle, color: (summary?.alertasStock ?? 0) > 0 ? 'text-accent' : '' },
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen del negocio · {periodoActual.chartLabel}</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <Store className="w-4 h-4" />Ir a la tienda
          </Button>
        </Link>
      </div>

      {/* Tabs período */}
      <div className="inline-flex border border-border rounded-lg p-0.5 mb-5 bg-card">
        {PERIODOS.map((p) => (
          <button key={p.id} onClick={() => setPeriodo(p.id)} className={cn(
            'px-3 sm:px-4 py-1.5 text-sm rounded-md transition-colors',
            periodo === p.id ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
          )}>{p.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label}><CardContent className="p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground truncate">{label}</p>
              <Icon className={cn('w-4 h-4 flex-shrink-0', color || 'text-muted-foreground')} />
            </div>
            <p className={cn('text-lg sm:text-xl font-bold', color)}>{isLoading ? '—' : value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Gráfica ingresos vs egresos */}
      <Card className="mb-4">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Ingresos vs Egresos — {periodoActual.chartLabel}</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-foreground" />Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent" />Egresos</span>
          </div>
        </CardHeader>
        <CardContent>
          {chart && chart.length > 0 ? (
            <DualBarChart data={chart} />
          ) : <div className="h-48 skeleton rounded-lg" />}
        </CardContent>
      </Card>

      {/* Breakdown row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Productos más vendidos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2.5">
              {!top?.length ? <p className="text-muted-foreground text-sm text-center py-4">Sin datos en este período</p>
              : top.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary text-foreground text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.item?.producto?.nombre ?? 'Producto'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.item?.codigoSku}</p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0">{p.totalVendido} uds.</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Ingresos por canal</CardTitle></CardHeader>
          <CardContent>
            {!revChan?.length ? <p className="text-muted-foreground text-sm text-center py-4">Sin datos</p>
            : <HorizontalBars data={revChan.map((r: any) => ({ label: r.canal, value: r.monto, count: r.cantidad }))} fmt={formatPrice} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Egresos por categoría</CardTitle></CardHeader>
          <CardContent>
            {!expCat?.length ? <p className="text-muted-foreground text-sm text-center py-4">Sin gastos en período</p>
            : <HorizontalBars data={expCat.map((c: any) => ({ label: c.categoria, value: c.monto, count: c.cantidad }))} fmt={formatPrice} color="bg-accent" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Componente: gráfica de barras duales (ingresos vs egresos) ──
function DualBarChart({ data }: { data: any[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.ingresos, d.egresos)), 1);

  return (
    <div className="flex items-end gap-1 h-48">
      {data.map((d, i) => {
        const inPct = (d.ingresos / max) * 100;
        const exPct = (d.egresos / max) * 100;
        const dateLabel = d.fecha.includes(':')
          ? d.fecha // hora
          : new Date(d.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: data.length > 14 ? undefined : 'short' });
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
            <div className="w-full flex items-end justify-center gap-0.5 h-40" title={`Ing: ${formatPrice(d.ingresos)} · Eg: ${formatPrice(d.egresos)}`}>
              <div
                className="w-1/2 bg-foreground rounded-t transition-all hover:opacity-80"
                style={{ height: `${Math.max(inPct, d.ingresos > 0 ? 3 : 0)}%` }}
              />
              <div
                className="w-1/2 bg-accent rounded-t transition-all hover:opacity-80"
                style={{ height: `${Math.max(exPct, d.egresos > 0 ? 3 : 0)}%` }}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate w-full text-center">{dateLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente: barras horizontales ──
function HorizontalBars({ data, fmt, color = 'bg-foreground' }: { data: { label: string; value: number; count: number }[]; fmt: (v: number) => string; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium truncate">{d.label}</span>
            <span className="text-muted-foreground ml-2 flex-shrink-0">{fmt(d.value)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{d.count} {d.count === 1 ? 'transacción' : 'transacciones'}</p>
        </div>
      ))}
    </div>
  );
}
