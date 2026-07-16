import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FinanceService } from './finance.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('finance')
export class FinanceController {
  constructor(private service: FinanceService) {}
  @Get('summary') getSummary(@Query('from') from?: string, @Query('to') to?: string) { return this.service.getSummary(from ? new Date(from) : undefined, to ? new Date(to) : undefined); }
  @Get('gastos') getGastos(@Query('from') from?: string, @Query('to') to?: string) { return this.service.getGastos(from ? new Date(from) : undefined, to ? new Date(to) : undefined); }
  @Post('gastos') createGasto(@Body() body: any, @CurrentUser('id') uid: number) { return this.service.createGasto({ ...body, usuarioId: uid }); }
}
