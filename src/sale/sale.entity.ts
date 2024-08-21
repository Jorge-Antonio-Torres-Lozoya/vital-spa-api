import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Book } from '../book/book.entity';

@Entity()
export class Sale {
  @PrimaryGeneratedColumn()
  saleId: number;

  @CreateDateColumn()
  sale_date: Date;

  @Column()
  total_price: number;

  @ManyToOne(() => Book, (book) => book.sales, {
    onDelete: 'CASCADE',
  })
  book: Book;
}
