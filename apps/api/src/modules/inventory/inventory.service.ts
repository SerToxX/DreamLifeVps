import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStock(ubicacionId?: number) {
    const where: any = {};
    if (ubicacionId) where.ubicacionId = ubicacionId;
    const stocks = await this.prisma.stock.findMany({
      where,
      include: { item: { include: { producto: true, variante: true, diseno: true } }, ubicacion: true },
      orderBy: { id: 'asc' },
    });
    return stocks.map(s => ({
      ...s,
      disponible: s.cantidad - s.reservado,
      alerta: s.cantidad === 0 ? 'ROJO' : s.cantidad <= 5 ? 'AMARILLO' : 'VERDE',
    }));
  }

  // Ajuste: acepta stockId O (itemId + ubicacionId)
  async adjust(dto: { stockId?: number; itemId?: number; ubicacionId?: number; tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'; cantidad: number; motivo?: string; usuarioId?: number }) {
    let stock: any = null;
    if (dto.stockId) {
      stock = await this.prisma.stock.findUnique({ where: { id: Number(dto.stockId) } });
    } else if (dto.itemId && dto.ubicacionId) {
      stock = await this.prisma.stock.findUnique({
        where: { itemId_ubicacionId: { itemId: Number(dto.itemId), ubicacionId: Number(dto.ubicacionId) } },
      });
      if (!stock) {
        stock = await this.prisma.stock.create({
          data: { itemId: Number(dto.itemId), ubicacionId: Number(dto.ubicacionId), cantidad: 0 },
        });
      }
    } else {
      throw new BadRequestException('Debes enviar stockId o (itemId + ubicacionId)');
    }

    if (!stock) throw new BadRequestException('Stock no encontrado');

    const cantidad = Number(dto.cantidad);
    if (isNaN(cantidad) || cantidad < 0) throw new BadRequestException('Cantidad inválida');

    let nuevaCantidad: number;
    if (dto.tipo === 'ENTRADA') nuevaCantidad = stock.cantidad + cantidad;
    else if (dto.tipo === 'SALIDA') nuevaCantidad = stock.cantidad - cantidad;
    else nuevaCantidad = cantidad; // AJUSTE = setea valor absoluto

    if (nuevaCantidad < 0) throw new BadRequestException('Stock insuficiente');

    const [updatedStock, ajuste] = await this.prisma.$transaction([
      this.prisma.stock.update({ where: { id: stock.id }, data: { cantidad: nuevaCantidad } }),
      this.prisma.ajusteStock.create({
        data: {
          stockId: stock.id,
          usuarioId: dto.usuarioId ?? 1,
          tipo: dto.tipo,
          cantidad: cantidad,
          motivo: dto.motivo ?? 'Ajuste manual',
        },
      }),
    ]);

    return { stock: updatedStock, ajuste };
  }

  async transfer(dto: { itemId: number; origenId: number; destinoId: number; cantidad: number; usuarioId: number }) {
    const origen = await this.prisma.stock.findUnique({
      where: { itemId_ubicacionId: { itemId: Number(dto.itemId), ubicacionId: Number(dto.origenId) } },
    });
    if (!origen || origen.cantidad < dto.cantidad) throw new BadRequestException('Stock insuficiente en origen');

    await this.prisma.$transaction([
      this.prisma.stock.update({ where: { id: origen.id }, data: { cantidad: { decrement: Number(dto.cantidad) } } }),
      this.prisma.stock.upsert({
        where: { itemId_ubicacionId: { itemId: Number(dto.itemId), ubicacionId: Number(dto.destinoId) } },
        update: { cantidad: { increment: Number(dto.cantidad) } },
        create: { itemId: Number(dto.itemId), ubicacionId: Number(dto.destinoId), cantidad: Number(dto.cantidad) },
      }),
      this.prisma.movimientoStock.create({
        data: {
          itemId: Number(dto.itemId),
          origenId: Number(dto.origenId),
          destinoId: Number(dto.destinoId),
          cantidad: Number(dto.cantidad),
          tipo: 'TRANSFERENCIA',
          usuarioId: dto.usuarioId,
        },
      }),
    ]);
    return { message: 'Transferencia exitosa' };
  }

  async getAlerts() {
    const stocks = await this.prisma.stock.findMany({
      where: { cantidad: { lte: 10 } },
      include: { item: { include: { producto: true } }, ubicacion: true },
    });
    return stocks.map(s => ({
      ...s,
      alerta: s.cantidad === 0 ? 'ROJO' : s.cantidad <= 5 ? 'AMARILLO' : 'VERDE',
    }));
  }

  getHistory(itemId?: number) {
    return this.prisma.movimientoStock.findMany({
      where: itemId ? { itemId } : {},
      include: { origen: true, destino: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  getUbicaciones(includeInactive = false) {
    return this.prisma.ubicacion.findMany({
      where: includeInactive ? {} : { activa: true },
      orderBy: { id: 'asc' },
    });
  }

  // ── CRUD Ubicaciones ──
  createUbicacion(data: { nombre: string; tipo?: string; ciudad?: string }) {
    return this.prisma.ubicacion.create({
      data: {
        nombre: data.nombre,
        tipo: (data.tipo as any) ?? 'tienda',
        ciudad: data.ciudad,
        activa: true,
      },
    });
  }

  updateUbicacion(id: number, data: any) {
    const { nombre, tipo, ciudad, activa } = data;
    return this.prisma.ubicacion.update({ where: { id }, data: { nombre, tipo, ciudad, activa } });
  }

  async deleteUbicacion(id: number) {
    // Soft delete (marcar inactiva si tiene stocks)
    const count = await this.prisma.stock.count({ where: { ubicacionId: id } });
    if (count > 0) {
      return this.prisma.ubicacion.update({ where: { id }, data: { activa: false } });
    }
    return this.prisma.ubicacion.delete({ where: { id } });
  }

  // Setear stock directo (para nuevos productos)
  setStock(itemId: number, ubicacionId: number, cantidad: number) {
    return this.prisma.stock.upsert({
      where: { itemId_ubicacionId: { itemId, ubicacionId } },
      update: { cantidad },
      create: { itemId, ubicacionId, cantidad },
    });
  }

}
