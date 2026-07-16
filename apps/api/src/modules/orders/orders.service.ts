import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  findAll(query: { page?: number; limit?: number; estado?: string; clienteId?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 100;
    const { estado, clienteId } = query;
    const where: any = {};
    if (estado) where.estado = estado;
    if (clienteId) where.clienteId = clienteId;
    return this.prisma.venta.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { cliente: true, usuario: true, ubicacion: true, pagos: true, detalles: { include: { item: { include: { producto: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.venta.findUnique({
      where: { id },
      include: { cliente: true, usuario: true, ubicacion: true, pagos: true, envios: true,
        detalles: { include: { item: { include: { producto: true, variante: true, imagenes: { take: 1 } } } } } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async updateStatus(id: number, estado: string) {
    await this.findOne(id);
    return this.prisma.venta.update({ where: { id }, data: { estado: estado as any } });
  }

  async cancel(id: number) {
    return this.updateStatus(id, 'CANCELADO');
  }
}
