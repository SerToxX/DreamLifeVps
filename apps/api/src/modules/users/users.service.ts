import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.usuario.findMany({ select: { id: true, nombre: true, correo: true, activo: true, rol: true, createdAt: true } }); }
  findOne(id: number) { return this.prisma.usuario.findUnique({ where: { id }, select: { id: true, nombre: true, correo: true, activo: true, rol: true, createdAt: true } }); }
  async create(data: any) {
    data.contrasena = await bcrypt.hash(data.contrasena, 12);
    return this.prisma.usuario.create({ data });
  }
  update(id: number, data: any) { return this.prisma.usuario.update({ where: { id }, data }); }
}
