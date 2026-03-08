# 📦 Subscription Box Management System - Backend

A comprehensive NestJS backend API for managing subscription-based product delivery services with recurring billing, inventory tracking, and order fulfillment.

## 🚀 Features

- ✅ **User Authentication** - JWT-based auth with role-based access control
- 💳 **Stripe Integration** - Recurring payments and subscription management
- 📦 **Subscription Plans** - Multiple tiers with flexible billing frequencies
- 🏪 **Inventory Management** - Real-time stock tracking and allocation
- 📋 **Order Processing** - Automated order generation and tracking
- 🚚 **Shipment Management** - Manifest generation and delivery tracking
- 📊 **Admin Dashboard** - Complete management interface
- 🔒 **Security** - Rate limiting, input validation, and SQL injection prevention

## 🛠️ Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Payment**: Stripe API
- **Cloud**: Google Cloud Run
- **Containerization**: Docker
- **API Docs**: Swagger/OpenAPI

## 📁 Project Structure

```
subscription-backend/
├── src/
│   ├── auth/
│   ├── users/
│   ├── subscription-plans/
│   ├── subscriptions/
│   ├── payments/
│   ├── orders/
│   ├── inventory/
│   ├── shipments/
│   ├── coupons/
│   ├── reports/
│   │
│   ├── stripe/                          
│   │   ├── dto/
│   │   ├── webhooks/
│   │   │   └── stripe-webhook.controller.ts
│   │   ├── interfaces/
│   │   ├── stripe.service.ts
│   │   └── stripe.module.ts
│   │
│   ├── google-cloud/                    
│   │   ├── storage/
│   │   │   └── cloud-storage.service.ts
│   │   ├── logging/
│   │   │   └── cloud-logging.service.ts
│   │   ├── pubsub/
│   │   │   └── cloud-pubsub.service.ts
│   │   ├── scheduler/
│   │   └── google-cloud.module.ts
│   │
│   ├── config/
│   │   └── database.config.ts
│   ├── migrations/
│   ├── app.module.ts
│   └── main.ts
│
├── .env
├── .env.production
├── typeorm.config.ts
├── Dockerfile
├── docker-compose.yml
├── app.yaml
├── cloudbuild.yaml
├── package.json
└── README.md
```

## 🚦 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+ (or use Docker)
- Stripe Account

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd subscription-backend-nestjs
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Environment

Copy the template and fill your values:

```bash
cp .env.example .env
```

Required Stripe variables for subscription checkout:

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

Stripe price IDs are now resolved by box name + billing cadence:

- `STRIPE_PRICE_THE_WELLNESS_BOX_WEEKLY`
- `STRIPE_PRICE_THE_WELLNESS_BOX_MONTHLY`
- `STRIPE_PRICE_THE_WELLNESS_BOX_YEARLY`
- `STRIPE_PRICE_ECO_HOME_ESSENTIALS_WEEKLY`
- `STRIPE_PRICE_ECO_HOME_ESSENTIALS_MONTHLY`
- `STRIPE_PRICE_ECO_HOME_ESSENTIALS_YEARLY`
- `STRIPE_PRICE_GAMERS_LOOT_WEEKLY`
- `STRIPE_PRICE_GAMERS_LOOT_MONTHLY`
- `STRIPE_PRICE_GAMERS_LOOT_YEARLY`
- `STRIPE_PRICE_SNACK_STASH_EXPRESS_WEEKLY`
- `STRIPE_PRICE_SNACK_STASH_EXPRESS_MONTHLY`
- `STRIPE_PRICE_SNACK_STASH_EXPRESS_YEARLY`
- `STRIPE_PRICE_GLOW_RITUAL_BOX_WEEKLY`
- `STRIPE_PRICE_GLOW_RITUAL_BOX_MONTHLY`
- `STRIPE_PRICE_GLOW_RITUAL_BOX_YEARLY`
