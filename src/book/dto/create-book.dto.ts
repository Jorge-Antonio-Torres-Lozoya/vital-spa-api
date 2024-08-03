import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  price: string;

  @IsOptional()
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  pdfUrl: string;
}
