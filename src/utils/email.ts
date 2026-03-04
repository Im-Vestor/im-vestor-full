import { Resend } from 'resend';
import { EmailTemplate } from '~/components/email/template';

const resend = new Resend(process.env.RESEND_API_KEY);
export async function sendEmail(
  name: string,
  firstText: string,
  secondText: string,
  to: Array<string>,
  subject: string,
  link?: string,
  buttonText?: string,
  attachments?: Array<{ filename: string; content: Buffer; content_type?: string }>
) {
  const { data, error } = await resend.emails.send({
    from: 'Im-Vestor <hey@updates.im-vestor.com>',
    to: to.filter(email => email && email.trim() !== ''),
    subject: subject,
    react: EmailTemplate({ name, firstText, secondText, link, buttonText }),
    attachments,
  });

  if (error) {
    console.error(error);
    return false;
  }

  return data;
}
