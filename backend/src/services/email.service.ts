import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from '../config/pino.js'

class EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn({ event: 'email_not_configured' }, 'SMTP credentials not set. Email features will be disabled.')
      return
    }
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  }

  async send(options: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.transporter) {
      logger.warn({ event: 'email_skipped', to: options.to }, 'Email not configured. Skipping.')
      return
    }
    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER,
        ...options,
      })
      logger.info({ event: 'email_sent', to: options.to })
    } catch (error) {
      logger.error({ event: 'email_failed', to: options.to, error })
    }
  }
}

const emailService = new EmailService()

function buildEmailLayout(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:Manrope,Arial,sans-serif;background:#f3f3f4;">
      <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #dbdce0;">
          ${content}
          <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e6e7ea;font-size:12px;color:#838895;text-align:center;">
            FUOYE Ballon D'Or Awards — The Golden Verdict
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export function voteReceivedEmail(voterEmail: string, voterName: string, nomineeName: string, category: string, quantity: number, amount: number, reference: string) {
  return emailService.send({
    to: voterEmail,
    subject: `Your vote is in, ${voterName}!`,
    html: buildEmailLayout(`
      <h2 style="color:#07122b;font-size:24px;margin:0 0 16px;">Your vote is confirmed</h2>
      <p style="color:#838895;font-size:16px;line-height:1.6;">Hi ${voterName},</p>
      <p style="color:#838895;font-size:16px;line-height:1.6;">Your votes for <strong style="color:#07122b;">${nomineeName}</strong> in <strong style="color:#07122b;">${category}</strong> have been counted.</p>
      <div style="background:#f3f3f4;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;color:#07122b;font-size:14px;"><strong>Votes:</strong> ${quantity}</p>
        <p style="margin:4px 0;color:#07122b;font-size:14px;"><strong>Amount:</strong> ₦${amount.toLocaleString()}</p>
        <p style="margin:4px 0;color:#07122b;font-size:14px;"><strong>Reference:</strong> ${reference}</p>
      </div>
      <p style="color:#838895;font-size:16px;line-height:1.6;">Thank you for supporting FUOYE football.</p>
    `),
  })
}

export function sendDisputeAlert(adminEmail: string, details: { voteId: string; txRef: string; amount: number; nomineeId: string; voterName: string }) {
  return emailService.send({
    to: adminEmail,
    subject: `Chargeback — ${details.txRef}`,
    html: buildEmailLayout(`
      <h2 style="color:#f0457d;font-size:24px;margin:0 0 16px;">Chargeback Alert</h2>
      <p style="color:#838895;font-size:16px;line-height:1.6;">A payment dispute has been raised for the following vote:</p>
      <div style="background:#f3f3f4;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;color:#07122b;font-size:14px;"><strong>Vote ID:</strong> ${details.voteId}</p>
        <p style="margin:4px 0;color:#07122b;font-size:14px;"><strong>Reference:</strong> ${details.txRef}</p>
        <p style="margin:4px 0;color:#07122b;font-size:14px;"><strong>Amount:</strong> ₦${details.amount.toLocaleString()}</p>
        <p style="margin:4px 0;color:#07122b;font-size:14px;"><strong>Voter:</strong> ${details.voterName}</p>
      </div>
      <p style="color:#838895;font-size:16px;line-height:1.6;">The votes have been automatically reversed. Check Flutterwave dashboard for details.</p>
    `),
  })
}