# Library Books API Design

A simple REST API for managing books in a library.

## Endpoints

### 1. List all books
- **Method:** `GET`
- **Path:** `/books`
- **Description:** Returns a list of all books in the library.
- **Success status code:** `200 OK`

### 2. Get one book
- **Method:** `GET`
- **Path:** `/books/:id`
- **Description:** Returns a single book by its ID.
- **Success status code:** `200 OK`

### 3. Create a new book
- **Method:** `POST`
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**
  ```json
  {
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "year": 1937,
    "isbn": "978-0547928227"
  }