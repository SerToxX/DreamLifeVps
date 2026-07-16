import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  async openCaja(usuarioId: number, ubicacionId: number, montoInicial: number) {
    const existing = await this.prisma.caja.findFirst({ where: { usuarioId, estado: 'ABIERTA' } });
    if (existing) throw new BadRequestException('Ya tienes una caja abierta');
    return this.prisma.caja.create({ data: { usuarioId, ubicacionId, montoInicial, estado: 'ABIERTA' } });
  }

  async closeCaja(cajaId: number, montoFinal: number) {
    const caja = await this.prisma.caja.findUnique({ where: { id: cajaId } });
    if (!caja) throw new NotFoundException('Caja no encontrada');
    if (caja.estado === 'CERRADA') throw new BadRequestException('La caja ya está cerrada');
    return this.prisma.caja.update({ where: { id: cajaId }, data: { estado: 'CERRADA', montoFinal, fechaCierre: new Date() } });
  }

  async sale(dto: { cajaId: number; items: { itemId: number; cantidad: number; precio: number }[]; pagos: { metodo: string; monto: number }[]; clienteId?: number; descuento?: number; usuarioId: number }) {
    const caja = await this.prisma.caja.findUnique({ where: { id: dto.cajaId } });
    if (!caja || caja.estado !== 'ABIERTA') throw new BadRequestException('Caja no disponible');

    const total = dto.items.reduce((a, i) => a + i.precio * i.cantidad, 0) - (dto.descuento || 0);

    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: { usuarioId: dto.usuarioId, clienteId: dto.clienteId, cajaId: dto.cajaId, ubicacionId: caja.ubicacionId, canal: 'TIENDA', estado: 'ENTREGADO', total, descuento: dto.descuento || 0 },
      });
      for (const item of dto.items) {
        await tx.ventaDetalle.create({ data: { ventaId: venta.id, itemId: item.itemId, cantidad: item.cantidad, precioBase: item.precio, precioVendido: item.precio } });
        const stock = await tx.stock.findFirst({ where: { itemId: item.itemId, ubicacionId: caja.ubicacionId } });
        if (stock) await tx.stock.update({ where: { id: stock.id }, data: { cantidad: { decrement: item.cantidad } } });
      }
      for (const pago of dto.pagos) {
        await tx.pago.create({ data: { ventaId: venta.id, metodo: pago.metodo, monto: pago.monto } });
      }
      return venta;
    });
  }

  getCajas(usuarioId?: number) {
    return this.prisma.caja.findMany({ where: usuarioId ? { usuarioId } : {}, include: { usuario: true, ubicacion: true }, orderBy: { fechaApertura: 'desc' } });
  }
}
