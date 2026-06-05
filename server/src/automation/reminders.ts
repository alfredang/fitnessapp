import cron from 'node-cron';
import { BookingStatus, ClassStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { classReminderEmail, sendEmail } from '../email/index.js';
import { getSettings } from '../lib/settings.js';

/**
 * Agentic flow #2 — upcoming-class reminders.
 *
 * Finds OPEN/CLOSED sessions starting within the next 24h that have active
 * bookings, and emails each booked member once (idempotent via ReminderLog).
 * Returns the number of reminders sent — also callable on demand from a dev route.
 */
export async function runReminderSweep(): Promise<number> {
  const { remindersEnabled } = await getSettings();
  if (!remindersEnabled) {
    console.log('⏰ reminder sweep skipped (automation disabled)');
    return 0;
  }
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const sessions = await prisma.classSession.findMany({
    where: {
      startsAt: { gte: now, lte: in24h },
      status: { not: ClassStatus.CANCELLED },
    },
    include: {
      bookings: {
        where: { status: BookingStatus.BOOKED },
        include: { user: true },
      },
    },
  });

  let sent = 0;
  for (const session of sessions) {
    for (const booking of session.bookings) {
      const already = await prisma.reminderLog.findUnique({
        where: {
          classSessionId_userId: {
            classSessionId: session.id,
            userId: booking.userId,
          },
        },
      });
      if (already) continue;

      const { subject, html } = classReminderEmail({
        memberName: booking.user.name,
        classTitle: session.title,
        startsAt: session.startsAt,
        trainer: session.trainer,
        branch: session.branch,
      });
      await sendEmail({ to: booking.user.email, subject, html });
      await prisma.reminderLog.create({
        data: { classSessionId: session.id, userId: booking.userId },
      });
      sent++;
    }
  }
  if (sent > 0) console.log(`⏰ reminder sweep sent ${sent} email(s)`);
  return sent;
}

// Schedule the sweep to run hourly.
export function startReminderScheduler(): void {
  cron.schedule('0 * * * *', () => {
    runReminderSweep().catch((e) => console.error('reminder sweep failed', e));
  });
  console.log('⏰ reminder scheduler started (hourly)');
}
