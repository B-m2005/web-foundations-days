# TicketHub – Design Document

---

## Part 1 – Requirements

### Functional Requirements
- Users can register and log in
- Users can browse upcoming events and concerts
- Users can view a seat map showing available seats
- Users can hold a seat for 10 minutes while paying
- Users can complete payment and receive a confirmed ticket
- Users can view all their purchased tickets
- No two users can ever buy the same seat

### Non-Functional Requirements
- Speed: event pages must load in under 2 seconds on a normal day
- Correctness: a seat must never be sold twice under any condition,
  even if two people click it at exactly the same time
- Fairness: users who arrive first must be served first during
  a popular concert sale
- Availability: the system must stay online during a big sale
  when 200,000 people arrive at once
- Scalability: the system must handle 400 times normal traffic
  without crashing
- Security: all payments travel over HTTPS and no card data
  is stored on our servers

---

## Part 2 – Estimates

### Assumptions
- 2 million registered users
- 50,000 visitors on a normal day
- Each visitor views 10 pages
- 5,000 tickets sold on a normal day
- Active hours = 18 hours per day = 64,800 seconds
- Big sale: 200,000 people try to buy 20,000 seats
  within the first 10 minutes = 600 seconds

### Normal Day

Page views per second:
50,000 visitors x 10 pages = 500,000 page views per day
500,000 divided by 64,800 = ~8 page views per second
Peak normal (x3) = ~24 page views per second

Ticket sales per second:
5,000 tickets divided by 64,800 = ~0.08 sales per second
Less than 1 sale per second on a normal day

### Big Sale Peak

Page requests per second:
200,000 people x 10 requests each = 2,000,000 requests
2,000,000 divided by 600 seconds = ~3,333 requests per second

Seat hold attempts per second:
200,000 attempts divided by 600 seconds = ~333 per second

### Comparison

| Metric | Normal Day | Big Sale Peak |
|--------|-----------|---------------|
| Page views per second | ~8 | ~3,333 |
| Seat requests per second | ~0.08 | ~333 |
| Concurrent users | ~3,000 | ~200,000 |
| Traffic multiplier | 1x | ~416x |

The big sale produces over 400 times normal traffic in
a single 10-minute window. The architecture must survive
this spike without crashing and without selling any
seat twice.

---

## Part 3 – API Design

Base URL: https://api.tickethub.co.ke/v1
All requests and responses use JSON.
Authentication: Bearer token in Authorization header.

### Endpoints

| Method | Path | Description | Success Status |
|--------|------|-------------|----------------|
| GET | /events | Browse all upcoming events | 200 OK |
| GET | /events/{id} | View one event with full details | 200 OK |
| GET | /events/{id}/seats | View seat map and availability | 200 OK |
| POST | /seats/{id}/hold | Hold a seat for 10 minutes | 200 OK |
| POST | /orders | Pay for a held seat and confirm ticket | 201 Created |
| GET | /orders | View all tickets for the logged-in user | 200 OK |
| DELETE | /seats/{id}/hold | Release a held seat early | 200 OK |

### Example – POST /seats/{id}/hold

Request body:
```json
{
  "user_id": 42,
  "seat_id": 1085
}
```

Response (200 OK):
```json
{
  "hold_id": "HLD-20261013-0042",
  "seat_id": 1085,
  "event_id": 7,
  "held_until": "2026-10-13T20:10:00Z",
  "status": "held"
}
```

### Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 400 | Bad Request | Missing seat_id in body |
| 401 | Unauthorized | No token or token expired |
| 404 | Not Found | Seat or event does not exist |
| 409 | Conflict | Seat is already held or sold |
| 500 | Server Error | Database transaction failed |

---

## Part 4 – Data Model

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| full_name | TEXT | NOT NULL |
| email | TEXT | NOT NULL UNIQUE |
| password_hash | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### events
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| title | TEXT | NOT NULL |
| venue | TEXT | NOT NULL |
| event_date | TIMESTAMP | NOT NULL |
| total_seats | INTEGER | NOT NULL |
| available_seats | INTEGER | NOT NULL |

### seats
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| event_id | INTEGER | NOT NULL, FOREIGN KEY to events(id) |
| seat_number | TEXT | NOT NULL |
| section | TEXT | NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| status | TEXT | NOT NULL DEFAULT available |
| held_by | INTEGER | FOREIGN KEY to users(id) |
| held_until | TIMESTAMP | |

### orders
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FOREIGN KEY to users(id) |
| seat_id | INTEGER | NOT NULL UNIQUE, FOREIGN KEY to seats(id) |
| event_id | INTEGER | NOT NULL, FOREIGN KEY to events(id) |
| amount_paid | DECIMAL(10,2) | NOT NULL |
| status | TEXT | NOT NULL DEFAULT confirmed |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### Relationships

users to orders is one-to-many: one user can place many
orders but each order belongs to exactly one user.

events to seats is one-to-many: one event has many seats
but each seat belongs to exactly one event.

seats to orders is one-to-one: each seat can only appear
in one order because of the UNIQUE constraint on seat_id
in the orders table. This is what makes double-booking
impossible at the database level.

---

## Part 5 – How Double-Booking Is Prevented

Double-booking is the most critical problem for a ticketing
system. TicketHub prevents it using three layers working
together.

### Layer 1 – UNIQUE Constraint on seat_id

