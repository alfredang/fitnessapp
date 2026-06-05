import { format, isToday, isTomorrow } from 'date-fns';

export function formatClassTime(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  let day: string;
  if (isToday(start)) day = 'Today';
  else if (isTomorrow(start)) day = 'Tomorrow';
  else day = format(start, 'EEE, MMM d');
  return `${day} · ${format(start, 'h:mm a')}–${format(end, 'h:mm a')}`;
}

export function formatDate(d: string): string {
  return format(new Date(d), 'MMM d, yyyy');
}

export function money(n: number): string {
  return n === 0 ? 'Free' : `$${n}`;
}
