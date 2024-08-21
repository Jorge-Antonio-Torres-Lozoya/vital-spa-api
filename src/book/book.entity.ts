import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Sale } from '../sale/sale.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  bookId: number;

  @Column()
  title: string;

  @Column()
  price: string;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  videoUrls: string[];

  @Column()
  stripePriceId: string;

  @OneToMany(() => Sale, (sale) => sale.book, {
    cascade: true,
    onDelete: 'SET NULL',
  })
  sales: Sale[];
}
