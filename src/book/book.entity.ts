import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column()
  stripePriceId: string;
}
