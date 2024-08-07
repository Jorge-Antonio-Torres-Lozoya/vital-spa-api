import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { BrevoService } from '../../brevo.service';

import axios from 'axios';

@Injectable()
export class BookService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Book) private repo: Repository<Book>,
    private readonly brevoService: BrevoService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async getAll(): Promise<Book[]> {
    const books = await this.repo.find();
    return books;
  }

  async createStripeProduct(createDto: CreateBookDto) {
    try {
      // Asegúrate de que imageUrl esté correctamente definida
      if (!createDto.imageUrl) {
        throw new Error('Image URL is not provided');
      }

      const product = await this.stripe.products.create({
        name: createDto.title,
        images: [createDto.imageUrl],
      });
      console.log('Product created:', product);
      return product;
    } catch (error) {
      console.error('Error creating product in Stripe:', error);
      throw new Error('Error creating product in Stripe');
    }
  }

  async createStripePrice(createDto: CreateBookDto, productId: string) {
    return await this.stripe.prices.create({
      unit_amount: parseInt(createDto.price) * 100,
      currency: 'mxn',
      product: productId,
    });
  }

  async create(createDto: CreateBookDto, stripePriceId: string): Promise<Book> {
    const book = this.repo.create({
      title: createDto.title,
      price: createDto.price,
      imageUrl: createDto.imageUrl,
      stripePriceId,
      pdfUrl: createDto.pdfUrl,
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
      try {
        await this.stripe.products.update(stripePrice.product as string, {
          active: false,
        });
      } catch (error) {
        console.error(
          `Error deactivating product ${stripePrice.product}:`,
          error,
        );
        throw new Error('Error deactivating product from Stripe');
      }
    } catch (error) {
      console.error('Error deactivating product from Stripe:', error);
      throw new Error('Error deactivating product from Stripe');
    }

    // Elimina el libro de la base de datos
    await this.repo.remove(book);

    return book;
  }

  async sendPaymentSuccessEmail(email: string, bookId: number): Promise<void> {
    const htmlContent = `
      <html>
        <body>
          <p>Thank you for your purchase! Your book ID is <b>${bookId}</b>. Prueba</p>
        </body>
      </html>
    `;
    const foundPdf = await this.repo.findOne({ where: { bookId: bookId } });
    if (!foundPdf) {
      throw new Error('PDF not found');
    }
    console.log('foundPdf', foundPdf);
    const pdfUrl = foundPdf.pdfUrl;
    console.log('pdfUrl', pdfUrl);

    const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfData = Buffer.from(response.data).toString('base64');

    const mailData = {
      mailData: {
        sender: {
          email: 'contacto@vitalcolima.com',
          name: 'Estetica y Faciales Colima',
        },
        attachments: [
          {
            content: pdfData,
            filename: 'your-book.pdf',
            name: 'your-book.pdf',
            type: 'application/pdf',
            disposition: 'attachment',
            contendId: 'pdfAttachment',
          },
        ], // Si tienes adjuntos, agrégalos aquí
      },
      subject: 'Payment Successful',
      params: { bookId },
      receivers: [{ email }],
      htmlContent,
    };

    const emailSent = await this.brevoService.sendMail(mailData);

    if (emailSent) {
      console.log('Email sent successfully');
    } else {
      console.error('Failed to send email');
    }
  }
}
