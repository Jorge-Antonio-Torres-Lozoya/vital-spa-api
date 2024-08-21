import { forwardRef, Module } from '@nestjs/common';
import { BookService } from './book.service';
import { Book } from './book.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookController } from './book.controller';
import { StripeService } from '../stripe.service';
import { BrevoService } from '../../brevo.service';
import { SaleModule } from '../sale/sale.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), forwardRef(() => SaleModule)],
  controllers: [BookController],
  providers: [BookService, StripeService, BrevoService],
  exports: [BookService],
})
export class BookModule {}
