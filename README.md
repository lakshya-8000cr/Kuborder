# KUBORDER

A full-stack food ordering business app with:

- Next.js frontend (modern custom UI)
- Node.js + Express backend
- SQLite persistence for menu and order history

## Features

- Fetch and browse food menu
- Category filter and search
- Cart with quantity controls
- Checkout flow with customer details
- Order placement API
- Persistent order history timeline

## Project Structure

- `client` -> Next.js app
- `server` -> Express API + SQLite DB

## Run Locally

1. Install root workspace dependencies:

```bash
npm install
```

2. Start both frontend and backend:

```bash
npm run dev
```

3. Open app:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000/api/health

## API Endpoints

- `GET /api/health`
- `GET /api/foods`
- `GET /api/foods/:id`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`

## Data Storage

SQLite database file is created automatically at:

- `server/data/kuborder.db`

## Notes

- Free delivery for orders >= 500 INR.
- If frontend needs another backend URL, set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

inside `client/.env.local`.
