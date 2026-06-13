import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../common/role.enum';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('sales')
  sales() { return this.reports.sales(); }

  @Get('inventory')
  inventory() { return this.reports.inventory(); }
}
