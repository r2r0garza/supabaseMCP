# Supabase Integration Documentation

This document outlines everything needed to migrate Supabase interactions to another server. It includes all database schemas, API endpoints, authentication flows, and initial data loading requirements.

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Database Schema](#database-schema)
3. [Authentication System](#authentication-system)
4. [API Endpoints](#api-endpoints)
5. [Initial Data Loading](#initial-data-loading)
6. [Migration Considerations](#migration-considerations)

## Environment Configuration

The application uses the following environment variables for Supabase configuration:

```
VITE_SUPABASE_URL=https://qjrbkwrxlxuhhrmmmylo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_MIDDLE_SERVER_URL=http://localhost:8000
```

When migrating to another server, these environment variables must be updated to point to the new server.

## Database Schema

The application uses the following tables in Supabase:

### Users Table

Stores user information and profiles.

Fields:
- `id` (UUID, Primary Key): User ID from Supabase Auth
- `email` (Text): User's email address
- `full_name` (Text): User's full name
- `phone` (Text, Optional): User's phone number
- `role` (Text, Default: 'cliente'): User's role in the system

### Workshops Table

Stores information about available workshops.

Fields:
- `id` (UUID, Primary Key): Workshop ID
- `name` (Text): Workshop name
- `slug` (Text, Unique): URL-friendly identifier
- `description` (Text): Workshop description
- `price` (Numeric): Workshop price
- `capacity` (Integer): Maximum number of participants
- `date` (Timestamp): Workshop date
- `location` (Text): Workshop location
- `active` (Boolean, Default: true): Whether the workshop is active
- `image_url` (Text, Optional): URL to workshop image

### Workshop Sessions Table

Stores individual sessions for workshops.

Fields:
- `id` (UUID, Primary Key): Session ID
- `workshop_id` (UUID, Foreign Key): Reference to workshops table
- `date` (Timestamp): Session date and time
- `location` (Text): Session location
- `capacity` (Integer): Maximum number of participants
- `available_spots` (Integer): Number of available spots
- `active` (Boolean, Default: true): Whether the session is active

### Orders Table

Stores user orders for workshop sessions.

Fields:
- `id` (UUID, Primary Key): Order ID
- `user_id` (UUID, Foreign Key): Reference to users table
- `workshop_id` (UUID, Foreign Key): Reference to workshops table
- `session_id` (UUID, Foreign Key, Optional): Reference to workshop_sessions table
- `payment_method` (Text): Payment method used (paypal, stripe, conekta)
- `payment_id` (Text, Optional): ID from payment provider
- `amount` (Numeric): Order amount
- `status` (Text): Order status (pending, completed, cancelled)
- `created_at` (Timestamp, Default: now()): Order creation date

### Testimonials Table

Stores user testimonials for workshops.

Fields:
- `id` (UUID, Primary Key): Testimonial ID
- `user_id` (UUID, Foreign Key): Reference to users table
- `workshop_id` (UUID, Foreign Key): Reference to workshops table
- `content` (Text): Testimonial content
- `rating` (Integer): Rating (1-5)
- `position` (Text, Optional): User's position
- `company` (Text, Optional): User's company
- `avatar_url` (Text, Optional): URL to user's avatar
- `is_approved` (Boolean, Default: false): Whether the testimonial is approved
- `is_featured` (Boolean, Default: false): Whether the testimonial is featured
- `created_at` (Timestamp, Default: now()): Testimonial creation date
- `tags` (Array, Optional): Tags associated with the testimonial

### Pending Users Table

Stores temporary user information before registration.

Fields:
- `id` (UUID, Primary Key): Pending user ID
- `email` (Text, Unique): User's email address
- `full_name` (Text): User's full name
- `phone` (Text, Optional): User's phone number
- `created_at` (Timestamp, Default: now()): Record creation date

### Events Table

Stores information about events.

Fields:
- `id` (UUID, Primary Key): Event ID
- `workshop_id` (UUID, Foreign Key, Optional): Reference to workshops table
- `title` (Text): Event title
- `description` (Text): Event description
- `start_date` (Timestamp): Event start date and time
- `end_date` (Timestamp): Event end date and time
- `location` (Text): Event location
- `is_public` (Boolean, Default: true): Whether the event is public

## Database Functions

The application uses the following database functions:

### decrease_available_spots

Decreases the number of available spots in a workshop session.

```sql
CREATE OR REPLACE FUNCTION decrease_available_spots(session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workshop_sessions
  SET available_spots = available_spots - 1
  WHERE id = session_id AND available_spots > 0;
END;
$$ LANGUAGE plpgsql;
```

### increase_available_spots

Increases the number of available spots in a workshop session.

```sql
CREATE OR REPLACE FUNCTION increase_available_spots(session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workshop_sessions
  SET available_spots = available_spots + 1
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;
```

## Authentication System

The application uses Supabase Auth for user authentication. The following authentication flows are implemented:

### Sign Up

1. User provides email, password, and optional profile information
2. Supabase Auth creates a new user
3. A profile is created in the `users` table with the user's information
4. If the user's email exists in `pending_users`, that information is used to populate the profile

### Sign In

1. User provides email and password
2. Supabase Auth validates credentials and returns a session
3. The session is stored in the application state
4. User profile is synchronized with `pending_users` if necessary

### Sign Out

1. Supabase Auth signs out the user
2. The session is removed from the application state

### Password Reset

1. User requests a password reset with their email
2. Supabase Auth sends a password reset email
3. User clicks the link in the email and sets a new password
4. Supabase Auth updates the user's password

## API Endpoints

The application uses the following Supabase API endpoints:

### Authentication Endpoints

- `supabase.auth.signInWithPassword({ email, password })`: Sign in with email and password
- `supabase.auth.signUp({ email, password, options: { data: metadata } })`: Register a new user
- `supabase.auth.signOut()`: Sign out the current user
- `supabase.auth.getUser()`: Get the current user
- `supabase.auth.getSession()`: Get the current session
- `supabase.auth.resetPasswordForEmail(email, { redirectTo })`: Send a password reset email
- `supabase.auth.updateUser({ password })`: Update the user's password

### Users Endpoints

- `supabase.from('users').select('*').eq('id', id).single()`: Get a user by ID
- `supabase.from('users').insert({ id, email, full_name, phone, role })`: Create a user profile
- `supabase.from('users').update(profile).eq('id', id)`: Update a user profile
- `supabase.from('users').select('id').eq('email', email).limit(1)`: Find a user by email

### Workshops Endpoints

- `supabase.from('workshops').select('*').eq('active', true).order('name')`: Get all active workshops
- `supabase.from('workshops').select('*, workshop_sessions(*)').eq('slug', slug).eq('active', true).single()`: Get a workshop by slug
- `supabase.from('workshop_sessions').select('*').eq('workshop_id', workshopId).eq('active', true).order('date')`: Get sessions for a workshop
- `supabase.from('workshop_sessions').select('*, workshops(*)').eq('id', sessionId).single()`: Get a session by ID
- `supabase.from('workshop_sessions').select('*, workshops(*)').eq('active', true).gt('date', now).order('date').limit(limit)`: Get upcoming sessions

### Orders Endpoints

- `supabase.from('orders').insert({ user_id, workshop_id, session_id, payment_method, payment_id, amount, status })`: Create an order
- `supabase.from('orders').update({ status, payment_id }).eq('id', orderId)`: Update an order status
- `supabase.from('orders').select('*, workshops(*), sessions:session_id (*)').eq('user_id', userId).order('created_at', { ascending: false })`: Get user orders
- `supabase.from('orders').select('*, workshops(*), sessions:session_id (*)').eq('id', orderId).single()`: Get an order by ID
- `supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)`: Cancel an order

### Testimonials Endpoints

- `supabase.from('testimonials').select('*, users(full_name, email), workshops(name)').eq('is_approved', true).order('created_at', { ascending: false })`: Get all approved testimonials
- `supabase.from('testimonials').select('*, users(full_name, email), workshops(name)').eq('is_approved', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(limit)`: Get featured testimonials
- `supabase.from('testimonials').select('*, users(full_name, email), workshops(name)').eq('is_approved', true).eq('workshop_id', workshopId).order('created_at', { ascending: false })`: Get testimonials for a workshop
- `supabase.from('testimonials').insert({ user_id, workshop_id, content, position, company, rating, is_approved, is_featured, created_at })`: Create a testimonial

### Pending Users Endpoints

- `supabase.from('pending_users').insert({ email, full_name, phone })`: Save a pending user
- `supabase.from('pending_users').select('*').eq('email', email).single()`: Get a pending user by email
- `supabase.from('pending_users').delete().eq('email', email)`: Delete a pending user by email

### Events Endpoints

- `supabase.from('events').select('*, workshops(*)').gte('start_date', today).eq('is_public', true).order('start_date', { ascending: true }).limit(limit)`: Get upcoming events

## Initial Data Loading

When the page loads, the application needs to fetch the following data from Supabase:

1. **Current User and Session**
   - The application checks for an existing session using `supabase.auth.getSession()`
   - If a session exists, it fetches the user profile

2. **Workshops**
   - The application fetches all active workshops using `getAllWorkshops()`
   - This data is used to display available workshops on the home page and workshops page

3. **Testimonials**
   - The application fetches featured testimonials using `fetchFeaturedTestimonials()`
   - This data is displayed on the home page and testimonials page

4. **Upcoming Sessions**
   - The application fetches upcoming workshop sessions using `getUpcomingSessions()`
   - This data is displayed on the home page and workshops page

5. **User Orders (if authenticated)**
   - If a user is authenticated, the application fetches their orders using `getUserOrders()`
   - This data is displayed on the user's profile page

## FastAPI Endpoints Implementation

When migrating to a Python+FastAPI server, you'll need to implement the following endpoints to replace the current Supabase functionality:

### Authentication Endpoints

```python
# Authentication routes
@app.post("/auth/login")
async def login(credentials: LoginCredentials):
    """
    Sign in with email and password
    
    Request body:
    {
        "email": "user@example.com",
        "password": "userpassword"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "user": {
                "id": "uuid",
                "email": "user@example.com",
                ...
            },
            "session": {
                "access_token": "jwt-token",
                "refresh_token": "refresh-token",
                "expires_at": timestamp
            }
        }
    }
    """
    # Implementation

@app.post("/auth/register")
async def register(user_data: UserRegistration):
    """
    Register a new user
    
    Request body:
    {
        "email": "user@example.com",
        "password": "userpassword",
        "full_name": "User Name",
        "phone": "1234567890"
    }
    
    Response:
    {
        "success": true,
        "data": {
            "user": {
                "id": "uuid",
                "email": "user@example.com",
                ...
            },
            "session": {
                "access_token": "jwt-token",
                "refresh_token": "refresh-token",
                "expires_at": timestamp
            }
        }
    }
    """
    # Implementation

@app.post("/auth/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """
    Sign out the current user
    
    Response:
    {
        "success": true
    }
    """
    # Implementation

@app.get("/auth/user")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Get the current user
    
    Response:
    {
        "success": true,
        "data": {
            "id": "uuid",
            "email": "user@example.com",
            ...
        }
    }
    """
    # Implementation

@app.get("/auth/session")
async def get_session(token: str = Depends(oauth2_scheme)):
    """
    Get the current session
    
    Response:
    {
        "success": true,
        "data": {
            "session": {
                "access_token": "jwt-token",
                "refresh_token": "refresh-token",
                "expires_at": timestamp
            }
        }
    }
    """
    # Implementation

@app.post("/auth/reset-password")
async def reset_password(email_data: EmailData):
    """
    Send a password reset email
    
    Request body:
    {
        "email": "user@example.com",
        "redirect_to": "https://example.com/reset-password"
    }
    
    Response:
    {
        "success": true
    }
    """
    # Implementation

@app.post("/auth/update-password")
async def update_password(password_data: PasswordUpdate, token: str = Depends(oauth2_scheme)):
    """
    Update the user's password
    
    Request body:
    {
        "password": "newpassword"
    }
    
    Response:
    {
        "success": true
    }
    """
    # Implementation
```

### Users Endpoints

```python
@app.get("/users/{id}")
async def get_user_by_id(id: str, token: str = Depends(oauth2_scheme)):
    """
    Get a user by ID
    
    Response:
    {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "User Name",
        "phone": "1234567890",
        "role": "cliente"
    }
    """
    # Implementation

@app.post("/users")
async def create_user(user_data: UserCreate):
    """
    Create a user profile
    
    Request body:
    {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "User Name",
        "phone": "1234567890",
        "role": "cliente"
    }
    
    Response:
    {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "User Name",
        "phone": "1234567890",
        "role": "cliente"
    }
    """
    # Implementation

@app.put("/users/{id}")
async def update_user(id: str, user_data: UserUpdate, token: str = Depends(oauth2_scheme)):
    """
    Update a user profile
    
    Request body:
    {
        "full_name": "Updated Name",
        "phone": "0987654321"
    }
    
    Response:
    {
        "success": true
    }
    """
    # Implementation

@app.get("/users/by-email/{email}")
async def find_user_by_email(email: str):
    """
    Find a user by email
    
    Response:
    {
        "id": "uuid"
    }
    """
    # Implementation

@app.get("/users/profile")
async def get_profile(token: str = Depends(oauth2_scheme)):
    """
    Get the profile of the current user
    
    Response:
    {
        "success": true,
        "data": {
            "id": "uuid",
            "email": "user@example.com",
            "full_name": "User Name",
            "phone": "1234567890",
            "role": "cliente"
        }
    }
    """
    # Implementation

@app.put("/users/profile")
async def update_profile(profile_data: ProfileUpdate, token: str = Depends(oauth2_scheme)):
    """
    Update the profile of the current user
    
    Request body:
    {
        "full_name": "Updated Name",
        "phone": "0987654321"
    }
    
    Response:
    {
        "success": true
    }
    """
    # Implementation
```

### Workshops Endpoints

```python
@app.get("/workshops")
async def get_all_workshops():
    """
    Get all active workshops
    
    Response:
    [
        {
            "id": "uuid",
            "name": "Workshop Name",
            "slug": "workshop-name",
            "description": "Workshop description",
            "price": 100.0,
            "capacity": 20,
            "date": "2025-06-15T18:00:00Z",
            "location": "Workshop location",
            "active": true,
            "image_url": "https://example.com/image.jpg"
        },
        ...
    ]
    """
    # Implementation

@app.get("/workshops/{slug}")
async def get_workshop_by_slug(slug: str):
    """
    Get a workshop by slug
    
    Response:
    {
        "id": "uuid",
        "name": "Workshop Name",
        "slug": "workshop-name",
        "description": "Workshop description",
        "price": 100.0,
        "capacity": 20,
        "date": "2025-06-15T18:00:00Z",
        "location": "Workshop location",
        "active": true,
        "image_url": "https://example.com/image.jpg",
        "workshop_sessions": [
            {
                "id": "uuid",
                "workshop_id": "uuid",
                "date": "2025-06-15T18:00:00Z",
                "location": "Session location",
                "capacity": 20,
                "available_spots": 15,
                "active": true
            },
            ...
        ]
    }
    """
    # Implementation

@app.get("/workshop-sessions/workshop/{workshop_id}")
async def get_workshop_sessions(workshop_id: str):
    """
    Get sessions for a workshop
    
    Response:
    [
        {
            "id": "uuid",
            "workshop_id": "uuid",
            "date": "2025-06-15T18:00:00Z",
            "location": "Session location",
            "capacity": 20,
            "available_spots": 15,
            "active": true
        },
        ...
    ]
    """
    # Implementation

@app.get("/workshop-sessions/{session_id}")
async def get_workshop_session(session_id: str):
    """
    Get a session by ID
    
    Response:
    {
        "id": "uuid",
        "workshop_id": "uuid",
        "date": "2025-06-15T18:00:00Z",
        "location": "Session location",
        "capacity": 20,
        "available_spots": 15,
        "active": true,
        "workshops": {
            "id": "uuid",
            "name": "Workshop Name",
            "slug": "workshop-name",
            "description": "Workshop description",
            "price": 100.0,
            "capacity": 20,
            "date": "2025-06-15T18:00:00Z",
            "location": "Workshop location",
            "active": true,
            "image_url": "https://example.com/image.jpg"
        }
    }
    """
    # Implementation

@app.get("/workshop-sessions/upcoming")
async def get_upcoming_sessions(limit: int = 3):
    """
    Get upcoming sessions
    
    Response:
    [
        {
            "id": "uuid",
            "workshop_id": "uuid",
            "date": "2025-06-15T18:00:00Z",
            "location": "Session location",
            "capacity": 20,
            "available_spots": 15,
            "active": true,
            "workshops": {
                "id": "uuid",
                "name": "Workshop Name",
                "slug": "workshop-name",
                "description": "Workshop description",
                "price": 100.0,
                "capacity": 20,
                "date": "2025-06-15T18:00:00Z",
                "location": "Workshop location",
                "active": true,
                "image_url": "https://example.com/image.jpg"
            }
        },
        ...
    ]
    """
    # Implementation
```

### Orders Endpoints

```python
@app.post("/orders")
async def create_order(order_data: OrderCreate, token: str = Depends(oauth2_scheme)):
    """
    Create an order
    
    Request body:
    {
        "user_id": "uuid",
        "workshop_id": "uuid",
        "session_id": "uuid",
        "payment_method": "paypal",
        "payment_id": "payment-id",
        "amount": 100.0
    }
    
    Response:
    {
        "id": "uuid",
        "user_id": "uuid",
        "workshop_id": "uuid",
        "session_id": "uuid",
        "payment_method": "paypal",
        "payment_id": "payment-id",
        "amount": 100.0,
        "status": "pending",
        "created_at": "2025-06-02T20:30:00Z"
    }
    """
    # Implementation

@app.put("/orders/{order_id}")
async def update_order_status(order_id: str, status_data: OrderStatusUpdate, token: str = Depends(oauth2_scheme)):
    """
    Update an order status
    
    Request body:
    {
        "status": "completed",
        "payment_id": "payment-id"
    }
    
    Response:
    {
        "id": "uuid",
        "user_id": "uuid",
        "workshop_id": "uuid",
        "session_id": "uuid",
        "payment_method": "paypal",
        "payment_id": "payment-id",
        "amount": 100.0,
        "status": "completed",
        "created_at": "2025-06-02T20:30:00Z"
    }
    """
    # Implementation

@app.get("/orders/user/{user_id}")
async def get_user_orders(user_id: str, token: str = Depends(oauth2_scheme)):
    """
    Get user orders
    
    Response:
    [
        {
            "id": "uuid",
            "user_id": "uuid",
            "workshop_id": "uuid",
            "session_id": "uuid",
            "payment_method": "paypal",
            "payment_id": "payment-id",
            "amount": 100.0,
            "status": "completed",
            "created_at": "2025-06-02T20:30:00Z",
            "workshops": {
                "id": "uuid",
                "name": "Workshop Name",
                "slug": "workshop-name",
                "description": "Workshop description",
                "price": 100.0,
                "capacity": 20,
                "date": "2025-06-15T18:00:00Z",
                "location": "Workshop location",
                "active": true,
                "image_url": "https://example.com/image.jpg"
            },
            "sessions": {
                "id": "uuid",
                "workshop_id": "uuid",
                "date": "2025-06-15T18:00:00Z",
                "location": "Session location",
                "capacity": 20,
                "available_spots": 15,
                "active": true
            }
        },
        ...
    ]
    """
    # Implementation

@app.get("/orders/{order_id}")
async def get_order_by_id(order_id: str, token: str = Depends(oauth2_scheme)):
    """
    Get an order by ID
    
    Response:
    {
        "id": "uuid",
        "user_id": "uuid",
        "workshop_id": "uuid",
        "session_id": "uuid",
        "payment_method": "paypal",
        "payment_id": "payment-id",
        "amount": 100.0,
        "status": "completed",
        "created_at": "2025-06-02T20:30:00Z",
        "workshops": {
            "id": "uuid",
            "name": "Workshop Name",
            "slug": "workshop-name",
            "description": "Workshop description",
            "price": 100.0,
            "capacity": 20,
            "date": "2025-06-15T18:00:00Z",
            "location": "Workshop location",
            "active": true,
            "image_url": "https://example.com/image.jpg"
        },
        "sessions": {
            "id": "uuid",
            "workshop_id": "uuid",
            "date": "2025-06-15T18:00:00Z",
            "location": "Session location",
            "capacity": 20,
            "available_spots": 15,
            "active": true
        }
    }
    """
    # Implementation

@app.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, token: str = Depends(oauth2_scheme)):
    """
    Cancel an order
    
    Response:
    {
        "id": "uuid",
        "user_id": "uuid",
        "workshop_id": "uuid",
        "session_id": "uuid",
        "payment_method": "paypal",
        "payment_id": "payment-id",
        "amount": 100.0,
        "status": "cancelled",
        "created_at": "2025-06-02T20:30:00Z"
    }
    """
    # Implementation
```

### Testimonials Endpoints

```python
@app.get("/testimonials/approved")
async def get_approved_testimonials():
    """
    Get all approved testimonials
    
    Response:
    [
        {
            "id": "uuid",
            "name": "User Name",
            "position": "Position",
            "company": "Company",
            "content": "Testimonial content",
            "avatarUrl": "https://example.com/avatar.jpg",
            "workshopId": "uuid",
            "workshopName": "Workshop Name",
            "date": "2025-06-02T20:30:00Z",
            "rating": 5,
            "featured": false,
            "approved": true,
            "tags": ["tag1", "tag2"]
        },
        ...
    ]
    """
    # Implementation

@app.get("/testimonials/featured")
async def get_featured_testimonials(limit: int = 3):
    """
    Get featured testimonials
    
    Response:
    [
        {
            "id": "uuid",
            "name": "User Name",
            "position": "Position",
            "company": "Company",
            "content": "Testimonial content",
            "avatarUrl": "https://example.com/avatar.jpg",
            "workshopId": "uuid",
            "workshopName": "Workshop Name",
            "date": "2025-06-02T20:30:00Z",
            "rating": 5,
            "featured": true,
            "approved": true,
            "tags": ["tag1", "tag2"]
        },
        ...
    ]
    """
    # Implementation

@app.get("/testimonials/workshop/{workshop_id}")
async def get_testimonials_by_workshop(workshop_id: str):
    """
    Get testimonials for a workshop
    
    Response:
    [
        {
            "id": "uuid",
            "name": "User Name",
            "position": "Position",
            "company": "Company",
            "content": "Testimonial content",
            "avatarUrl": "https://example.com/avatar.jpg",
            "workshopId": "uuid",
            "workshopName": "Workshop Name",
            "date": "2025-06-02T20:30:00Z",
            "rating": 5,
            "featured": false,
            "approved": true,
            "tags": ["tag1", "tag2"]
        },
        ...
    ]
    """
    # Implementation

@app.post("/testimonials")
async def submit_testimonial(testimonial_data: TestimonialSubmit):
    """
    Submit a testimonial
    
    Request body:
    {
        "email": "user@example.com",
        "name": "User Name",
        "phone": "1234567890",
        "workshopId": "uuid",
        "content": "Testimonial content",
        "position": "Position",
        "company": "Company",
        "rating": 5
    }
    
    Response:
    {
        "success": true,
        "data": {
            "id": "uuid",
            "user_id": "uuid",
            "workshop_id": "uuid",
            "content": "Testimonial content",
            "position": "Position",
            "company": "Company",
            "rating": 5,
            "is_approved": false,
            "is_featured": false,
            "created_at": "2025-06-02T20:30:00Z"
        }
    }
    """
    # Implementation
```

### Pending Users Endpoints

```python
@app.post("/pending-users")
async def save_pending_user(user_data: PendingUserCreate):
    """
    Save a pending user
    
    Request body:
    {
        "email": "user@example.com",
        "full_name": "User Name",
        "phone": "1234567890"
    }
    
    Response:
    {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "User Name",
        "phone": "1234567890",
        "created_at": "2025-06-02T20:30:00Z"
    }
    """
    # Implementation

@app.get("/pending-users/by-email/{email}")
async def get_pending_user_by_email(email: str):
    """
    Get a pending user by email
    
    Response:
    {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "User Name",
        "phone": "1234567890",
        "created_at": "2025-06-02T20:30:00Z"
    }
    """
    # Implementation

@app.delete("/pending-users/by-email/{email}")
async def delete_pending_user_by_email(email: str):
    """
    Delete a pending user by email
    
    Response:
    {
        "success": true
    }
    """
    # Implementation
```

### Events Endpoints

```python
@app.get("/events/upcoming")
async def get_upcoming_events(limit: int = 5):
    """
    Get upcoming events
    
    Response:
    [
        {
            "id": "uuid",
            "workshop_id": "uuid",
            "title": "Event Title",
            "description": "Event description",
            "start_date": "2025-06-15T18:00:00Z",
            "end_date": "2025-06-15T20:00:00Z",
            "location": "Event location",
            "is_public": true,
            "workshops": {
                "id": "uuid",
                "name": "Workshop Name",
                "slug": "workshop-name",
                "description": "Workshop description",
                "price": 100.0,
                "capacity": 20,
                "date": "2025-06-15T18:00:00Z",
                "location": "Workshop location",
                "active": true,
                "image_url": "https://example.com/image.jpg"
            }
        },
        ...
    ]
    """
    # Implementation
```

### Database Functions Endpoints

```python
@app.post("/workshop-sessions/{session_id}/decrease-spots")
async def decrease_available_spots(session_id: str, token: str = Depends(oauth2_scheme)):
    """
    Decrease the number of available spots in a workshop session
    
    Response:
    {
        "success": true
    }
    """
    # Implementation

@app.post("/workshop-sessions/{session_id}/increase-spots")
async def increase_available_spots(session_id: str, token: str = Depends(oauth2_scheme)):
    """
    Increase the number of available spots in a workshop session
    
    Response:
    {
        "success": true
    }
    """
    # Implementation
```

## Migration Considerations

When migrating from Supabase to another server, consider the following:

### Authentication

1. **User Migration**
   - Export all users from Supabase Auth
   - Import users into the new authentication system
   - Ensure password hashing is compatible or require password resets

2. **Session Management**
   - Implement session creation and validation
   - Update the `useAuth` hook to use the new authentication system

### Database

1. **Schema Migration**
   - Create the same tables and relationships in the new database
   - Ensure data types are compatible
   - Migrate all existing data

2. **Functions and Triggers**
   - Implement the `decrease_available_spots` and `increase_available_spots` functions
   - Set up any necessary triggers

### API Endpoints

1. **Create New Endpoints**
   - Implement REST or GraphQL endpoints that match the Supabase functionality
   - Update all service files to use the new endpoints

2. **Error Handling**
   - Ensure error responses match the expected format
   - Update error handling in the application

### Client Updates

1. **Service Files**
   - Update all service files to use the new API endpoints
   - Replace Supabase client with appropriate HTTP client (e.g., axios, fetch)

2. **Environment Variables**
   - Update environment variables to point to the new server
   - Add any new required variables

### Testing

1. **Functional Testing**
   - Test all authentication flows
   - Test all data operations (CRUD)
   - Test initial data loading

2. **Performance Testing**
   - Ensure the new server can handle the expected load
   - Test response times for critical operations

## Conclusion

This document provides a comprehensive overview of the Supabase integration in the application. By following the guidelines and implementing the necessary components, you can successfully migrate the application to another server while maintaining all functionality.