The orders table has a UNIQUE constraint on the seat_id
column. This means the database itself will reject any
attempt to insert a second order for the same seat, even
if two requests arrive at exactly the same millisecond.
This is the final safety net that can never be bypassed.

### Layer 2 – Database Transaction with FOR UPDATE Lock

When a user tries to hold a seat the app server runs
this transaction:

```sql
BEGIN TRANSACTION;

SELECT status FROM seats
WHERE id = 1085
FOR UPDATE;

UPDATE seats
SET status = 'held',
    held_by = 42,
    held_until = NOW() + INTERVAL 10 MINUTE
WHERE id = 1085
AND status = 'available';

COMMIT;
```

The FOR UPDATE clause locks the seat row so only one
request can read and update it at a time. Any other
request trying to hold the same seat must wait until
the transaction commits or rolls back. This prevents
the race condition where two users both read available
at the same time and both try to buy.

### Layer 3 – 10-Minute Hold Expiry

If a user holds a seat but does not complete payment
within 10 minutes a background worker automatically
sets the seat status back to available. This prevents
seats being locked forever by users who abandoned
the checkout page.

---

## Part 6 – Architecture Diagram

                [ USER BROWSER ]
                       |
                       | HTTPS
                       v
                    [ DNS ]
              (resolves tickethub.co.ke
               to the CDN IP address)
                       |
                       v
                    [ CDN ]
              (caches event pages,
               seat maps, images
               so static content
               loads fast globally)
                       |
               cache miss only
                       v
                  [ QUEUE ]
              (during big sale holds
               all seat requests in
               arrival order so the
               database is not flooded
               and fairness is kept)
                       |
                       v
               [ LOAD BALANCER ]
              (spreads requests across
               multiple app servers)
                /             \
               v               v
        [ APP SERVER 1 ]  [ APP SERVER 2 ]
        (handles API          (handles API
         requests, seat        requests, seat
         holds, payments)      holds, payments)
               |                   |
               v                   v
            [ CACHE (Redis) ]
          (stores seat availability
           maps in memory so not
           every user hits the
           database to browse seats)
               |
      cache miss only
               |
        +------+------+
        v             v
 [ PRIMARY DB ]  [ READ REPLICA ]
 (runs all seat       (handles all
  hold transactions    event browsing
  with FOR UPDATE      and seat map
  locks — the only     reads)
  place writes go)
        |
        v
    [ WORKER ]
 (runs every minute,
  releases expired
  10-minute holds,
  sends confirmation
  emails to buyers)


### How It Survives the Big Sale

During a normal day the queue is empty and requests go
straight through. When 200,000 people arrive in 10 minutes
the queue absorbs the spike, feeds requests to the app
servers at a rate the database can handle, and ensures
the first people to arrive are the first to be served.
The read replica handles all seat browsing so the primary
database focuses entirely on hold transactions.

### Component Explanations

| Component | Problem It Solves |
|-----------|------------------|
| DNS | Translates the domain name into an IP address so browsers can find the server |
| CDN | Serves static pages and images from a server close to the user so the app loads fast globally |
| Queue | During the big sale absorbs 333 seat requests per second and feeds them to the database in order so it does not crash and fairness is maintained |
| Load Balancer | Spreads incoming requests across multiple app servers so no single server is overwhelmed |
| App Servers x2 | Handle seat holds, payment processing and all API logic |
| Cache Redis | Stores seat availability in memory so 3,333 users per second can browse seats without hitting the database |
| Primary Database | Runs seat hold transactions with FOR UPDATE locks — the single source of truth that prevents double-booking |
| Read Replica | Handles all read queries for event browsing protecting the primary database for writes only |
| Worker | Releases expired holds after 10 minutes and sends email confirmations to buyers |

---

## Part 7 – Trade-offs

### Trade-off 1 – Queue During Big Sale vs Instant Response

Choice: Route all seat hold requests through a queue
during a big sale instead of hitting the database directly.

Benefit: The database receives a steady controlled stream
of requests instead of 333 seat hold attempts per second
all at once. The system stays online. Users are served
in the order they arrived which is fair.

Cost: A user who clicks a seat immediately may wait
30 to 60 seconds in the queue before their hold is
processed. This feels slow.

Acceptable because: Without the queue the database would
crash under the load and nobody would get a ticket at all.
A short wait is far better than a crashed website.

### Trade-off 2 – 10-Minute Hold Timeout vs Longer Hold

Choice: Release held seats after exactly 10 minutes if
payment is not completed.

Benefit: Seats do not stay locked forever. If a user
holds a seat but abandons checkout the seat returns to
the pool quickly giving other users a fair chance.

Cost: A user with a slow internet connection or who gets
distracted may lose their chosen seat after 10 minutes
and have to re-enter the queue.

Acceptable because: 10 minutes is enough time to complete
a payment on any normal connection. A shorter timeout
keeps the pool of available seats moving during a sale.

### Trade-off 3 – Cache Staleness vs Database Load

Choice: Cache seat availability maps in Redis for 5 seconds.

Benefit: During the big sale 3,333 users per second see
seat maps without each request hitting the database.
This protects the primary database for write operations.

Cost: A seat shown as available in the cached map may
already be held by someone else. The user discovers this
only when they try to hold it and receive a 409 Conflict.

Acceptable because: The database transaction and UNIQUE
constraint are the true guarantee of correctness. The
cache is only used for browsing. The actual hold always
goes directly to the database.


