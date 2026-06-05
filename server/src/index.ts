import { createApp } from './app.js';
import { env } from './lib/env.js';
import { startReminderScheduler } from './automation/reminders.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`🚀 PulseFit API on ${env.serverUrl} (port ${env.port})`);
  startReminderScheduler();
});
