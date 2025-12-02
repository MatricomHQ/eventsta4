
# Backend API Changes Required: Host Image Handling

## Overview
The frontend has been updated to upload Host profile images and cover images to the file server first, and then send the resulting URL to the API. 

Previously, the frontend might have been sending Base64 strings. This change ensures better performance and smaller database payloads.

## Required Changes

### 1. Database Schema
Ensure the `hosts` table columns for images are standard `VARCHAR` or `TEXT` fields capable of storing URLs.
*   `image_url` (or `imageUrl`)
*   `cover_image_url` (or `coverImageUrl`)

**Do not** use `BLOB` or binary types for these fields if you are storing the URL.

### 2. Update Endpoint (`PATCH /hosts/:id`)
The endpoint must accept standard string URLs for the image fields.

**Payload Example:**
```json
{
  "name": "My Host Name",
  "description": "...",
  "imageUrl": "https://api.eventsta.com/uploads/profile_123.jpg", 
  "coverImageUrl": "https://api.eventsta.com/uploads/cover_456.jpg",
  "reviewsEnabled": true
}
```

**Validation Logic:**
*   If your backend currently validates for Base64 format on these fields, **remove that validation**.
*   Accept valid URL strings.
*   Sanitize inputs to prevent XSS (standard practice).

### 3. File Upload Endpoint (`POST /upload`)
Ensure the existing `/upload` endpoint (used for Event images) is accessible to authenticated users for Host image uploads as well. No specific change is likely needed here if it's already generic.
