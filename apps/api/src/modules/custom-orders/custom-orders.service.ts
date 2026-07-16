import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomOrdersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.pedidoPersonalizado.findMany({
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByCliente(clienteId: number) {
    return this.prisma.pedidoPersonalizado.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: { clienteId: number; descripcion: string; imagenUrl?: string; notas?: string }) {
    return this.prisma.pedidoPersonalizado.create({ data });
  }

  update(id: number, data: any) {
    return this.prisma.pedidoPersonalizado.update({ where: { id }, data });
  }
}
