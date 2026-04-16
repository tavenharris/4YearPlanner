# Classes API Documentation

This project includes a serverless API hosted on Vercel to access class information stored in Supabase. The API is located in the `api/` directory at the root of the project and is automatically deployed when hosting the project on Vercel.

## Endpoints

### 1. Get All Classes

Retrieves a list of all available class IDs.

- **URL:** `/api/classes`
- **Method:** `GET`
- **Response Format:** JSON

**Success Response (200 OK):**
```json
{
  "classes": [
    "CSCI101",
    "MATH201",
    "PHYS101"
  ]
}
```

### 2. Get Class Details

Retrieves detailed information for a specific class ID.

- **URL:** `/api/classes/:id`
- **Method:** `GET`
- **URL Parameters:**
  - `id=[string]` where `id` is the class identifier (e.g., `CSCI101`). The API automatically converts the ID to uppercase for database lookup.
- **Response Format:** JSON

Example: `/api/classes/MATH11`

**Success Response (200 OK):**
```json
{
  "id": "CSCI101",
  "data": {
    "title": "Introduction to Computer Science",
    "credits": 4,
    "description": "...",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing class ID parameter.
- `404 Not Found`: Class with the specified ID does not exist in the database.
- `500 Internal Server Error`: Server encountered an error, such as missing Supabase credentials or database connection issues.

## Setup and Environment Variables

The API requires the following environment variables to connect to your Supabase project. Ensure these are set in your local `.env` file for local development, and in your Vercel Project Settings for production.

- `REACT_APP_SUPABASE_URL` or `SUPABASE_URL`: Your Supabase project URL.
- `REACT_APP_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`: Your Supabase anonymous API key.

## Local Development

To test the API locally, you can use the Vercel CLI. This will start your React app and the serverless functions together.

```bash
npx vercel dev
```

Your API endpoints will then be accessible at `http://localhost:3000/api/classes` and `http://localhost:3000/api/classes/CSCI101` (or whichever port Vercel assigns).
