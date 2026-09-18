# CRAVIX
CRAVIX is a modern food ordering and restaurant discovery platform built with React, Vite, TanStack Router, and a Node/Express API layer. It supports browsing dishes, saving favorites, leaving reviews, managing cart flows, and checking out through a data-backed application experience.

## Features
- Browse restaurant and meal listings
- Search and filter food options
- Save favorite dishes
- View and submit reviews and ratings
- Cart and checkout flow
- Admin-style dashboard and order views
- MySQL-backed data access for app content and transactions
- Supabase-ready auth and integration layer

## Tech stack
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Routing: TanStack Router
- API: Express.js
- Database: MySQL
- Auth/data integration: Supabase
- UI primitives: Radix + custom component library

## Prerequisites
Before running the app, make sure you have:
- Node.js 18 or newer
- npm
- MySQL installed and running locally
- Access to the project dependencies via npm install

## Quick start
1. Install dependencies:
```bash
npm install
```

2. Set up the MySQL database and seed data:
```bash
npm run mysql:setup
```

3. Start the full app (frontend + backend):
```bash
npm run dev:mysql
```

4. Open the app in your browser:
```text
http://localhost:8080/
```

## Available scripts
```bash
npm run dev
npm run dev:mysql
npm run mysql:setup
npm run mysql:verify
npm run mysql:api
npm run build
npm run preview
npm run lint
npm run format
```

## Understanding the app startup
- `npm run dev` starts only the Vite frontend.
- `npm run dev:mysql` starts both the backend API and the web app together.
- `npm run mysql:setup` initializes the MySQL schema and seed data.
- `npm run mysql:verify` checks the database connectivity and table state.
- `npm run mysql:api` runs just the Express API service.

## Project structure
CRAVIX/
├── src/                  # Frontend application
├── server/               # Express server and API logic
├── scripts/              # MySQL setup and verification utilities
├── mysql/                # Schema and seed SQL scripts
├── supabase/             # Supabase configs and migrations
├── public/               # Static assets (if present)
├── package.json          # Project scripts and dependencies
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── components.json       # UI component config
├── wrangler.jsonc        # Cloudflare/Wrangler config
└── README.md             # Project documentation



## Notes
- The backend routes are proxied under `/api/*`, so the API needs to be active for data-driven features to work correctly.
- This project is designed for local development and can be extended with deployment configuration for production hosting.

## Typical user flow
1. User opens the app and browses meals or restaurant options.
2. They add dishes to their cart and continue to checkout.
3. The app queries the configured backend and database layer for live data.
4. Reviews, favorites, and order-related actions are stored through the API layer.

## Deployment notes
For production deployment, you would typically:

- configure environment variables for database and auth providers
- deploy the Express API to a server or platform with access to MySQL
- build the frontend with `npm run build`
- serve the production build via a static hosting provider or a Node-compatible deployment target
- secure API keys and database credentials using environment management tools

Example production build command:
```bash
npm run build
```

## License

This project is currently unlicensed unless otherwise specified by the repository owner.
