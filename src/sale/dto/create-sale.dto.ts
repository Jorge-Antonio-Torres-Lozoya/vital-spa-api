import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSaleDto {
  @IsNumber()
  @IsNotEmpty()
  total_price: number;

  @IsNumber()
  @IsNotEmpty()
  bookId: number;
}
