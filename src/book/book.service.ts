import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getById(bookId: number): Promise<Book> {
    const book = await this.repo.findOne({
      where: { bookId },
    });
    if (!book) {
      throw new NotFoundException('El libro no fue encontrado.');
    }
    return book;
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
      videoUrls: createDto.videoUrls,
    });
    console.log(book);

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

  async sendPaymentSuccessEmail(
    email: string,
    bookId: number,
    saleId: number,
  ): Promise<void> {
    const foundBook = await this.repo.findOne({ where: { bookId: bookId } });
    if (!foundBook) {
      throw new Error('Book not found');
    }

    const htmlContent = `
      <html>
        <body class="body" style="margin: 0 !important; padding: 0 !important; background-color: #ffffff;" bgcolor="#ffffff">
    <div role="article" aria-roledescription="email" aria-label="Email from Your Company" xml:lang="en" lang="en">
      <!--hidden preheader with pre-header spacer hack-->
      <div class="litmus-builder-preview-text" style="display:none;">
        &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
        <tr>
          <td align="center">
            <table class="w100p" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;">
              <tr>
                <td align="center" valign="top" style="font-size:0; padding: 35px; background-color: #EDE9E6;">
                  <table class="w100p" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;">
                    <tr>
                      <td align="left" valign="middle" class="mobile-center">
                        <img class="dark-img" src="https://firebasestorage.googleapis.com/v0/b/vital-spa-81afc.appspot.com/o/assets%2Flogo-vital.jpg?alt=media&token=73f01dbf-37a7-4dc8-a50b-5fa2cd2cd415" width="80" height="80" alt="wonderblum" style="color: #4a4a4a; text-align:center; font-weight:bold; font-size:24px; line-height:28px; text-decoration: none; padding: 0;" border="0" />
                      </td>
                      <td class="mobile-hide" align="right" valign="middle">
                        <table cellspacing="0" cellpadding="0" border="0" role="presentation">
                          <tr>
                            <td valign="middle">
                              <p style="font-size: 18px; line-height: 20px; font-weight: 400; margin: 0; color: #000000;"><a href="http://litmus.com" target="_blank" style="color: #000000; text-decoration: none;">Tienda</a> &nbsp;</p>
                            </td>
                            <td valign="middle">
                              <a href="http://litmus.com" target="_blank" style="color: #ffffff; text-decoration: none;"><img src="https://firebasestorage.googleapis.com/v0/b/vital-spa-81afc.appspot.com/o/assets%2Fcart.webp?alt=media&token=96039a40-b538-40cc-9d75-d4e9cc512a37" width="27" height="23" style="display: block; border: 0px;" /></a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 35px 35px 20px 35px;">
                  <table class="w100p" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;">
                    <tr>
                      <td align="center" style="padding-top: 25px;">
                        <img src="https://firebasestorage.googleapis.com/v0/b/vital-spa-81afc.appspot.com/o/assets%2Fcheck-order.png?alt=media&token=50a08978-6a81-4ac6-a0c0-54c96367bd21" width="125" height="120" style="display: block; border: 0px;" /><br>
                        <h2 style="font-size: 30px; font-weight: normal; line-height: 36px; color: #028383; margin: 0;">
                        Gracias por su compra!
                        </h2>
                      </td>
                    </tr>
                    <tr>
                      <td align="left" style="padding: 30px 0;">
                        <p style="color: #777777;">
                        Apreciamos su compra y esperamos que disfrute de su libro. A continuación, encontrará los detalles de su pedido.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="left">
                        <table cellspacing="0" cellpadding="0" border="0" width="100%" role="presentation">
                        <tr>
                            <td width="75%" align="left" style="background-color: #d7f1ff; padding: 10px;">
                              <p style="font-weight: 800;">Confirmación de order No.</p>
                            </td>
                            <td width=" 25%" align="left" style="background-color: #d7f1ff; padding: 10px;">
                              <p class="blueLinks" style="font-weight: 800;">#${saleId}</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="75%" align="left" style="padding: 15px 10px 10px;">
                              <p>${foundBook.title}</p>
                            </td>
                            <td width="25%" align="left" style="padding: 15px 10px 10px;">
                              <p>$${foundBook.price}</p>
                            </td>
                          </tr>
                          
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="left" style="padding-top: 20px;">
                        <table cellspacing="0" cellpadding="0" border="0" width="100%" role="presentation">
                          <tr>
                            <td width="75%" align="left" style="padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                              <p style="font-weight: 800;">TOTAL</p>
                            </td>
                            <td width="25%" align="left" style="padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                              <p style="font-weight: 800;">$${foundBook.price}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!--footer-->
              <tr>
                <td class="footer" align="center" valign="top" style="padding:50px 0; background-color: #eeeeee;">
                <p><strong>Información de contacto</strong></p>
                <p>
                <strong>Vital colima</strong> <br>
                <strong>Aquiles Serdán #399
                Col. Magisterial
                Colima, México.</strong><br>
                <strong>contacto@vitalcolima.com</strong><br>
                <strong>312 688 5278</strong>
                </p>
                  <p style="font-size:13px;line-height:24px;mso-line-height-rule:exactly;margin-bottom:20px; margin-left:20px; margin-right:20px; margin-top:20px;">Este correo electrónico está destinado únicamente al destinatario. Si recibió este correo electrónico por error, notifíquenoslo inmediatamente y elimínelo de su sistema. Este correo electrónico y cualquier archivo adjunto pueden contener información confidencial.<br><br>
                  </p>
                  <p>&copy; Copyright 2024 | Todos los derechos reservados. Vital Colima.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>


      </table>
    </div>
  </body>
      </html>
    `;

    // Procesa el PDF
    const pdfUrl = foundBook.pdfUrl;
    let pdfAttachment = null;
    if (pdfUrl) {
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const pdfData = Buffer.from(response.data).toString('base64');
      pdfAttachment = {
        content: pdfData,
        filename: `libro-${foundBook.bookId}.pdf`, // Ajusta el nombre según
        name: `libro-${foundBook.bookId}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
        contentId: 'pdfAttachment',
      };
    }

    // Procesa los videos
    const videoAttachments = [];

    if (foundBook.videoUrls && foundBook.videoUrls.length > 0) {
      for (const videoUrl of foundBook.videoUrls) {
        try {
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
          });
          const videoData = Buffer.from(videoResponse.data).toString('base64');
          videoAttachments.push({
            content: videoData,
            filename: `video-${foundBook.videoUrls.indexOf(videoUrl)}.mp4`, // Ajusta el nombre según sea necesario
            name: `video-${foundBook.videoUrls.indexOf(videoUrl)}.mp4`,
            type: 'video/mp4',
            disposition: 'attachment',
            contentId: `videoAttachment-${foundBook.videoUrls.indexOf(videoUrl)}`,
          });
        } catch (error) {
          // console.error(`Failed to process video at ${videoUrl}:`, error);
        }
      }
    }

    const mailData = {
      mailData: {
        sender: {
          email: 'contacto@vitalcolima.com',
          name: 'Estetica y Faciales Colima',
        },
        attachments: [
          ...(pdfAttachment ? [pdfAttachment] : []),
          ...videoAttachments,
        ],
      },
      subject: 'Pago exitoso',
      params: { bookId },
      receivers: [{ email }],
      htmlContent,
    };

    // Envía el correo
    try {
      const emailSent = await this.brevoService.sendMail(mailData);
      if (emailSent) {
        console.log('Email sent successfully');
      } else {
        console.error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
