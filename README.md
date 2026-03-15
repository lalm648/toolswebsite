This is a Next.js tools website with browser-first utilities for image, text, developer, and SEO workflows.

## Documentation

- Analytics event model: [docs/analytics.md](/Users/lalmuhammad/Documents/toolswebsite/docs/analytics.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying files in `src/app` and `src/components`. The page auto-updates as you edit the project.

## Environment Variables

Create a local env file by copying [.env.example](/Users/lalmuhammad/Documents/toolswebsite/.env.example) to `.env.local`.

```bash
cp .env.example .env.local
```

For Netlify, use the same variable names from `.env.example` in:
`Site configuration` -> `Environment variables`

These public variables are supported by the current app:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_CONTACT_EMAIL=clickproqa@gmail.com
NEXT_PUBLIC_NEWSLETTER_PROVIDER=beehiiv
NEXT_PUBLIC_NEWSLETTER_URL=https://your-newsletter-provider.example/subscribe
NEXT_PUBLIC_NEWSLETTER_METHOD=post
NEXT_PUBLIC_NEWSLETTER_EMAIL_FIELD=email
NEXT_PUBLIC_NEWSLETTER_SOURCE_FIELD=source
NEXT_PUBLIC_NEWSLETTER_TARGET=_blank
NEXT_PUBLIC_NEWSLETTER_HIDDEN_FIELDS='{"publication_id":"pub_123"}'
NEXT_PUBLIC_WAITLIST_PROVIDER=convertkit
NEXT_PUBLIC_WAITLIST_URL=https://your-waitlist-provider.example/join
NEXT_PUBLIC_WAITLIST_METHOD=post
NEXT_PUBLIC_WAITLIST_EMAIL_FIELD=email_address
NEXT_PUBLIC_WAITLIST_SOURCE_FIELD=source
NEXT_PUBLIC_WAITLIST_TARGET=_blank
NEXT_PUBLIC_WAITLIST_HIDDEN_FIELDS='{"form":"waitlist"}'
NEXT_PUBLIC_SHOW_AD_SLOTS=true
NEXT_PUBLIC_SHOW_SPONSORED_BLOCKS=true
NEXT_PUBLIC_SHOW_NEWSLETTER_SIGNUP=true
NEXT_PUBLIC_SHOW_WAITLIST_BLOCK=true
```

If `NEXT_PUBLIC_NEWSLETTER_URL` or `NEXT_PUBLIC_WAITLIST_URL` are not set, the UI falls back to email-based manual handling.
Set any of the `NEXT_PUBLIC_SHOW_*` flags to `true` only when you intentionally want those modules visible.

Provider notes:
- Supported provider presets are `generic`, `beehiiv`, `convertkit`, and `mailchimp`
- You can override provider defaults with `*_EMAIL_FIELD`, `*_SOURCE_FIELD`, and `*_HIDDEN_FIELDS`
- `*_HIDDEN_FIELDS` must be valid JSON for extra embedded-form fields

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
