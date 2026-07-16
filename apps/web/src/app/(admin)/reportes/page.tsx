'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';

function rangeFor(preset: string): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  const start = new Date();
  if (preset === 'hoy') start.setHours(0, 0, 0, 0);
  else if (preset === 'semana') start.setDate(start.getDate() - 6);
  else if (preset === 'mes') start.setDate(start.getDate() - 29);
  else if (preset === 'trimestre') start.setDate(start.getDate() - 89);
  else if (preset === 'anio') start.setDate(start.getDate() - 364);
  return { from: start.toISOString().split('T')[0], to };
}

export default function ReportesPage() {
  const [preset, setPreset] = useState<string>('mes');
  const [{ from, to }, setRange] = useState(rangeFor('mes'));

  const setPresetAndRange = (p: string) => {
    setPreset(p);
    if (p !== 'custom') setRange(rangeFor(p));
  };

  const params = { from, to };
  const { data: summary } = useQuery({ queryKey: ['rep-sum', from, to], queryFn: () => api.get('/reports/summary', { params }).then((r) => r.data) });
  const { data: chart } = useQuery({ queryKey: ['rep-chart', from, to], queryFn: () => api.get('/reports/financial-chart', { params }).then((r) => r.data) });
  const { data: expByCat } = useQuery({ queryKey: ['rep-exp', from, to], queryFn: () => api.get('/reports/expenses-by-category', { params }).then((r) => r.data) });
  const { data: byLoc } = useQuery({ queryKey: ['rep-loc', from, to], queryFn: () => api.get('/reports/by-location', { params }).then((r) => r.data) });
  const { data: top } = useQuery({ queryKey: ['rep-top', from, to], queryFn: () => api.get('/reports/top-products', { params }).then((r) => r.data) });

  const ingresos = summary?.ingresos ?? 0;
  const egresos = summary?.egresos ?? 0;
  const ganancia = ingresos - egresos;
  const margenPct = ingresos > 0 ? (ganancia / ingresos) * 100 : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Reportes</h1>
      <p className="text-muted-foreground text-sm mb-6">Análisis financiero del negocio</p>

      {/* Presets período + custom range */}
      <Card className="mb-5">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <div className="inline-flex border border-border rounded-lg p-0.5 bg-card">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: '7 días' },
              { id: 'mes', label: '30 días' },
              { id: 'trimestre', label: '3 meses' },
              { id: 'anio', label: '1 año' },
            ].map((p) => (
              <button key={p.id} onClick={() => setPresetAndRange(p.id)} className={cn(
                'px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors',
                preset === p.id ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
              )}>{p.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Desde</span>
            <Input type="date" value={from} onChange={(e) => { setPreset('custom'); setRange((r) => ({ ...r, from: e.target.value })); }} className="w-auto" />
            <span className="text-xs text-muted-foreground">Hasta</span>
            <Input type="date" value={to} onChange={(e) => { setPreset('custom'); setRange((r) => ({ ...r, to: e.target.value })); }} className="w-auto" />
          </div>
        </CardContent>
      </Card>

      {/* KPIs financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-muted-foreground">Ingresos</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{formatPrice(ingresos)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.ventasCantidad ?? 0} ventas</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-accent" />
            <p className="text-sm text-muted-foreground">Egresos</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{formatPrice(egresos)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.gastosCantidad ?? 0} gastos</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4" />
            <p className="text-sm text-muted-foreground">Ganancia neta</p>
          </div>
          <p className={cn('text-2xl sm:text-3xl font-bold', ganancia < 0 && 'text-accent')}>{formatPrice(ganancia)}</p>
          <p className="text-xs text-muted-foreground mt-1">{margenPct.toFixed(1)}% margen</p>
        </CardContent></Card>
      </div>

      {/* Gráfica financiera */}
      <Card className="mb-4">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Ingresos vs Egresos</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-foreground" />Ingresos</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent" />Egresos</span>
          </div>
        </CardHeader>
        <CardContent>
          {chart && chart.length > 0 ? <FinancialChart data={chart} /> : <div className="h-48 skeleton rounded-lg" />}
        </CardContent>
      </Card>

      {/* Grid breakdowns */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Egresos por categoría</CardTitle></CardHeader>
          <CardContent>
            {!expByCat?.length ? <p className="text-muted-foreground text-sm text-center py-4">Sin gastos</p>
            : <HorizontalBars data={expByCat.map((c: any) => ({ label: c.categoria, value: c.monto, count: c.cantidad }))} fmt={formatPrice} color="bg-accent" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" />Ventas por ubicación</CardTitle></CardHeader>
          <CardContent>
            {!byLoc?.length ? <p className="text-muted-foreground text-sm text-center py-4">Sin datos</p>
            : <HorizontalBars data={byLoc.map((l: any) => ({ label: l.nombre ?? 'Sin asignar', value: l.total, count: l.cantidad }))} fmt={formatPrice} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BarChart2 className="w-4 h-4" />Top productos</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {!top?.length ? <p className="text-muted-foreground text-sm text-center py-4">Sin datos</p>
              : top.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-secondary text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                    <span className="text-sm font-medium truncate">{p.item?.producto?.nombre ?? 'Producto'}</span>
                  </div>
                  <span className="font-bold text-sm flex-shrink-0">{p.unidades ?? p.totalVendido ?? 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FinancialChart({ data }: { data: any[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.ingresos ?? 0, d.egresos ?? 0)), 1);
  const showAll = data.length <= 31;
  return (
    <div className="flex items-end gap-1 h-48">
      {data.map((d, i) => {
        const inPct = ((d.ingresos ?? 0) / max) * 100;
        const exPct = ((d.egresos ?? 0) / max) * 100;
        const fecha = new Date(d.fecha);
        const label = showAll ? `${fecha.getDate()}` : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex items-end justify-center gap-0.5 h-40" title={`${d.fecha} · Ing: ${formatPrice(d.ingresos)} · Eg: ${formatPrice(d.egresos)}`}>
              <div className="w-1/2 bg-foreground rounded-t hover:opacity-80 transition-opacity" style={{ height: `${Math.max(inPct, d.ingresos > 0 ? 3 : 0)}%` }} />
              <div className="w-1/2 bg-accent rounded-t hover:opacity-80 transition-opacity" style={{ height: `${Math.max(exPct, d.egresos > 0 ? 3 : 0)}%` }} />
            </div>
            {(showAll || i % Math.ceil(data.length / 10) === 0) && <span className="text-[9px] text-muted-foreground truncate w-full text-center">{label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBars({ data, fmt, color = 'bg-foreground' }: { data: { label: string; value: number; count: number }[]; fmt: (v: number) => string; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium truncate capitalize">{d.label}</span>
            <span className="text-muted-foreground ml-2 flex-shrink-0">{fmt(d.value)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{d.count} {d.count === 1 ? 'item' : 'items'}</p>
        </div>
      ))}
    </div>
  );
}
