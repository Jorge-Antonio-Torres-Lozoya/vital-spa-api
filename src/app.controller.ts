import { Controller, Get } from '@nestjs/common';
import { StripeKeyInterface } from './stripe-key-interface';
import { ConfigService } from '@nestjs/config';
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get('stripe')
  getStripe(): StripeKeyInterface {
    const stripeKey: StripeKeyInterface = {
      stripeKey: this.configService.get<string>('STRIPE_KEY'),
    };
    return stripeKey;
  }
}
