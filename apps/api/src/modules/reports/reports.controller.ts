import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin')
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('sales') getSales(@Query('from') f: string, @Query('to') t: string) {
    return this.service.getSales(new Date(f), new Date(t));
  }
  @Get('top-products') getTop(@Query('from') f?: string, @Query('to') t?: string, @Query('limit') l?: number) {
    return this.service.getTopProducts(f ? new Date(f) : undefined, t ? new Date(t) : undefined, l ? +l : 10);
  }
  @Get('by-location') byLocation(@Query('from') f?: string, @Query('to') t?: string) {
    return this.service.getSalesByLocation(f ? new Date(f) : undefined, t ? new Date(t) : undefined);
  }

  // Serie temporal de ingresos/egresos
  @Get('financial-chart') financialChart(@Query('from') f: string, @Query('to') t: string) {
    return this.service.getFinancialChart(new Date(f), new Date(t));
  }
  @Get('expenses-by-category') expensesByCategory(@Query('from') f: string, @Query('to') t: string) {
    return this.service.getExpensesByCategory(new Date(f), new Date(t));
  }
  @Get('summary') summary(@Query('from') f: string, @Query('to') t: string) {
    return this.service.getSummary(new Date(f), new Date(t));
  }
}
