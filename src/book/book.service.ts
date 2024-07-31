import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';

@Injectable()
export class BookService {
  private stripe: Stripe;

  constructor(@InjectRepository(Book) private repo: Repository<Book>) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async getAll(): Promise<Book[]> {
    const books = await this.repo.find();
    return books;
  }

  async create(createDto: CreateBookDto): Promise<Book> {
    const stripeProduct = await this.stripe.products.create({
      name: createDto.title,
      images: [createDto.imageUrl],
    });

    const stripePrice = await this.stripe.prices.create({
      unit_amount: parseInt(createDto.price) * 100,
      currency: 'mxn',
      product: stripeProduct.id,
    });

    const book = this.repo.create({
      title: createDto.title,
      price: createDto.price,
      imageUrl: createDto.imageUrl,
      stripePriceId: stripePrice.id,
    });

    await this.repo.save(book);
    return book;
  }

  async delete(bookId: number): Promise<Book> {
    const book = await this.repo.findOne({
      where: {
        bookId,
      },
    });
    if (!book) {
      throw new Error('Book not found');
    }
    try {
      const stripePriceId = book.stripePriceId;

      // Recupera el precio de Stripe para obtener el productId
      const stripePrice = await this.stripe.prices.retrieve(stripePriceId);

      // Lista todos los precios asociados al producto
      const prices = await this.stripe.prices.list({
        product: stripePrice.product as string,
      });

      // Desactiva cada precio
      for (const price of prices.data) {
        await this.stripe.prices.update(price.id, { active: false });
      }

      // Desactiva el producto en Stripe
      await this.stripe.products.update(stripePrice.product as string, {
        active: false,
      });
    } catch (error) {
      console.error('Error deactivating product from Stripe:', error);
      throw new Error('Error deactivating product from Stripe');
    }

    // Elimina el libro de la base de datos
    await this.repo.remove(book);

    return book;
  }
}
