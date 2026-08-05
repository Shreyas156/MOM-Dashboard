import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, cc, bcc, subject, htmlText, plainText, smtpUser, smtpPass, smtpHost, smtpPort } = body;

    if (!to || !subject || !htmlText) {
      return NextResponse.json(
        { success: false, error: 'Missing required email fields (to, subject, htmlText)' },
        { status: 400 }
      );
    }

    // Determine SMTP configuration (Environment variables or request settings)
    const host = smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(smtpPort || process.env.SMTP_PORT || 465);
    const user = smtpUser || process.env.SMTP_USER;
    const pass = smtpPass || process.env.SMTP_PASS;

    if (!user || !pass) {
      return NextResponse.json(
        {
          success: false,
          error:
            'SMTP credentials not configured. Please enter your Sender Email & Gmail App Password in the settings panel below, or use the "Open in Gmail Compose" / "Copy Rich HTML" buttons.',
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"${user}" <${user}>`,
      to: to.split(',').map((s: string) => s.trim()),
      cc: cc ? cc.split(',').map((s: string) => s.trim()) : undefined,
      bcc: bcc ? bcc.split(',').map((s: string) => s.trim()) : undefined,
      subject,
      text: plainText,
      html: htmlText,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: `Email successfully sent to ${to}!`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
