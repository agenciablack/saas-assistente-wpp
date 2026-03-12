# Dashboard Leads - Product Requirements Document

## Overview
Dashboard Leads is a web-based lead management system built for Allan Cabral. It provides a comprehensive dashboard to track, manage, and communicate with leads through WhatsApp automation. The system uses Supabase as the backend for authentication, database, and real-time updates.

## Tech Stack
- React 19 + TypeScript + Vite 6
- Tailwind CSS 3 for styling
- Supabase (Auth, Database, Realtime)
- React Router DOM 7 for routing
- Recharts 3 for data visualization
- Lucide React for icons
- date-fns for date manipulation

## Features

### 1. Authentication
- Email/password login via Supabase Auth
- Protected routes requiring authentication
- Session persistence with auto-refresh
- Dashboard user profile creation on first login

### 2. Dashboard
- KPI cards: total leads, conversion rate, leads waiting for response
- Configurable date range (presets: Today, 7d, 15d, 30d, custom)
- Area chart showing leads total, interested, and in-group over time
- Recent leads list with status badges
- Notifications bell with unread count

### 3. Leads Management
- Two tabs: Automatic Assistant and Premium Assistant
- Search by name or phone number
- Filter by lead status
- Paginated table with lead details
- WhatsApp direct message link
- Premium tab: sort by time in group, inline status change

### 4. Sales Funnel
- Kanban-style columns organized by lead status
- Visual pipeline of lead progression
- Real-time updates via Supabase realtime

### 5. Mass Messaging (Envios)
- Main page currently under development (placeholder)
- Sub-pages functional:
  - History: view past mass sends with filters and detail modal
  - Templates: CRUD for message templates

### 6. Funnel Messages Configuration
- Configure automated messages for each funnel step
- Follow-up and welcome message timing
- Two tabs: funnel steps and follow-ups/automatic messages

### 7. WhatsApp Number Management
- Add/edit/delete WhatsApp numbers for rotation
- Toggle numbers active/inactive
- Configure opening messages per number

### 8. Notifications
- Real-time notifications for: new leads, interest, conversions, group exits
- Mark as read (individual and bulk)
- Notification count badge

### 9. User Settings
- Edit display name
- Toggle notification preferences
- Change password

## Routes
| Route | Page | Auth Required |
|-------|------|--------------|
| /login | Login | No |
| / | Redirect to /dashboard | Yes |
| /dashboard | Dashboard | Yes |
| /leads | Leads Management | Yes |
| /funil | Sales Funnel | Yes |
| /envios | Mass Messaging (placeholder) | Yes |
| /envios/historico | Message History | Yes |
| /envios/templates | Message Templates | Yes |
| /mensagens | Funnel Messages Config | Yes |
| /numeros | WhatsApp Numbers | Yes |
| /notificacoes | Notifications | Yes |
| /configuracoes | Settings | Yes |

## Known Limitations
- Mass messaging (Envios) main page is a placeholder under development
- Requires Supabase environment variables to run
