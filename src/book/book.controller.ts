import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  InternalServerErrorException,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { BookService } from './book.service';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import Stripe from 'stripe';
import { StripeService } from '../stripe.service';
import { ConfigService } from '@nestjs/config';
import { BuyBookDto } from './dto/buy-book.dto';
import {
  deleteImageReference,
  deletePdfReference,
  uploadPdfFirebase,
  uploadPhotoFirebase,
  uploadVideoFirebase,
} from '../shared/firebase-fun';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SaleService } from '../sale/sale.service';
@Controller('book')
export class BookController {
  constructor(
    private bookService: BookService,
    private stripeService: StripeService,
    private configService: ConfigService,
    private saleService: SaleService,
  ) {}

  @Get()
  async getBooks(): Promise<Book[]> {
    const books = await this.bookService.getAll();
    return books;
  }

  @Get('/:id')
  async getBook(@Param('id') bookId: string): Promise<Book> {
    const book = await this.bookService.getById(parseInt(bookId));
    return book;
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
      { name: 'videos', maxCount: 5 },
    ]),
  )
  async create(
    @Body() body: CreateBookDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
      videos?: Express.Multer.File[];
    },
  ): Promise<Book> {
    console.log('createDto:', body);
    if (files.pdf[0]) {
      const pdfFileUrl = await uploadPdfFirebase(files.pdf[0]);
      body.pdfUrl = pdfFileUrl;
    }
    if (files.image[0]) {
      const imageUrl = await uploadPhotoFirebase(files.image[0]);
      body.imageUrl = imageUrl;
    }

    if (files.videos) {
      const videosUrls: string[] = [];
      for (let i = 0; i < files.videos.length; i++) {
        const videoUrl = await uploadVideoFirebase(files.videos[i]);
        videosUrls.push(videoUrl);
      }
      body.videoUrls = videosUrls; // Asegúrate de que CreateBookDto tenga una propiedad `videoUrls`
    }

    const stripeProduct = await this.bookService.createStripeProduct(body);
    const stripePrice = await this.bookService.createStripePrice(
      body,
      stripeProduct.id,
    );
    const book = await this.bookService.create(body, stripePrice.id);

    return book;
  }

  @Post('/stripe/webhook')
  async handlePaymentStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    let event: Stripe.Event;
    const stripeSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    try {
      event = this.stripeService.constructEvent(req.rawBody, sig, stripeSecret);
    } catch (err) {
      console.error('Stripe webhook error:', err.message);
      throw new ForbiddenException('Invalid signature');
    }

    const eventType = event.type;
    const session: Stripe.Checkout.Session = event.data
      .object as Stripe.Checkout.Session;

    if (eventType === 'checkout.session.completed') {
      console.log('Payment was successful ' + session.customer_details.email);
      console.log(session.metadata);

      try {
        const bookId = parseInt(session.metadata.bookId);
        const book = await this.bookService.getById(bookId);
        if (!book) {
          throw new Error('Book not found');
        }

        // Crear la venta
        const sale = await this.saleService.create({
          total_price: parseInt(book.price),
          bookId: bookId,
        });

        // Enviar correo electrónico de confirmación
        await this.bookService.sendPaymentSuccessEmail(
          session.customer_details.email,
          bookId,
          sale.saleId,
        );
      } catch (error) {
        console.error('Error processing payment:', error.message);
        throw new InternalServerErrorException('Error processing payment');
      }
    }
  }

  @Post('buy')
  async buyBook(@Body() body: BuyBookDto): Promise<Stripe.Checkout.Session> {
    console.log(`Buying book: ${JSON.stringify(body)} `);

    const buyBook = await this.stripeService.createCheckoutSession(body);
    return buyBook;
  }

  @Delete('/:id')
  async deleteBook(@Param('id') bookId: string): Promise<Book> {
    const book = await this.bookService.delete(parseInt(bookId));
    if (book.imageUrl) {
      deleteImageReference(book.imageUrl);
    }
    if (book.pdfUrl) {
      deletePdfReference(book.pdfUrl);
    }
    return book;
  }

  @Get('session/:session_id')
  async retrieveSession(@Param('session_id') sessionId: string) {
    try {
      const session = await this.stripeService.retrieveSession(sessionId);
      const bookId = session.metadata.bookId;
      return { bookId };
    } catch (error) {
      return { error: 'Unable to retrieve session' };
    }
  }
}
