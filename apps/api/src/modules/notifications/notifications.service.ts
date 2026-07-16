import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  create(data: { tipo: string; titulo: string; mensaje: string; usuarioId?: number }) {
    return this.prisma.notificacion.create({ data });
  }

  getForUser(usuarioId: number) {
    return this.prisma.notificacion.findMany({ where: { usuarioId, leida: false }, orderBy: { createdAt: 'desc' }, take: 20 });
  }

  markRead(id: number) {
    return this.prisma.notificacion.update({ where: { id }, data: { leida: true } });
  }
}
