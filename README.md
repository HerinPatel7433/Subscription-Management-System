# 📦 Subscription Management System (SMS)

> A full-stack web application for managing subscriptions, billing, invoices, taxes, and payments — built for businesses that need reliable, scalable subscription lifecycle management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Issues](https://img.shields.io/github/issues/HerinPatel7433/Subscription-Management-System)](https://github.com/HerinPatel7433/Subscription-Management-System/issues)

---

## 🧩 Features

- 🔐 **Authentication & Authorization** — Secure login, role-based access control
- 📦 **Product & Plan Management** — Flexible pricing tiers and plan configurations
- 🔄 **Subscription Lifecycle** — Create, upgrade, downgrade, cancel, and renew subscriptions
- 🧾 **Invoice Generation** — Automated invoicing with downloadable PDFs
- 💳 **Payment Processing** — Integrated payment gateway support
- 🏷️ **Discounts & Coupons** — Apply promotional codes and discount rules
- 🧮 **Tax Management** — Region-based tax configuration and calculation
- 📊 **Reports & Analytics** — Usage, revenue, and churn reports

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| **Frontend** | React.js, React Router, Axios       |
| **Backend**  | Node.js, Express.js                 |
| **Database** | PostgreSQL, Prisma ORM              |
| **Auth**     | JWT, bcrypt                         |
| **Payments** | Stripe API (or Razorpay)            |
| **Testing**  | Jest, React Testing Library, Supertest |
| **DevOps**   | Docker, GitHub Actions (CI/CD)      |
| **Docs**     | Swagger / OpenAPI 3.0               |

---

## 🗂️ Project Structure

```
Subscription-Management-System/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   └── public/
├── server/               # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── services/
│   └── prisma/
│       └── schema.prisma
├── docs/                 # API documentation
├── tests/                # Integration & E2E tests
├── .github/
│   ├── workflows/        # CI/CD pipelines
│   └── ISSUE_TEMPLATE/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** or **yarn**
- **Docker** (optional, for containerized setup)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/HerinPatel7433/Subscription-Management-System.git
cd Subscription-Management-System

# 2. Install backend dependencies
cd server && npm install

# 3. Install frontend dependencies
cd ../client && npm install

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your DB credentials, JWT secret, and payment keys
```

### Database Setup

```bash
# Run migrations
cd server
npx prisma migrate dev --name init
npx prisma generate

# (Optional) Seed demo data
npx prisma db seed
```

### Running Locally

```bash
# Start backend (from /server)
npm run dev          # runs on http://localhost:5000

# Start frontend (from /client)
npm run dev          # runs on http://localhost:5173
```

### Docker Setup

```bash
docker-compose up --build
```

---

## 🌿 Branch Strategy

| Branch Pattern         | Purpose                               |
|------------------------|---------------------------------------|
| `main`                 | Production-ready code                 |
| `dev`                  | Integration branch for features       |
| `feat/frontend-*`      | Frontend feature development          |
| `feat/backend-*`       | Backend feature development           |
| `feat/db-*`            | Database schema & migration work      |
| `chore/*`              | Config, tooling, and maintenance      |
| `test/*`               | Testing-specific branches             |

> **Workflow**: All feature branches → `dev` → reviewed → merged into `main`

---

## 👥 Team Roles

| Name                | Role                          | Responsibilities                                             |
|---------------------|-------------------------------|--------------------------------------------------------------|
| Herin Patel         | Project Manager / QA & Testing| Architecture, planning, integration, code reviews, unit/integration/E2E test suites |
| Heneel Chhatbar     | Frontend Developer            | React UI, component library, routing, state management       |
| Teesh Patel         | Backend Developer             | API design, business logic, authentication                   |
| Aditya Kasundra     | Database Engineer & DevOps    | Schema design, migrations, query optimization, CI/CD, Docker, deployment pipeline |

---

## 📋 Modules & Issues

| Module          | Status     | Issue                        |
|-----------------|------------|------------------------------|
| Authentication  | 🔲 Backlog  | #1 Auth Module               |
| Products        | 🔲 Backlog  | #2 Products Module           |
| Plans           | 🔲 Backlog  | #3 Plans Module              |
| Subscriptions   | 🔲 Backlog  | #4 Subscriptions Module      |
| Invoices        | 🔲 Backlog  | #5 Invoices Module           |
| Payments        | 🔲 Backlog  | #6 Payments Module           |
| Discounts       | 🔲 Backlog  | #7 Discounts Module          |
| Taxes           | 🔲 Backlog  | #8 Taxes Module              |
| Reports         | 🔲 Backlog  | #9 Reports Module            |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/backend-auth`
3. Commit your changes: `git commit -m "feat: add JWT authentication middleware"`
4. Push to the branch: `git push origin feat/backend-auth`
5. Open a Pull Request to `dev`

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

**Herin Patel** — [GitHub @HerinPatel7433](https://github.com/HerinPatel7433)

> ⭐ Star this repo if you find it useful!
