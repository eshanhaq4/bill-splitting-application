# RFC-2: Redis Queue & OCR Worker

**Author:** Eshan
**Must be approved by:** Chris, Joanna

---

## Overview

This RFC defines the Redis job queue and background OCR worker responsible for processing uploaded receipt images. The server stores a receipt image, enqueues an OCR job in Redis, and immediately returns a response to the client. A background worker consumes the job, runs OCR on the image, parses line items, persists them to the database, and streams the items to the client with the OCR_ITEM_PARSED WebSocket event.

## 1. Redis Job Queue

Receipt OCR jobs are stored in Redis.

**Queue name:** receipt_ocr_jobs

**Job shape:** 
{
"job_id": "job-uuid",
"session_id": "abc123",
"uploader_id": "user-uuid",
"image_path": "receipts/abc123/job-uuid.jpg",
"created_at": "2026-03-06T14:00:00Z"
}

Workers consume jobs using a Redis blocking operation, so they sleep when no jobs are available, and multiple workers can run simultaneously to process jobs in parallel.

## 2. Worker Lifecycle

The OCR worker runs as a background process independent of the main server.

**Processing flow:**

1. Worker waits for a job in Redis
2. Worker retrieves the job payload
3. Worker downloads the receipt image from Supabase
4. Worker runs OCR using Tesseract
5. Extracted text is segmented into lines
6. Lines are parsed into structured bill items
7. Each parsed item is persisted to the database
8. Every item triggers a WebSocket event for the client

Redis ensures that each job is processed by only one worker.

## 3. OCR Processing

OCR is performed using Tesseract.

Processing pipeline: receipt image -> OCR text extraction -> line segmentation -> item parsing

**Example:** If the receipt line is: Burger 15.00

The parsed item is:

name: "Burger"
price: 15.00
category: "food"

Parsed items must match the structure used by the Item GraphQL type defined in RFC-1, which includes the item’s id, name, price, and category. Each parsed item is inserted into the Item table before emitting the event.

## 4. Streaming Parsed Items

After each item is persisted, the worker emits the following WebSocket event defined in RFC-1:

**OCR_ITEM_PARSED**

**Payload:**

{
  "event": "OCR_ITEM_PARSED",
  "item": {
    "id": "item-uuid",
    "name": "Burger",
    "price": 15.00,
    "category": "meat",
  }
}

This allows the frontend to stream receipt items live as they are parsed.

## 5. Failure Handling

**Error codes:**

| Scenario | Behavior |
|------|---------|
| `OCR cannot parse receipt` | Worker marks receipt as failed and logs an error |
| `Image download fails` | The job fails and is retried |
| `Worker crashes` | Job remains in Redis and will be processed by another worker |

After repeated failures, with the maximum number of retries being 3, the receipt status is marked as failed.

## Out of Scope

- Advanced OCR accuracy
- Manual correction of OCR errors
- Item similarity matching (future RFC)
