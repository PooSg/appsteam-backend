# Appsteam — Backend

Node.js + Express + MySQL REST API for Appsteam.

## Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | Public | Create account |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/games | Public | List all games |
| GET | /api/games/:id | Public | Single game |
| POST | /api/games | Admin | Add game |
| PUT | /api/games/:id | Admin | Edit game |
| DELETE | /api/games/:id | Admin | Delete game |
| GET | /api/cart | Customer | Get cart |
| POST | /api/cart | Customer | Add to cart |
| DELETE | /api/cart/:id | Customer | Remove from cart |
| POST | /api/orders/checkout | Customer | Place order |
| GET | /api/orders | Customer | Order history |
| GET | /api/users/profile | Customer | Get profile |
| PUT | /api/users/profile | Customer | Update profile |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up .env
```bash
copy .env.example .env
```
Edit `.env` and fill in your MySQL password.

### 3. Set up the database
- Open MySQL Workbench
- Run `config/schema.sql`

### 4. Start the server
```bash
npm run dev
```

API runs at `http://localhost:5000`
