'use client';
import { useQuery } from '@tanstack/react-query';
import { Tag, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export default function PromocionesPage() {
  const { data: ofertas } = useQuery({ queryKey: ['ofertas-pub'], queryFn: () => api.get('/marketing/ofertas?activa=true').then((r) => r.data) });
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Ofertas activas</h1>
        <p className="text-muted-foreground">Aprovecha nuestros descuentos por tiempo limitado</p>
      </div>
      {!ofertas?.length ? (
        <Card><CardContent className="p-12 text-center">
          <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay ofertas activas en este momento</p>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ofertas.map((o: any) => (
            <Card key={o.id}><CardContent className="p-5">
              <Tag className="w-6 h-6 mb-3 text-muted-foreground" />
              <h3 className="font-bold text-lg mb-1">{o.nombre}</h3>
              <p className="text-3xl font-bold mb-3">{o.tipoDescuento === 'PORCENTAJE' ? `${o.valor}%` : `S/. ${o.valor}`} <span className="text-sm font-normal text-muted-foreground">OFF</span></p>
              <p className="text-xs text-muted-foreground">Válido hasta {formatDate(o.fechaFin)}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
