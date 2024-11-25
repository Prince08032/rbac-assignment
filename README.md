# Next.js User Management Dashboard

A modern, responsive dashboard application built with Next.js, featuring comprehensive user management, role-based access control, and a clean, intuitive interface.

## Features

- 🔐 **Authentication & Authorization**
  - Secure JWT-based authentication
  - Role-based access control (RBAC)
  - Permission-based feature access

- 👥 **User Management**
  - User creation and management
  - Role assignment
  - Status management
  - Responsive user interface
  - Search and pagination
  - Sorting functionality

- 👮 **Role Management**
  - Create and manage roles
  - Assign permissions to roles
  - Default roles (Admin, Manager, User)
  - Dynamic permission updates

- 🔑 **Permission Management**
  - Create and manage permissions
  - Granular access control
  - Permission assignment to roles
  - Real-time updates

- 🎨 **Modern UI/UX**
  - Responsive design
  - Dark mode support
  - Clean and intuitive interface
  - Loading states and error handling
  - Interactive feedback

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Supabase
- **Authentication**: Custom JWT implementation
- **State Management**: React Context
- **Database**: PostgreSQL (via Supabase)
- **Styling**: TailwindCSS, Custom components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Prince08032/rbac-assignment.git
cd rbac-assignment
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

### Database Setup

Create these tables in your Supabase database:

```sql
-- Create users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(255),
    role TEXT[] DEFAULT ARRAY['user'],
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create roles table
CREATE TABLE roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create permissions table
CREATE TABLE permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);
```

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/         # React components
│   ├── manage/        # Management components
│   └── ...
├── contexts/          # React contexts
├── lib/               # Utility functions
└── ...
```

## Key Features Explained

### Authentication
- Custom JWT implementation
- Secure password hashing
- Token-based session management

### User Management
- Complete CRUD operations
- Role-based access control
- Status management
- Search and filter capabilities

### Role & Permission System
- Hierarchical role structure
- Granular permissions
- Dynamic permission checking
- Real-time updates

## Support

For support, open an issue in the repository.
