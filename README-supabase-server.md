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

## Coupons

**Note: All coupon management endpoints require admin authentication (except coupon validation by code).**

### Get All Coupons (Admin Only)

```sh
curl http://localhost:8000/coupons \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

### Get All Active Coupons Only (Admin Only)

```sh
curl "http://localhost:8000/coupons?active_only=true" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

### Get All Expired Coupons Only (Admin Only)

```sh
curl "http://localhost:8000/coupons?expired_only=true" \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

### Get Coupon by ID (Admin Only)

```sh
curl http://localhost:8000/coupons/<COUPON_ID> \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

### Validate Coupon by Code (Public)

```sh
curl "http://localhost:8000/coupons/by-code/WELCOME15?order_amount=200&user_id=<USER_ID>"
```

### Create New Coupon (Admin Only)

```sh
curl -X POST http://localhost:8000/coupons \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Holiday Sale","code":"HOLIDAY20","discount_type":"percentage","discount_value":20,"min_order_amount":100,"usage_limit":500,"end_date":"2024-12-31T23:59:59Z"}'
```

### Create Fixed Amount Coupon (Admin Only)

```sh
curl -X POST http://localhost:8000/coupons \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Welcome Bonus","code":"WELCOME50","discount_type":"fixed_amount","discount_value":50,"min_order_amount":200,"usage_limit":100}'
```

### Create Percentage Coupon with Max Discount (Admin Only)

```sh
curl -X POST http://localhost:8000/coupons \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Student Discount","code":"STUDENT25","discount_type":"percentage","discount_value":25,"max_discount_amount":100,"min_order_amount":50}'
```

### Update Coupon (Admin Only)

```sh
curl -X PUT http://localhost:8000/coupons/<COUPON_ID> \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","is_active":false,"usage_limit":200}'
```

### Deactivate Coupon (Admin Only)

```sh
curl -X PUT http://localhost:8000/coupons/<COUPON_ID> \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"is_active":false}'
```

### Increment Coupon Usage (Admin Only)

```sh
curl -X POST http://localhost:8000/coupons/<COUPON_ID>/increment-usage \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

### Delete Coupon (Admin Only)

```sh
curl -X DELETE http://localhost:8000/coupons/<COUPON_ID> \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
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

- Replace `<ACCESS_TOKEN>`, `<USER_ID>`, `<WORKSHOP_ID>`, `<SESSION_ID>`, `<ORDER_ID>`, `<COUPON_ID>`, and `<WORKSHOP_SLUG>` with real values.
- All endpoints return JSON.
- For protected endpoints, pass the access token in the `Authorization: Bearer ...` header.
- For POST/PUT requests, use `-H "Content-Type: application/json"` and provide a JSON body with `-d`.
