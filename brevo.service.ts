import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';

@Injectable()
export class BrevoService {
  constructor(private configService: ConfigService) {}

  async sendMail(data: {
    mailData: any;
    subject: string;
    params: any;
    receivers: { email: string }[];
    htmlContent: string;
  }): Promise<boolean> {
    try {
      const apiKey = this.configService.get('BREVO_KEY');

      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(0, apiKey);

      const { subject, params, receivers, mailData, htmlContent } = data;

      await apiInstance.sendTransacEmail({
        sender: mailData.sender,
        to: receivers,
        subject: subject,
        htmlContent: htmlContent,
        params: {
          ...params,
        },
        attachment:
          mailData.attachments && mailData.attachments.length > 0
            ? mailData.attachments
            : null!,
      });

      return true;
    } catch (error) {
      console.log('ERROR SENDING EMAIL: ', error);
      return false;
    }
  }
}
