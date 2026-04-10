# Subscription Management System

> A comprehensive, modern platform for managing product subscriptions, automated invoicing, secure payment processing, and business analytics.

## 🔗 Live Demo
[https://subscription-management-frontend.vercel.app](https://subscription-management-frontend.vercel.app)

## 💻 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Hook Form |
| **Backend** | Node.js, Express, TypeScript, Prisma *(Reference implementation)* |
| **Database** | PostgreSQL 14+ |
| **Auth** | JSON Web Tokens (JWT) / Bearer Authentication |
| **Deployment** | Vercel (Frontend), Render (Backend) *Recommended* |

## ✨ Features (12 Core Modules)
1. **Authentication**: Secure login, signup, and password reset flows with strong Zod validation.
2. **Roles & RBAC**: Fully protected routing offering tiered access for `admin`, `internal`, and `portal` users.
3. **Products Catalog**: Centralized management for physical/digital product offerings.
4. **Subscription Plans**: Flexible recurring billing definitions (monthly, yearly, tiered).
5. **Subscriptions Lifecycle**: E2E state management (Draft → Activate → Pause → Renew → Cancel).
6. **Invoicing**: Automated invoice calculation including tax, discounts, and line-item breakdowns.
7. **Payment Processing**: Multi-method transaction logging (Cash, Card, Bank, UPI) against outstanding balances.
8. **Discounts Engine**: Configurable flat-rate or percentage-based promotional rules.
9. **Taxes Administration**: Configurable global/local tax rates manageable by active toggle states.
10. **Reports & Analytics**: Comprehensive dashboard highlighting MRR, churn rates, and CSV data export functionality.
11. **Cron Jobs / Billing Engine**: Backend processors for generating periodic invoices and validating states.
12. **Admin Dashboard**: Aggregated high-level views featuring Recharts-based telemetry and quick actions.


---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 14+

### 1. Clone the repository
```bash
git clone https://github.com/HerinPatel7433/Subscription-Management-System.git
cd Subscription-Management-System
```

### 2. Backend Setup
*(Note: Ensure you are in the application's api or backend directory if separated.)*
```bash
# Install backend dependencies
npm install

# Configure Environment Variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed the database with initial products, plans, and admin user
npm run seed

# Start the REST API server
npm run dev
```

### 3. Frontend Setup
*(Note: Return to the repository root or frontend directory.)*
```bash
# Install frontend dependencies
npm install

# Configure Environment Variables
# Create a .env file and ensure VITE_API_URL is accurately pointing to your Backend URL.

# Start the Vite development environment
npm run dev
```

---

## 🔐 Environment Variables

Ensure these files are present at the root or respective component directories, configured accurately.
No secrets are documented here for security purposes.

| Variable | Target | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Frontend | Base URL endpoint for REST API calls | `http://localhost:3000/api` |
| `DATABASE_URL` | Backend | Connection string used by Prisma | `postgresql://user:pass@localhost:5432/sms` |
| `JWT_SECRET` | Backend | Secret signing key for standard JWT creation | `super_secret_string` |
| `PORT` | Backend | The core port that the active instance listens on | `3000` |
| `FRONTEND_URL` | Backend | Known origin of the frontend instance (for CORS/Emails) | `http://localhost:5173` |

---

## 📖 API Documentation

The REST API utilizes JSON payloads and accepts Bearer Token authentication headers. The default local prefix is `http://localhost:3000/api`.

We have mapped all critical endpoints directly into a ready-to-run Postman JSON collection containing expected routing sequences, authorization, and standard parameter behaviors. 

👉 **[Download Complete Postman Collection](./docs/SMS-API.postman_collection.json)**

*To begin testing interfaces immediately, import the collection into Postman and update the `{{baseUrl}}` and `{{token}}` variables under the primary environment configuration module.*

---

## 📊 Database ERD

*This outlines the general unified connections mapping Subscriptions, Payments, Plans, and Invoices down to the normalized user level.*

![Database ERD](./docs/erd-placeholder.png)
*(Note: A generated schematic from Prisma Studio or similar tool would be placed here).*

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
