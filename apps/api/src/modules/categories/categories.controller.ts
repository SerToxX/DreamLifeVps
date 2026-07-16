import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Public() @Get() findAll() { return this.service.findAll(); }
  @Public() @Get('tree') findTree() { return this.service.findTree(); }
  @Public() @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin')
  create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard) @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
