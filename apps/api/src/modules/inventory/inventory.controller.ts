import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'worker')
@Controller('inventory')
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get('stock')
  getStock(@Query('ubicacionId') ubicacionId?: number) {
    return this.service.getStock(ubicacionId ? +ubicacionId : undefined);
  }

  @Get('alerts') getAlerts() { return this.service.getAlerts(); }

  @Get('history')
  getHistory(@Query('itemId') itemId?: number) {
    return this.service.getHistory(itemId ? +itemId : undefined);
  }

  // ── Ubicaciones CRUD ──────────────────────────────────
  @Get('ubicaciones')
  getUbicaciones(@Query('includeInactive') includeInactive?: string) {
    return this.service.getUbicaciones(includeInactive === 'true');
  }

  @Post('ubicaciones')
  @Roles('admin')
  createUbicacion(@Body() body: any) { return this.service.createUbicacion(body); }

  @Put('ubicaciones/:id')
  @Roles('admin')
  updateUbicacion(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateUbicacion(id, body);
  }

  @Delete('ubicaciones/:id')
  @Roles('admin')
  deleteUbicacion(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteUbicacion(id);
  }

  // ── Stock ─────────────────────────────────────────────
  @Post('adjust')
  adjust(@Body() dto: any, @CurrentUser('id') userId: number) {
    return this.service.adjust({ ...dto, usuarioId: userId });
  }

  @Post('transfer')
  transfer(@Body() dto: any, @CurrentUser('id') userId: number) {
    return this.service.transfer({ ...dto, usuarioId: userId });
  }

  // Setear stock inicial directo en una ubicación
  @Post('set-stock')
  setStock(@Body() body: { itemId: number; ubicacionId: number; cantidad: number }) {
    return this.service.setStock(body.itemId, body.ubicacionId, body.cantidad);
  }
}
