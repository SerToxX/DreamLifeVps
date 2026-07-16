import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface QuickCheckoutDto {
  items: { itemId: number; cantidad: number; precioUnitario?: number }[];
  metodoPago?: string;
  direccionEnvio?: string;
  notaCliente?: string;
  clienteId?: number;
  cuponCodigo?: string;
}

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  // Quick checkout: acepta items directamente (sin necesidad de carrito en BD)
  async process(dto: QuickCheckoutDto) {
    if (!dto.items?.length) throw new BadRequestException('Sin items');

    // Cargar items y validar stock
    const itemIds = dto.items.map(i => Number(i.itemId));
    const items = await this.prisma.productoItem.findMany({
      where: { id: { in: itemIds } },
      include: { producto: true, variante: true, stocks: { orderBy: { cantidad: 'desc' } } },
    });
    if (items.length !== itemIds.length) throw new BadRequestException('Algún producto no existe');

    // Validar stock
    for (const itemReq of dto.items) {
      const item = items.find(i => i.id === Number(itemReq.itemId));
      if (!item) continue;
      const total = item.stocks.reduce((a, s) => a + s.cantidad, 0);
      if (total < itemReq.cantidad) throw new BadRequestException(`Stock insuficiente para ${item.producto.nombre}`);
    }

    // Aplicar cupón
    let descuentoTotal = 0;
    if (dto.cuponCodigo) {
      const cupon = await this.prisma.cupon.findUnique({ where: { codigo: dto.cuponCodigo } });
      if (!cupon || !cupon.activo) throw new BadRequestException('Cupón inválido');
      if (cupon.fechaFin && cupon.fechaFin < new Date()) throw new BadRequestException('Cupón expirado');
      descuentoTotal = Number(cupon.descuento);
    }

    // Calcular total
    let total = 0;
    const detallesData: any[] = [];
    for (const req of dto.items) {
      const item = items.find(i => i.id === Number(req.itemId))!;
      const precio = req.precioUnitario != null ? Number(req.precioUnitario) : Number(item.producto.precioBase) + Number(item.variante?.precioExtra || 0);
      total += precio * req.cantidad;
      detallesData.push({ itemId: item.id, cantidad: req.cantidad, precioBase: precio, precioVendido: precio });
    }
    total = Math.max(0, total - descuentoTotal);

    // Transacción
    const venta = await this.prisma.$transaction(async (tx) => {
      const nuevaVenta = await tx.venta.create({
        data: {
          clienteId: dto.clienteId,
          canal: 'ONLINE',
          estado: 'CONFIRMADA',
          total,
          descuento: descuentoTotal,
          notas: dto.notaCliente,
        },
      });

      for (const det of detallesData) {
        await tx.ventaDetalle.create({ data: { ventaId: nuevaVenta.id, ...det } });
        // Decrementar stock
        const item = items.find(i => i.id === det.itemId)!;
        const stock = item.stocks.find(s => s.cantidad >= det.cantidad);
        if (stock) {
          await tx.stock.update({ where: { id: stock.id }, data: { cantidad: { decrement: det.cantidad } } });
        }
      }

      // Pago único
      await tx.pago.create({
        data: { ventaId: nuevaVenta.id, metodo: dto.metodoPago ?? 'EFECTIVO', monto: total },
      });

      if (dto.direccionEnvio) {
        await tx.envio.create({
          data: { ventaId: nuevaVenta.id, tipo: 'DELIVERY', estado: 'PENDIENTE', direccion: dto.direccionEnvio },
        });
      }

      if (dto.clienteId) {
        await tx.cliente.update({ where: { id: dto.clienteId }, data: { puntos: { increment: Math.floor(total) } } });
      }

      return nuevaVenta;
    });

    return { id: venta.id, ventaId: venta.id, total: venta.total, message: '¡Pedido procesado con éxito!' };
  }
}
