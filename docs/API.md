# Roshona REST API

All routes use the `/api` prefix. JSON request bodies use `Content-Type: application/json`. Authentication uses a signed, HTTP-only `roshona_session` cookie; cross-origin requests must include credentials and the API must allow the exact frontend origin. In production, set `FRONTEND_ORIGIN` to one or more comma-separated HTTPS origins. Do not use `*` with credentialed cookies.

## Public

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | API and MongoDB connection status; returns HTTP 503 if MongoDB is disconnected |
| GET | `/storefront/settings` | Public checkout configuration (delivery and VAT), or `null` until configured |
| GET | `/products` | Active products; supports `q`, `category`, `featured=true` |
| GET | `/products/:slug` | Active product detail |
| GET | `/products/:slug/reviews` | Approved reviews for an active product; customer names are populated from accounts |
| GET | `/recipes` | Active recipes, including ingredients, method and preparation time |
| GET | `/recipes/:slug` | Active recipe detail |
| GET | `/reviews?limit=6` | Approved customer reviews only; `limit` is capped at 24 |
| GET | `/categories` | Product categories |
| POST | `/contact` | Validate and save a contact message; rate limited |
| POST | `/auth/register` | Create a customer account; passwords require at least 12 characters |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Clear the session cookie |
| POST | `/auth/forgot-password` | Send a time-limited reset link when SMTP is configured |
| POST | `/auth/reset-password` | Consume a one-hour, single-use password-reset token |
| GET | `/orders/track/:orderNumber` | Return order status and dates only |

## Signed-in customer

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/auth/me` | Current profile, addresses, and wishlist |
| PATCH | `/account/profile` | Update name and optional phone |
| PUT | `/account/addresses` | Replace up to ten validated saved addresses |
| PUT | `/account/wishlist` | Toggle a product using `{ "productId": "<ObjectId>" }` |
| GET | `/account/recipe-wishlist` | Read the signed-in customer's saved recipes |
| PUT | `/account/recipe-wishlist` | Toggle a recipe using `{ "recipeId": "<ObjectId>" }` |
| GET | `/reviews/eligibility/:productId` | Check whether the customer has a delivered order without an existing review for that product/order |
| POST | `/reviews` | Submit `{ "productId", "rating", "comment" }` for an eligible delivered order; new reviews require moderation |
| GET | `/cart` | Read the signed-in customer's cart |
| PUT | `/cart` | Replace cart with `{ "items": [{ "productId": "<ObjectId>", "quantity": 1 }] }` |
| POST | `/orders` | Create a cash-on-delivery order |
| GET | `/orders` | Current customer's order history |

Order creation requires `{ "customer": { "name", "email", "phone", "address", "city" }, "items": [{ "productId", "quantity" }], "paymentMethod": "cod" }`. Product IDs, price, availability and stock are checked on the server. Price is never accepted from the client. Delivery and VAT are calculated from the current persisted store settings; VAT is applied to the product subtotal only when enabled. Applied subtotal, delivery, VAT amount/rate and total are persisted on the order. Stock reservation, order creation and cart clearing run within a MongoDB transaction. Checkout returns `503` until delivery settings are saved by an administrator.

## Administrator (`admin` role required)

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/admin/summary` | Order, sales, product and customer totals plus recent orders |
| GET | `/admin/products` | List all products, including hidden products |
| POST | `/admin/products` | Create a validated product |
| PATCH | `/admin/products/:id` | Update product fields |
| DELETE | `/admin/products/:id` | Hide a product rather than deleting order history |
| GET | `/admin/recipes` | List recipes, including unpublished entries |
| POST | `/admin/recipes` | Create a validated recipe with ingredient list and method |
| PATCH | `/admin/recipes/:id` | Update a recipe |
| DELETE | `/admin/recipes/:id` | Hide a recipe from the storefront |
| GET | `/admin/orders` | List recent orders |
| PATCH | `/admin/orders/:id` | Update order status; cancellation/reopening adjusts stock transactionally |
| GET | `/admin/reviews` | List reviews, including pending and rejected submissions |
| PATCH | `/admin/reviews/:id` | Approve or reject a review using `{ "status": "approved" }` or `{ "status": "rejected" }` |
| GET | `/admin/customers` | List customer contact fields (never password hashes) |
| GET/POST | `/admin/categories` | List or create categories |
| PATCH | `/admin/categories/:id` | Rename a category and its products transactionally |
| DELETE | `/admin/categories/:id` | Remove an unused category; returns `409` while products still use it |
| GET | `/admin/messages` | List recent customer messages |
| PATCH | `/admin/messages/:id` | Set message status to `new`, `read`, or `resolved` |
| GET | `/admin/settings` | List persisted settings |
| PUT | `/admin/settings/checkout` | Save validated delivery and VAT settings |
| PUT | `/admin/settings/:key` | Save another JSON-object setting |

The checkout setting contains `delivery.baseFee` (confirmed standard delivery fee), `delivery.freeDeliveryMinimumSubtotal` (optional subtotal threshold; use `null` to disable), `vat.enabled`, and `vat.ratePercent`. Set the values in the admin panel only after confirming the business delivery fee and applicable VAT rate. Online gateway payments are not implemented; only COD is accepted.

Invalid JSON fields return `400`; unauthenticated routes return `401`; admin-only routes return `403`; conflicting orders return `409`; unknown API routes return `404`. Unexpected errors are logged server-side and return a generic `500` response.

Only approved reviews are returned by public routes. Customers can submit one review per delivered order and product; submissions remain pending until an administrator approves them. Recipe and review data is served from MongoDB, not hardcoded into the customer-facing sections.
