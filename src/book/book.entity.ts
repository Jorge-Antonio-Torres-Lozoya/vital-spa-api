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

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  // videoUrls: string[]; Usar en produccion
  videoUrls: string[];

  @Column()
  stripePriceId: string;
}
