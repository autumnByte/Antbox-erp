# ANTBOX ERP

## Overview

ANTBOX ERP is a full-stack ERP-style management platform designed to streamline internship operations, workforce tracking, attendance management, payroll handling, analytics, and administrative workflows.

The platform combines a modern frontend dashboard with a scalable FastAPI backend and PostgreSQL database integration.

---

# Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript

## Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication

---

# Core Features

- Authentication & Role-Based Access
- Attendance Tracking
- Payroll Management
- Student & Staff Management
- Internship Cohort Management
- Analytics Dashboard
- Notifications & Alerts
- Deployment-Ready Backend Architecture

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
cd ANTBOX_ERP
```

## Backend Setup

```bash
cd backend
python -m venv venv
```

### Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux/Mac

```bash
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Configure Environment Variables

Create/Edit `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/antbox
SECRET_KEY=your_secret_key
```

---

## Run Server

```bash
uvicorn app.main:app --reload
```

---

# Future Improvements

- AI Chatbot Integration
- Advanced Analytics
- Email Automation
- Real-Time Notifications
- Cloud Deployment

---

# Author

## Suhani Dwivedi

B.Tech CSE Student
