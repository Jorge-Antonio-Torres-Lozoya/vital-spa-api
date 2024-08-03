import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
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
} from '../shared/firebase-fun';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
@Controller('book')
export class BookController {
  constructor(
    private bookService: BookService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  @Get()
  async getBooks(): Promise<Book[]> {
    const books = await this.bookService.getAll();
    return books;
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'pdf', maxCount: 1 },
      ,
    ]),
  )
  async create(
    @Body() body: CreateBookDto,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
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

    // const buyBookId = session.metadata.buyBookId;
    if (eventType === 'checkout.session.completed') {
      console.log('Payment was successful ' + session.customer_details.email);
      console.log(session.metadata);

      // Payment is successful
      // Enviar correo electrónico usando el servicio de BookService
      await this.bookService.sendPaymentSuccessEmail(
        session.customer_details.email,
        session.metadata.bookId,
      );
      // await this.buyBookService.buySuccessful(accountId, buyCoinsId);
    }
    // Add more event types as needed
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
}
