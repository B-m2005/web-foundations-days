# SnapShare – Scaling Plan

---

## 1. Assumptions

- 10 million registered users
- 10% are active every day = 1,000,000 daily active users (DAU)
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- Average photo size = 2 MB
- Thumbnail size = 50 KB per photo
- Peak traffic = 5× the average (morning and evening rush)
- Active hours = 18 hours per day (users do not use the app equally
  across 24 hours)

---

## 2. Estimates

### Daily Active Users (DAU)
10,000,000 × 10% = 1,000,000 active users per day

### Uploads Per Second
1,000,000 uploads per day
÷ (18 hours × 3,600 seconds)
= 1,000,000 ÷ 64,800
= ~15 uploads per second (average)

Peak = 15 × 5 = ~75 uploads per second

### Feed Views Per Second
1,000,000 users × 50 pages per day
= 50,000,000 feed views per day
÷ 64,800 seconds
= ~772 feed views per second (average)

Peak = 772 × 5 = ~3,860 feed views per second

### Photo Storage Per Year
1,000,000 photos per day × 2 MB
= 2,000,000 MB = ~2 TB of photos per day

Thumbnails:
1,000,000 × 50 KB = 50,000,000 KB = ~50 GB per day

Total per day  = ~2.05 TB
Total per year = 2.05 TB × 365 = ~748 TB per year (~750 TB)

---

## 3. Read-Heavy or Write-Heavy?

This system is READ-HEAVY.

Uploads (writes):    ~15 per second
Feed views (reads):  ~772 per second

Reads are 50× more frequent than writes.

This means the design must prioritise fast reads.
We do this by adding a cache and read replicas so
the database is not hit on every feed request.

---

## 4. Why Photos Must NOT Go in the Database

- Databases store structured data (text, numbers, dates)
- A 2 MB photo stored as a database row slows down
  every query on that table
- Databases are expensive to scale for raw file storage
- Object storage (like Amazon S3 or Cloudflare R2) is
  built specifically for large files — it is cheap,
  fast and scales to petabytes automatically

Rule: store the photo FILE in object storage,
store the photo METADATA (url, uploader, timestamp)
in the database.

---

## 5. Architecture Diagram

                    [ USER ]
                       |
                       | HTTPS request
                       ▼
                   [ CDN ]
              (serves thumbnails
               and feed images
               from edge cache)
                       |
                cache miss only
                       ▼
               [ LOAD BALANCER ]
              (spreads traffic across
               app servers evenly)
                /      |      \
               ▼       ▼       ▼
          [ APP ]  [ APP ]  [ APP ]
          SERVER   SERVER   SERVER
          (handles upload, feed,
           auth API requests)
            |              |
     write  |              | read feed
            ▼              ▼
     [ DATABASE ]    [ READ REPLICA ]
     (primary write)  (handles all
                       feed reads)
            |
            | on upload
            ▼
        [ QUEUE ]
     (holds thumbnail
      jobs safely)
            |
            ▼
       [ WORKER ]
     (pulls job from queue,
      creates thumbnail,
      saves to object storage)
            |
            ▼
   [ OBJECT STORAGE ]
   (stores all original
    photos + thumbnails)
            |
            ▼
         [ CDN ]
     (caches and delivers
      photos to users fast)



---

## 6. What Each Component Does

| Component | Problem It Solves |
|-----------|------------------|
| **CDN** | Serves photos from a server close to the user so images load fast anywhere in the world |
| **Load Balancer** | Spreads incoming requests across multiple app servers so no single server is overwhelmed |
| **App Servers** | Run the business logic — handle uploads, logins, feed generation and API responses |
| **Cache** | Stores popular feed results in memory so the database is not hit on every request |
| **Database (Primary)** | Stores all structured data — users, photo metadata, follows, likes |
| **Read Replica** | A copy of the database that handles all read queries so the primary database only handles writes |
| **Object Storage** | Stores the actual photo files and thumbnails cheaply at any scale |
| **Queue** | Receives thumbnail jobs from the app server and holds them safely until a worker is free |
| **Worker** | Picks jobs off the queue, generates the thumbnail and saves it to object storage |

---

## 7. Upload Flow — Step by Step

STEP 1 — User selects a photo on their phone
         and taps Upload

STEP 2 — Request hits the CDN
         CDN passes it to the Load Balancer
         CDN does not cache uploads, only reads

STEP 3 — Load Balancer sends the request
         to one of the App Servers

STEP 4 — App Server receives the photo file
         Uploads the original photo directly
         to Object Storage
         Gets back a file URL

STEP 5 — App Server saves the photo metadata
         to the Database (primary):
         { user_id, photo_url, timestamp, caption }

STEP 6 — App Server pushes a thumbnail job
         to the Queue:
         { photo_url, user_id }
         Then immediately responds to the user:
         "Upload successful!"
         User does not wait for thumbnail

STEP 7 — Worker picks the job from the Queue
         Downloads the original photo
         Resizes it to thumbnail (50 KB)
         Saves the thumbnail to Object Storage
         Updates the database row with
         the thumbnail URL

STEP 8 — Next time any follower opens their feed
         The App Server reads from the
         Read Replica + Cache
         Returns the thumbnail URL
         CDN delivers the thumbnail fast

---

## 8. Trade-offs

### Trade-off 1 — Eventual Consistency

CHOICE:
We respond "Upload successful" to the user
BEFORE the thumbnail is ready.

BENEFIT:
The user gets an instant response.
The app feels fast.

COST:
For a few seconds after uploading,
the thumbnail does not exist yet.
A follower opening their feed immediately
may see a placeholder until the worker finishes.

THIS IS ACCEPTABLE because a 2-3 second
delay on a thumbnail is invisible to
most users in practice.

### Trade-off 2 — Cache Staleness

CHOICE:
We cache feed results in memory
so we do not hit the database
on every feed request.

BENEFIT:
Feed loads extremely fast.
Database is protected from 3,860
requests per second at peak.

COST:
If a new photo is uploaded, followers
may not see it immediately.
They see the cached feed until
the cache expires (e.g. 60 seconds).

THIS IS ACCEPTABLE because social media
feeds do not need to be real-time to
the exact second.

### Trade-off 3 — Object Storage vs Self-Hosting Files

CHOICE:
We store photos in managed object storage
instead of our own servers.

BENEFIT:
Scales to 750 TB per year automatically.
No disk management needed.
Built-in redundancy — files never lost.

COST:
We pay per GB stored and per GB downloaded.
At 750 TB per year this cost is significant.
We do not fully control the infrastructure.

THIS IS ACCEPTABLE because building and
managing our own file servers at this
scale would cost far more in engineering
time and hardware.

---

## 9. Summary Table

| Metric | Value |
|--------|-------|
| Daily Active Users | 1,000,000 |
| Avg uploads/second | ~15 |
| Peak uploads/second | ~75 |
| Avg feed views/second | ~772 |
| Peak feed views/second | ~3,860 |
| Storage per day | ~2.05 TB |
| Storage per year | ~750 TB |
| System type | READ-HEAVY |