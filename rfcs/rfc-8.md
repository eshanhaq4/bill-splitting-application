# RFC-8: Receipt Upload & Storage

**Author:** Chris  
**Must be approved by:** Ade, Eshan

---

## Overview

This RFC defines how receipt images are uploaded, stored, and handed off to the Redis queue for background OCR processing. The goal is that the user never waits. The server responds immediately after storing the image and enqueuing the job.

---

## 1. Upload Flow

1. User uploads image via `POST /api/receipt/upload`
2. Server validates file (type, size)
3. Server stores image in Supabase Storage
4. Server enqueues OCR job in Redis with image path
5. Server immediately returns `job_id` to client
6. Client listens on WebSocket for `OCR_ITEM_PARSED` events

The server should never wait for OCR to complete before responding. If the user has to wait several seconds for the upload response, this requirement is not met.

Only the session leader may call this mutation. If a non-leader member calls it, return UNAUTHORIZED.

---

## 2. File Constraints

| Property | Value |
|----------|-------|
| Accepted formats | Any image format (JPEG, PNG, etc) |
| Max file size | 10MB |
| Content-Type header | Must start with `image/` |

If the file exceeds 10MB or is not an image, the server returns:
```json
{
  "success": false,
  "error_code": "INVALID_FILE",
  "message": "File must be an image under 10MB."
}
```

---

## 3. Supabase Storage

- Images are stored in a Supabase Storage bucket named `receipts`
- File path format: `receipts/{session_id}/{job_id}.{ext}`
- The stored file path is passed to the Redis job so the OCR worker knows where to find the image
- Files do not need to be deleted after processing for the scope of this project

---

## 4. Redis Job Handoff

Once the image is stored, the server pushes a job onto the Redis queue with the following shape:

```json
{
  "job_id": "job-uuid",
  "session_id": "abc123",
  "uploader_id": "user-uuid",
  "image_path": "receipts/abc123/job-uuid.jpg",
  "created_at": "2026-03-06T14:00:00Z"
}
```

The OCR worker picks this job up and processes it asynchronously.

---

## 5. Immediate Server Response

The server responds immediately after enqueuing the job, before OCR starts:

```json
{
  "success": true,
  "job_id": "job-uuid",
  "message": "Receipt upload received. Processing in background."
}
```

The client then listens for `OCR_ITEM_PARSED` WebSocket events to display items as they are parsed.

---

## 6. Failure Scenarios

| Scenario | Behavior |
|----------|----------|
| Supabase Storage upload fails | Return `500` with `STORAGE_ERROR`, do not enqueue job |
| Redis enqueue fails | Return `500` with `QUEUE_ERROR`, delete the uploaded image |
| File is too large or wrong type | Return `400` with `INVALID_FILE` before attempting storage |