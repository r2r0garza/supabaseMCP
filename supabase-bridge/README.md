# Supabase Bridge Server

A Node.js + Express + TypeScript server that acts as a bridge between your frontend and Supabase, providing a REST API for authentication, user management, workshops, testimonials, orders, pending users, events, and session spot management.

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```

2. Create a `.env` file based on `.env.example` and fill in your Supabase credentials.

3. Start the server:
   ```sh
   npm run dev
   ```

The server runs on `http://localhost:8000` by default.

---

## Endpoints & curl Examples

### Health Check

```sh
curl http://localhost:8000/health
```

---

## Authentication

### Login

```sh
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}'
```

### Register

```sh
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword","full_name":"User Name","phone":"1234567890"}'
```

### Logout

```sh
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Get Current User

```sh
curl http://localhost:8000/auth/user \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Get Current Session

```sh
curl http://localhost:8000/auth/session \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Reset Password

```sh
curl -X POST http://localhost:8000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","redirect_to":"https://your-frontend.com/reset-password"}'
```

### Update Password

```sh
curl -X POST http://localhost:8000/auth/update-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"password":"newpassword"}'
```

---

## Users

### Get User by ID

```sh
curl http://localhost:8000/users/<USER_ID>
```

### Create User Profile

```sh
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"id":"<USER_ID>","email":"user@example.com","full_name":"User Name","phone":"1234567890","role":"cliente"}'
```

### Update User Profile

```sh
curl -X PUT http://localhost:8000/users/<USER_ID> \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Updated Name","phone":"0987654321"}'
```

### Find User by Email

```sh
curl http://localhost:8000/users/by-email/user@example.com
```

### Get Current User Profile

```sh
curl "http://localhost:8000/users/profile?id=<USER_ID>"
```

### Update Current User Profile

```sh
curl -X PUT http://localhost:8000/users/profile \
  -H "Content-Type: application/json" \
  -d '{"id":"<USER_ID>","full_name":"Updated Name","phone":"0987654321"}'
```

---

## Workshops

### Get All Active Workshops

```sh
curl http://localhost:8000/workshops
```

### Get Workshop by Slug

```sh
curl http://localhost:8000/workshops/<WORKSHOP_SLUG>
```

### Get Sessions for a Workshop

```sh
curl http://localhost:8000/workshops/sessions/workshop/<WORKSHOP_ID>
```

### Get Session by ID

```sh
curl http://localhost:8000/workshops/sessions/<SESSION_ID>
```

### Get Upcoming Sessions

```sh
curl "http://localhost:8000/workshops/sessions/upcoming?limit=3"
```

---

## Testimonials

### Get All Approved Testimonials

```sh
curl http://localhost:8000/testimonials/approved
```

### Get Featured Testimonials

```sh
curl "http://localhost:8000/testimonials/featured?limit=3"
```

### Get Testimonials for a Workshop

```sh
curl http://localhost:8000/testimonials/workshop/<WORKSHOP_ID>
```

### Submit a Testimonial

```sh
curl -X POST http://localhost:8000/testimonials \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"User Name","phone":"1234567890","workshopId":"<WORKSHOP_ID>","content":"Great workshop!","position":"Developer","company":"Acme Inc","rating":5}'
```

---

## Orders

### Create Order

```sh
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<USER_ID>","workshop_id":"<WORKSHOP_ID>","session_id":"<SESSION_ID>","payment_method":"paypal","payment_id":"payment-123","amount":100.0}'
```

### Update Order Status

```sh
curl -X PUT http://localhost:8000/orders/<ORDER_ID> \
  -H "Content-Type: application/json" \
  -d '{"status":"completed","payment_id":"payment-123"}'
```

### Get User Orders

```sh
curl http://localhost:8000/orders/user/<USER_ID>
```

### Get Order by ID

```sh
curl http://localhost:8000/orders/<ORDER_ID>
```

### Cancel Order

```sh
curl -X PUT http://localhost:8000/orders/<ORDER_ID>/cancel
```

---

## Pending Users

### Save Pending User

```sh
curl -X POST http://localhost:8000/pending-users \
  -H "Content-Type: application/json" \
  -d '{"email":"pending@example.com","full_name":"Pending User","phone":"1234567890"}'
```

### Get Pending User by Email

```sh
curl http://localhost:8000/pending-users/by-email/pending@example.com
```

### Delete Pending User by Email

```sh
curl -X DELETE http://localhost:8000/pending-users/by-email/pending@example.com
```

---

## Events

### Get Upcoming Events

```sh
curl "http://localhost:8000/events/upcoming?limit=5"
```

---

## Workshop Session Spots

### Decrease Available Spots

```sh
curl -X POST http://localhost:8000/workshop-sessions/<SESSION_ID>/decrease-spots
```

### Increase Available Spots

```sh
curl -X POST http://localhost:8000/workshop-sessions/<SESSION_ID>/increase-spots
```

---

## Notes

- Replace `<ACCESS_TOKEN>`, `<USER_ID>`, `<WORKSHOP_ID>`, `<SESSION_ID>`, `<ORDER_ID>`, and `<WORKSHOP_SLUG>` with real values.
- All endpoints return JSON.
- For protected endpoints, pass the access token in the `Authorization: Bearer ...` header.
- For POST/PUT requests, use `-H "Content-Type: application/json"` and provide a JSON body with `-d`.
