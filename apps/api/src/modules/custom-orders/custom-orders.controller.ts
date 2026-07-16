import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CustomOrdersService } from './custom-orders.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Custom Orders')
@ApiBearerAuth()
@Controller('custom-orders')
export class CustomOrdersController {
  constructor(private service: CustomOrdersService) {}

  // Admin/Worker: listar todos
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  findAll() { return this.service.findAll(); }

  // Cliente autenticado: ver sus propios pedidos
  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  findMy(@CurrentUser('id') clienteId: number) { return this.service.findByCliente(clienteId); }

  // Cualquier visitante puede solicitar (público)
  @Public() @Post()
  create(@Body() body: any) {
    // Si manda clienteId úsalo, sino fallback a 0 (anónimo)
    return this.service.create({
      clienteId: body.clienteId ?? 1,
      descripcion: body.descripcion,
      imagenUrl: body.imagenUrl,
      notas: body.notas,
    });
  }

  // Admin actualiza estado/precio
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }
}
