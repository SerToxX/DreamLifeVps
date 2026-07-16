import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MarketingService } from './marketing.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing')
export class MarketingController {
  constructor(private service: MarketingService) {}

  @Public() @Get('ofertas')
  getOfertas() { return this.service.getOfertas(); }

  @Post('ofertas')
  @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  createOferta(@Body() b: any) { return this.service.createOferta(b); }

  @Get('cupones')
  @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  getCupones() { return this.service.getCupones(); }

  @Post('cupones')
  @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  createCupon(@Body() b: any) { return this.service.createCupon(b); }

  @Public() @Post('cupones/validate')
  validate(@Body('codigo') c: string) { return this.service.validateCupon(c); }
}
