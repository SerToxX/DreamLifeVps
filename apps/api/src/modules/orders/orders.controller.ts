import { Controller, Get, Patch, Delete, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Get() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  myOrders(@CurrentUser('id') id: number) { return this.service.findAll({ clienteId: id }); }

  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Patch(':id/status') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('estado') estado: string) {
    return this.service.updateStatus(id, estado);
  }

  @Delete(':id/cancel') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin')
  cancel(@Param('id', ParseIntPipe) id: number) { return this.service.cancel(id); }
}
