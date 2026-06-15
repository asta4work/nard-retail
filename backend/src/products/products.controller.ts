import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './product.dto';
import { ProductsService } from './products.service';

@Controller('products')
@ApiTags('products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post() @Roles(Role.Admin) create(@Body() dto: CreateProductDto) { return this.products.create(dto); }
  @Get() findAll(@Query() query: ProductQueryDto) { return this.products.findAll(query); }
  @Get('categories') categories() { return this.products.categories(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.products.findOne(id); }
  @Patch(':id') @Roles(Role.Admin) update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) { return this.products.update(id, dto); }
  @Delete(':id') @Roles(Role.Admin) remove(@Param('id', ParseIntPipe) id: number) { return this.products.remove(id); }
}
