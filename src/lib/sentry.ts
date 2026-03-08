import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://7143c9f5bd21669d87fbca174f6a47b6@o4511008768196608.ingest.de.sentry.io/4511008789299280",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
});

export { Sentry };
