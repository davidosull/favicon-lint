# FaviconLint

Free tool to check if your favicon is set up correctly for all browsers and platforms.

## Features

- Comprehensive favicon analysis
- Checks for all major icon types (favicon.ico, PNG, SVG, Apple Touch Icon)
- Web manifest validation
- Score-based recommendations
- Email monitoring alerts

## Tech Stack

- Next.js 16
- Supabase (PostgreSQL)
- AWS SES (email)
- Tailwind CSS

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SES_ACCESS_KEY_ID` - AWS credentials for SES
- `SES_SECRET_ACCESS_KEY` - AWS credentials for SES
- `SES_REGION` - AWS SES region
- `HASH_SALT` - Salt for hashing emails/IPs
- `CRON_SECRET` - Secret for cron endpoints

## License

MIT
