import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { BuyBookDto } from './book/dto/buy-book.dto';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(buyBookDto: BuyBookDto) {
    const stripeSession = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Métodos de pago aceptados
      line_items: [
        {
          price: buyBookDto.stripePriceId,
          quantity: 1,
        },
      ], // Productos que se van a comprar
      mode: 'payment', // Modo de la sesión (pago en este caso)
      success_url: `http://localhost:4200/compra-exitosa?session_id={CHECKOUT_SESSION_ID}`, // URL de éxito
      cancel_url: `http://localhost:4200/error-compra`, // URL de cancelación
      metadata: {
        bookId: buyBookDto.bookId, // ID del libro
        title: buyBookDto.title, // Título del libro
      },
    });

    return stripeSession; // Devuelve la sesión de Stripe
  }

  constructEvent(
    payload: any,
    signature: string,
    secret: string,
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      // If the signature verification failed, throw an error.
      throw new Error(
        'Failed to validate incoming Stripe webhook: ' + err.message,
      );
    }
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return await this.stripe.checkout.sessions.retrieve(sessionId);
  }
}
