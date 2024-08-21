import { Injectable } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './sale.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookService } from '../book/book.service';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale) private repo: Repository<Sale>,
    private bookService: BookService,
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    const book = await this.bookService.getById(createSaleDto.bookId);
    const sale = this.repo.create({
      ...createSaleDto,
      book,
    });
    await this.repo.save(sale);
    return sale;
  }

  findAll() {
    return `This action returns all sale`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sale`;
  }

  remove(id: number) {
    return `This action removes a #${id} sale`;
  }
}
