import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; categoriaId?: number; destacado?: boolean }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, categoriaId, destacado } = query;
    const where: any = { activo: true };
    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { nombre: { contains: s } },
        { descripcion: { contains: s } },
        { items: { some: { codigoSku: { contains: s } } } },
      ];
    }
    if (categoriaId) where.categoriaId = Number(categoriaId);
    if (destacado !== undefined) where.destacado = destacado;
    const [total, data] = await Promise.all([
      this.prisma.producto.count({ where }),
      this.prisma.producto.findMany({
        where, skip, take: limit,
        include: {
          categoria: true,
          imagenes: { orderBy: { orden: 'asc' }, take: 1 },
          items: { where: { activo: true }, include: { variante: true, diseno: true, stocks: { include: { ubicacion: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const product = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        imagenes: { orderBy: { orden: 'asc' } },
        variantes: true,
        items: { where: { activo: true }, include: { variante: true, diseno: true, imagenes: true, stocks: { include: { ubicacion: true } }, liquidaciones: { where: { activa: true } }, ofertaItems: { include: { oferta: true } } } },
      },
    });
    if (!product) throw new NotFoundException(`Producto #${id} no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.producto.create({
      data: { nombre: dto.nombre, descripcion: dto.descripcion, precioBase: dto.precioBase, personalizado: dto.personalizado || false, destacado: dto.destacado || false, categoriaId: dto.categoriaId },
      include: { categoria: true },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.producto.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.producto.update({ where: { id }, data: { activo: false } });
  }

  async getFeatured() {
    return this.prisma.producto.findMany({
      where: { activo: true, destacado: true }, take: 8,
      include: { imagenes: { orderBy: { orden: 'asc' }, take: 1 }, categoria: true },
    });
  }

  async createItem(productoId: number, body: any) {
    // Crear variante
    const variante = await this.prisma.variante.create({
      data: { productoId, tamano: body.tamano ?? 'Única', material: body.material ?? 'Estándar', precioExtra: body.precioExtra ?? 0 },
    });
    // Crear item con SKU
    return this.prisma.productoItem.create({
      data: {
        codigoSku: body.codigoSku,
        productoId,
        varianteId: variante.id,
        activo: true,
      },
    });
  }
}
