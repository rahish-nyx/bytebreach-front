# ByteBreach Frontend

This folder contains the Next.js App Router application:

- `app/` - pages and routes
- `components/` - reusable UI components
- `hooks/` - realtime and profile hooks
- `lib/` - Firebase client configuration and helpers
- `src/` - shared React context
- `services/` - mobile/Capacitor service wrappers

Run it from the project root with:

```bash
npm run dev
```

## Telegram daily-challenge notifications

The server route at `/api/telegram/notify` forwards each authenticated daily-challenge submission to Telegram. Add these server-only values to `frontend/.env.local`:

```env
TELEGRAM_BOT_TOKEN=replace-with-a-new-token-from-BotFather
TELEGRAM_CHAT_ID=replace-with-your-admin-chat-id
```

Never use `NEXT_PUBLIC_` for the bot token. Rotate any token that has been shared publicly before using this integration.
