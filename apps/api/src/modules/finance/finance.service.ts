import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getSummary(from?: Date, to?: Date) {
    const where: any = {};
    if (from || to) where.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };

    const [ventas, gastos] = await Promise.all([
      this.prisma.venta.aggregate({ where: { ...where, estado: { notIn: ['CANCELADO'] } }, _sum: { total: true }, _count: true }),
      this.prisma.gasto.aggregate({ where, _sum: { monto: true }, _count: true }),
    ]);

    const ingresos = Number(ventas._sum.total || 0);
    const totalGastos = Number(gastos._sum.monto || 0);
    return { ingresos, gastos: totalGastos, gananciaBruta: ingresos, gananciaNeta: ingresos - totalGastos, cantidadVentas: ventas._count, cantidadGastos: gastos._count };
  }

  createGasto(data: any) {
    return this.prisma.gasto.create({ data });
  }

  getGastos(from?: Date, to?: Date) {
    const where: any = {};
    if (from || to) where.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };
    return this.prisma.gasto.findMany({ where, include: { ubicacion: true, usuario: true }, orderBy: { createdAt: 'desc' } });
  }
}
