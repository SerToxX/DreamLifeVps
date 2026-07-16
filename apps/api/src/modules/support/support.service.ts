import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  // Libro de reclamaciones
  createReclamacion(data: any) {
    return this.prisma.reclamacion.create({ data });
  }

  listReclamaciones() {
    return this.prisma.reclamacion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  updateReclamacion(id: number, data: any) {
    return this.prisma.reclamacion.update({ where: { id }, data });
  }

  // Contacto
  createContacto(data: any) {
    return this.prisma.contacto.create({ data });
  }

  listContactos() {
    return this.prisma.contacto.findMany({ orderBy: { createdAt: 'desc' } });
  }

  marcarLeido(id: number) {
    return this.prisma.contacto.update({ where: { id }, data: { leido: true } });
  }
}
