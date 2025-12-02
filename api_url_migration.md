# Backend API Migration: URL Structure Update

## 🚨 Action Required

This document outlines a critical change to the API's base URL structure. The backend routing and any services that generate absolute URLs (e.g., file uploads, email links) must be updated to reflect this new standard.

## 1. URL Structure Change

The API endpoint structure has been migrated to a versioned path on the main domain, removing the non-standard port.

### Old URL Structure
- **Base Path:** `https://api.eventsta.com:8181/eventsta`
- **Example:** `https://api.eventsta.com:8181/eventsta/events/some-event-id`

### New URL Structure
- **Base Path:** `https://eventsta.com/api/v1`
- **Example:** `https://eventsta.com/api/v1/events/some-event-id`

## 2. Required Server-Side Changes

### a. API Gateway / Router Configuration
- The primary API router or gateway must be reconfigured to listen on the path `/api/v1` on the `eventsta.com` domain.
- Inbound traffic on port `8181` can be deprecated and eventually removed.
- Ensure your reverse proxy (e.g., Nginx, Apache) correctly routes requests from `https://eventsta.com/api/v1/*` to the application server.

### b. Absolute URL Generation
Any part of the backend that generates and returns a full, absolute URL must be updated. This is especially important for:

- **File Uploads (`/upload`):** The response from the file upload endpoint **must** return the complete, publicly accessible URL of the uploaded file, reflecting the new domain structure.
    - **Old Response (Incorrect):** `{ "url": "/uploads/image.jpg" }` or `{ "url": "https://api.eventsta.com/uploads/image.jpg" }`
    - **New Response (Correct):** `{ "url": "https://eventsta.com/uploads/image.jpg" }` (Assuming `/uploads` is the correct public path for assets).
        
- **Email Templates:** Any links in transactional or marketing emails (e.g., password reset links, "View Ticket" buttons) must be generated using the new base URL `https://eventsta.com`.

### c. CORS Configuration
- The `Access-Control-Allow-Origin` header must be updated to allow requests from the frontend's origin if it has changed.
- Ensure `OPTIONS` pre-flight requests are handled correctly for the new `/api/v1` path.

## Summary
All frontend requests will now target `https://eventsta.com/api/v1`. The backend must be updated to serve all API routes from this new base path.
