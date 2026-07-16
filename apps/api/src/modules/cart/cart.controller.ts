import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private service: CartService) {}

  @Get()
  getCart(@CurrentUser('id') clienteId: number, @Query('sessionId') sessionId?: string) {
    return this.service.getOrCreate(clienteId, sessionId);
  }

  @Public()
  @Get('session')
  getSessionCart(@Query('sessionId') sessionId: string) {
    return this.service.getOrCreate(undefined, sessionId);
  }

  @Post('items')
  addItem(@Body() body: { carritoId: number; itemId: number; cantidad: number }) {
    return this.service.addItem(body.carritoId, body.itemId, body.cantidad);
  }

  @Put('items/:id')
  updateItem(@Param('id', ParseIntPipe) id: number, @Body('cantidad') cantidad: number) {
    return this.service.updateItem(id, cantidad);
  }

  @Delete('items/:id')
  removeItem(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeItem(id);
  }

  @Delete(':carritoId/clear')
  clear(@Param('carritoId', ParseIntPipe) carritoId: number) {
    return this.service.clear(carritoId);
  }
}
