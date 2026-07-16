import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  getOfertas() { return this.prisma.oferta.findMany({ where: { activa: true }, include: { items: { include: { item: { include: { producto: true } } } } } }); }
  createOferta(data: any) { return this.prisma.oferta.create({ data }); }
  getCupones() { return this.prisma.cupon.findMany({ where: { activo: true } }); }
  createCupon(data: any) { return this.prisma.cupon.create({ data }); }
  validateCupon(codigo: string) { return this.prisma.cupon.findUnique({ where: { codigo } }); }
}
