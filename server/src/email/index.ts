import { Resend } from 'resend';
import { env } from '../lib/env.js';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

// Sends via Resend when configured, otherwise logs to the console (dev fallback).
export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  if (!resend) {
    console.log('📧 [email mock] →', to, '|', subject);
    console.log(html.replace(/<[^>]+>/g, '').trim().slice(0, 300));
    return;
  }
  try {
    await resend.emails.send({ from: env.emailFrom, to, subject, html });
    console.log('📧 sent →', to, '|', subject);
  } catch (err) {
    console.error('📧 send failed →', to, err);
  }
}

export function classReminderEmail(opts: {
  memberName: string;
  classTitle: string;
  startsAt: Date;
  trainer: string;
  branch: string;
}): { subject: string; html: string } {
  const when = opts.startsAt.toLocaleString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return {
    subject: `Reminder: ${opts.classTitle} is coming up`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#ea580c">See you soon, ${opts.memberName}! 💪</h2>
        <p>This is a friendly reminder for your upcoming class:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 0;color:#64748b">Class</td><td><strong>${opts.classTitle}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#64748b">When</td><td>${when}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Trainer</td><td>${opts.trainer}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Branch</td><td>${opts.branch}</td></tr>
        </table>
        <p style="margin-top:16px">Arrive 10 minutes early to warm up. See you there!</p>
        <p style="color:#94a3b8;font-size:12px">— The PulseFit Team</p>
      </div>`,
  };
}
