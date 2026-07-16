import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getRange(periodo: string): { from: Date; to: Date; days: number } {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const to = now;

    if (periodo === 'hoy') {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      return { from, to, days: 1 };
    }
    if (periodo === 'semana') {
      const from = new Date();
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, to, days: 7 };
    }
    if (periodo === 'mes') {
      const from = new Date();
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      return { from, to, days: 30 };
    }
    if (periodo === 'año' || periodo === 'anio') {
      const from = new Date();
      from.setDate(from.getDate() - 364);
      from.setHours(0, 0, 0, 0);
      return { from, to, days: 365 };
    }
    // default 7 días
    const from = new Date();
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    return { from, to, days: 7 };
  }

  async getSummary(periodo = 'mes') {
    const { from, to } = this.getRange(periodo);

    const [ventasPeriodo, totalClientes, totalProductos, stockAlertas, pedidosPendientes, gastosPeriodo] = await Promise.all([
      this.prisma.venta.aggregate({
        where: { createdAt: { gte: from, lte: to }, estado: { notIn: ['CANCELADO'] } },
        _sum: { total: true }, _count: true,
      }),
      this.prisma.cliente.count({ where: { activo: true } }),
      this.prisma.producto.count({ where: { activo: true } }),
      this.prisma.stock.count({ where: { cantidad: { lte: 5 } } }),
      this.prisma.venta.count({ where: { estado: 'PENDIENTE' } }),
      this.prisma.gasto.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _sum: { monto: true }, _count: true,
      }),
    ]);

    // Ventas hoy adicionalmente
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const ventasHoy = await this.prisma.venta.aggregate({
      where: { createdAt: { gte: todayStart }, estado: { notIn: ['CANCELADO'] } },
      _sum: { total: true }, _count: true,
    });

    const ingresos = Number(ventasPeriodo._sum.total || 0);
    const egresos = Number(gastosPeriodo._sum.monto || 0);

    return {
      periodo,
      from: from.toISOString(),
      to: to.toISOString(),
      ventasHoy: { monto: Number(ventasHoy._sum.total || 0), cantidad: ventasHoy._count },
      ventasPeriodo: { monto: ingresos, cantidad: ventasPeriodo._count },
      ingresos,
      egresos,
      gananciaNeta: ingresos - egresos,
      totalClientes,
      totalProductos,
      alertasStock: stockAlertas,
      pedidosPendientes,
    };
  }

  async getSalesChart(periodo = 'semana') {
    const { from, days } = this.getRange(periodo);
    const data = [];

    // Para "hoy" mostramos por horas
    if (periodo === 'hoy') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      for (let h = 0; h < 24; h++) {
        const start = new Date(todayStart);
        start.setHours(h);
        const end = new Date(start);
        end.setHours(h + 1);
        const [vRes, gRes] = await Promise.all([
          this.prisma.venta.aggregate({
            where: { createdAt: { gte: start, lt: end }, estado: { notIn: ['CANCELADO'] } },
            _sum: { total: true }, _count: true,
          }),
          this.prisma.gasto.aggregate({
            where: { createdAt: { gte: start, lt: end } },
            _sum: { monto: true },
          }),
        ]);
        data.push({
          fecha: `${h.toString().padStart(2, '0')}:00`,
          ingresos: Number(vRes._sum.total || 0),
          egresos: Number(gRes._sum.monto || 0),
          cantidad: vRes._count,
        });
      }
      return data;
    }

    // Para semana/mes: por días
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const [vRes, gRes] = await Promise.all([
        this.prisma.venta.aggregate({
          where: { createdAt: { gte: date, lt: next }, estado: { notIn: ['CANCELADO'] } },
          _sum: { total: true }, _count: true,
        }),
        this.prisma.gasto.aggregate({
          where: { createdAt: { gte: date, lt: next } },
          _sum: { monto: true },
        }),
      ]);
      data.push({
        fecha: date.toISOString().split('T')[0],
        ingresos: Number(vRes._sum.total || 0),
        egresos: Number(gRes._sum.monto || 0),
        cantidad: vRes._count,
      });
    }
    return data;
  }

  async getTopProducts(periodo = 'mes', limit = 5) {
    const { from, to } = this.getRange(periodo);
    const detalles = await this.prisma.ventaDetalle.groupBy({
      by: ['itemId'],
      where: { venta: { createdAt: { gte: from, lte: to }, estado: { notIn: ['CANCELADO'] } } },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: limit,
    });
    return Promise.all(detalles.map(async d => {
      const item = await this.prisma.productoItem.findUnique({
        where: { id: d.itemId },
        include: { producto: true, imagenes: { take: 1 } }
      });
      return { item, totalVendido: d._sum.cantidad };
    }));
  }

  // Breakdown egresos por categoría
  async getExpensesByCategory(periodo = 'mes') {
    const { from, to } = this.getRange(periodo);
    const result = await this.prisma.gasto.groupBy({
      by: ['categoria'],
      where: { createdAt: { gte: from, lte: to } },
      _sum: { monto: true },
      _count: true,
    });
    return result.map(r => ({
      categoria: r.categoria ?? 'general',
      monto: Number(r._sum.monto || 0),
      cantidad: r._count,
    })).sort((a, b) => b.monto - a.monto);
  }

  // Breakdown ingresos por canal
  async getRevenueByChannel(periodo = 'mes') {
    const { from, to } = this.getRange(periodo);
    const result = await this.prisma.venta.groupBy({
      by: ['canal'],
      where: { createdAt: { gte: from, lte: to }, estado: { notIn: ['CANCELADO'] } },
      _sum: { total: true },
      _count: true,
    });
    return result.map(r => ({
      canal: r.canal,
      monto: Number(r._sum.total || 0),
      cantidad: r._count,
    }));
  }
}
