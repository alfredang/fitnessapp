import { BookingStatus, ClassStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest, conflict, notFound } from '../lib/http.js';
import { getSettings } from '../lib/settings.js';

/**
 * Agentic flow #1 — auto-close at max pax.
 *
 * Creates a booking inside a transaction that:
 *  - rejects if the class is not OPEN or already full (race-safe),
 *  - re-counts active bookings after insert, and
 *  - flips the class to CLOSED the moment capacity is reached.
 */
export async function createBooking(userId: string, classSessionId: string) {
  const { autoCloseEnabled } = await getSettings();
  return prisma.$transaction(async (tx) => {
    const session = await tx.classSession.findUnique({
      where: { id: classSessionId },
    });
    if (!session) throw notFound('Class not found');
    if (session.status !== ClassStatus.OPEN) {
      throw conflict('This class is closed for booking');
    }

    const activeCount = await tx.booking.count({
      where: { classSessionId, status: BookingStatus.BOOKED },
    });
    if (activeCount >= session.capacity) {
      // Capacity is a hard limit regardless of the auto-close toggle.
      // Only flip the status to CLOSED when the automation is enabled.
      if (autoCloseEnabled) {
        await tx.classSession.update({
          where: { id: classSessionId },
          data: { status: ClassStatus.CLOSED },
        });
      }
      throw conflict('This class is full');
    }

    let booking;
    try {
      booking = await tx.booking.create({
        data: { userId, classSessionId, status: BookingStatus.BOOKED },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        // Existing CANCELLED booking — reactivate it instead.
        booking = await tx.booking.update({
          where: { userId_classSessionId: { userId, classSessionId } },
          data: { status: BookingStatus.BOOKED },
        });
      } else {
        throw e;
      }
    }

    const newCount = await tx.booking.count({
      where: { classSessionId, status: BookingStatus.BOOKED },
    });
    // Agentic auto-close — only when the admin has the automation enabled.
    let autoClosed = false;
    if (autoCloseEnabled && newCount >= session.capacity) {
      await tx.classSession.update({
        where: { id: classSessionId },
        data: { status: ClassStatus.CLOSED },
      });
      autoClosed = true;
    }

    return { booking, autoClosed, spotsLeft: session.capacity - newCount };
  });
}

/**
 * Cancels a member's booking. If the class had auto-closed purely because it was
 * full (not cancelled by an admin), free up the spot by reopening it.
 */
export async function cancelBooking(userId: string, classSessionId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { userId_classSessionId: { userId, classSessionId } },
    });
    if (!booking || booking.status === BookingStatus.CANCELLED) {
      throw notFound('Booking not found');
    }
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
    });

    const session = await tx.classSession.findUnique({
      where: { id: classSessionId },
    });
    if (session && session.status === ClassStatus.CLOSED) {
      const activeCount = await tx.booking.count({
        where: { classSessionId, status: BookingStatus.BOOKED },
      });
      if (activeCount < session.capacity) {
        await tx.classSession.update({
          where: { id: classSessionId },
          data: { status: ClassStatus.OPEN },
        });
      }
    }
    return { ok: true };
  });
}

// Admin manual close / reopen — uses the same status field as auto-close.
export async function setClassStatus(classSessionId: string, status: ClassStatus) {
  const session = await prisma.classSession.findUnique({
    where: { id: classSessionId },
  });
  if (!session) throw notFound('Class not found');
  if (status === ClassStatus.OPEN) {
    const activeCount = await prisma.booking.count({
      where: { classSessionId, status: BookingStatus.BOOKED },
    });
    if (activeCount >= session.capacity) {
      throw badRequest('Cannot reopen — class is already at capacity');
    }
  }
  return prisma.classSession.update({
    where: { id: classSessionId },
    data: { status },
  });
}
