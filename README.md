# 🚀 Uptime Monitor

A modern, full-stack uptime monitoring service built with Next.js, TypeScript, and PostgreSQL. Get instant alerts when your websites go down via email, Slack, or custom webhooks.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🔍 **Real-time Monitoring**

- **Website uptime monitoring** with configurable check intervals (default: 5 minutes)
- **Response time tracking** with latency measurements
- **Status history** with detailed monitoring logs
- **Automatic retry logic** with exponential backoff

### 📱 **Multi-channel Alerting**

- **Email notifications** via Resend when sites go down
- **Slack integration** with rich message formatting
- **Custom webhook support** for any third-party integrations
- **Smart alerting** with duplicate prevention (30-minute cooldown)

### 🎨 **Modern Dashboard**

- **Responsive design** that works on all devices
- **Real-time status updates** with live monitoring data
- **Intuitive monitor management** (create, edit, delete, pause)
- **Settings configuration** for alert destinations

### 🔐 **Secure & Reliable**

- **Google OAuth authentication** with Better Auth
- **Session management** with secure token handling
- **Background job processing** with Inngest for reliability
- **Database optimization** with proper indexing and relationships

## 🛠️ Tech Stack

### **Frontend**

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Recharts** for data visualization

### **Backend**

- **Server Actions** for API operations
- **Prisma ORM** with PostgreSQL
- **Better Auth** for authentication
- **Inngest** for background job processing

### **External Services**

- **Resend** for email delivery
- **Google OAuth** for authentication
- **Slack Webhooks** for notifications

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials
- Resend API key (for email alerts)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/uptime-monitor.git
   cd uptime-monitor
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/uptime_monitor"
   DIRECT_URL="postgresql://username:password@localhost:5432/uptime_monitor"

   # Authentication
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Email (Resend)
   RESEND_API_KEY="your-resend-api-key"

   # Inngest
   INNGEST_EVENT_KEY="your-inngest-event-key"
   INNGEST_SIGNING_KEY="your-inngest-signing-key"
   ```
4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. **Start the development server**

   ```bash
   npm run dev
   ```
6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Adding a Monitor

1. Sign in with Google OAuth
2. Click "Add Monitor" on the dashboard
3. Enter your website URL and monitoring interval
4. Configure alert settings in the Settings page

### Configuring Alerts

1. Go to Settings page
2. Add your Slack webhook URL for Slack notifications
3. Add your custom webhook URL for third-party integrations
4. Test your webhook configuration

### Monitoring

- Monitors check your websites every 5 minutes by default
- You can customize the check interval per monitor
- Pause/resume monitoring as needed
- View real-time status and response times

## 🏗️ Project Structure

```
uptime-monitor/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (landing)/         # Landing page
│   │   ├── api/               # API routes
│   │   └── dashboard/         # Dashboard pages
│   ├── actions/               # Server actions
│   │   ├── alerts/            # Alert functionality
│   │   ├── monitor/           # Monitor CRUD operations
│   │   └── settings/          # Settings management
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── landing/           # Landing page components
│   │   └── ui/                # Reusable UI components
│   ├── inngest/               # Background job functions
│   ├── lib/                   # Utility libraries
│   │   ├── auth/              # Authentication setup
│   │   ├── prisma/            # Database client
│   │   └── resend/            # Email service
│   └── generated/             # Prisma generated files
├── prisma/
│   └── schema.prisma          # Database schema
└── public/                    # Static assets
```
