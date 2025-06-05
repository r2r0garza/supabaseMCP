# User Registration and Login Flow

## Overview

This document describes the updated user registration and login flow that implements data synchronization between the `pending_users` and `users` tables.

## Registration Flow

### 1. User Registration (`/auth/register`)

When a user registers through the `/auth/register` endpoint:

1. **Input**: The endpoint receives:
   - `email`: User's email address
   - `password`: User's password
   - `full_name`: User's full name
   - `phone`: User's phone number

2. **Supabase Auth Registration**: The user is registered with Supabase Auth
3. **Pending User Storage**: The user's data (email, full_name, phone) is stored in the `pending_users` table
4. **Response**: Returns the Supabase Auth user and session data

### 2. First Login and User Profile Creation

When a user logs in for the first time, the frontend calls the `/users` POST endpoint to create the user profile:

1. **Input**: The endpoint receives:
   - `id`: User's Supabase Auth ID
   - `email`: User's email address
   - `full_name`: User's full name (from Auth metadata)
   - `phone`: User's phone (from Auth metadata, may be empty)
   - `role`: User's role (defaults to "cliente")

2. **Pending User Lookup**: The system checks the `pending_users` table for a matching email
3. **Data Synchronization**: If a pending user is found:
   - Use the `phone` from `pending_users` (prioritized over Auth metadata)
   - Use the `full_name` from `pending_users` (prioritized over Auth metadata)
   - Delete the record from `pending_users` table
4. **User Creation**: Create the user record in the `users` table with the synchronized data

## Database Tables

### pending_users
- `id`: Serial primary key
- `email`: Text, unique, not null
- `full_name`: Text, not null
- `phone`: Text, not null
- `created_at`: Timestamp, default now()

### users
- `id`: UUID primary key (references auth.users)
- `email`: Text, unique, not null
- `full_name`: Text
- `phone`: Text
- `role`: Text, default "cliente"
- `created_at`: Timestamp, default now()
- `updated_at`: Timestamp, default now()

## API Endpoints

### POST /auth/register
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

### POST /users
```json
{
  "id": "uuid-from-auth",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "cliente"
}
```

## Key Features

1. **Data Integrity**: Ensures user data from registration is preserved and used when creating the user profile
2. **Fallback Handling**: If pending user data is not found, uses the provided data
3. **Error Resilience**: User creation continues even if pending user synchronization fails
4. **Automatic Cleanup**: Pending user records are automatically deleted after synchronization

## Implementation Details

- The `syncPendingUserData()` helper function handles the lookup and cleanup of pending user data
- Phone numbers from `pending_users` are prioritized over Auth metadata
- Full names from `pending_users` are prioritized over Auth metadata
- Error handling ensures the user creation process is not interrupted by synchronization issues 