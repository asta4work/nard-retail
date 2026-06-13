import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PRODUCT_ICONS, ProductIcon } from './product-icons';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsIn(PRODUCT_ICONS)
  icon: ProductIcon = 'package';
}

export class UpdateProductDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(180) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) price?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockQuantity?: number;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) category?: string;
  @IsOptional() @IsIn(PRODUCT_ICONS) icon?: ProductIcon;
}

export class ProductQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @IsIn(['all', 'in-stock', 'low-stock', 'out-of-stock']) availability = 'all';
  @IsOptional() @IsIn(['price', 'stock', 'newest', 'name']) sort = 'newest';
  @IsOptional() @IsIn(['ASC', 'DESC', 'asc', 'desc']) order = 'DESC';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 10;
}
