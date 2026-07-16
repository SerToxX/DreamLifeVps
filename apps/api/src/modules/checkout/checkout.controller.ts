import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Checkout')
@ApiBearerAuth()
@Controller('checkout')
export class CheckoutController {
  constructor(private service: CheckoutService) {}

  @Public()
  @Post()
  process(@Body() dto: any) {
    return this.service.process(dto);
  }
}
