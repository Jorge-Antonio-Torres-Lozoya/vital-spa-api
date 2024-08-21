import { forwardRef, Module } from '@nestjs/common';
import { SaleService } from './sale.service';
import { SaleController } from './sale.controller';
import { Sale } from './sale.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookModule } from '../book/book.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sale]), forwardRef(() => BookModule)],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
