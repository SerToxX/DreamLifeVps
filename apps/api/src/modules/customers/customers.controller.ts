import { Controller, Get, Put, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

  // Cliente: su propio perfil
  @Get('me') @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUser('id') id: number) { return this.service.findOne(id); }

  @Put('me') @UseGuards(AuthGuard('jwt'))
  updateMe(@CurrentUser('id') id: number, @Body() body: any) {
    const { nombre, apellido, dni, telefono, direccion } = body;
    return this.service.update(id, { nombre, apellido, dni, telefono, direccion });
  }

  // Admin/Worker
  @Get() @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  findAll(@Query('search') s?: string) { return this.service.findAll(s); }

  @Get(':id') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Put(':id') @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin', 'worker')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }
}
