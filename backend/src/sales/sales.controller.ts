import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { User } from '../users/user.entity';
import { CheckoutDto, SalesQueryDto } from './sales.dto';
import { SalesService } from './sales.service';

@Controller('sales')
@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Post()
  checkout(@Body() dto: CheckoutDto, @Req() request: Request & { user: User }) {
    return this.sales.checkout(dto, request.user);
  }

  @Get()
  findAll(@Query() query: SalesQueryDto) {
    return this.sales.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sales.findOne(id);
  }
}
