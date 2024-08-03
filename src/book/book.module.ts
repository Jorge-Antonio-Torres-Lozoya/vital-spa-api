import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { Book } from './book.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookController } from './book.controller';
import { StripeService } from '../stripe.service';
import { BrevoService } from '../../brevo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  controllers: [BookController],
  providers: [BookService, StripeService, BrevoService],
  exports: [BookService],
})
export class BookModule {}
