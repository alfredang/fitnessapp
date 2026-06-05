import { prisma } from './prisma.js';

export interface AppSettings {
  autoCloseEnabled: boolean; // agentic flow: close a class when it hits capacity
  remindersEnabled: boolean; // agentic flow: email reminders for upcoming classes
}

const DEFAULTS: AppSettings = {
  autoCloseEnabled: true,
  remindersEnabled: true,
};

const KEY = 'settings';

export async function getSettings(): Promise<AppSettings> {
  const row = await prisma.siteContent.findUnique({ where: { key: KEY } });
  if (!row) return DEFAULTS;
  return { ...DEFAULTS, ...(row.jsonValue as Partial<AppSettings>) };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await prisma.siteContent.upsert({
    where: { key: KEY },
    update: { jsonValue: next },
    create: { key: KEY, jsonValue: next },
  });
  return next;
}
