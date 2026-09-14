# Bill Splitting Application

A real-time collaborative web application for splitting restaurant bills. Users can create or join a shared session, upload a receipt, claim items together, and automatically calculate each person's share of tax and tip.

## Features

- Create shared bill-splitting sessions with join links and QR codes
- Upload and parse receipt images using OCR
- Claim and release items collaboratively in real time
- Synchronize session updates through WebSockets
- Automatically calculate proportional tax and tip for each participant
- Use a Lite Agent to claim compatible items for disconnected users based on dietary preferences
- Persist sessions, members, items, and claims across the application

## Tech Stack

**Frontend:** Next.js, React, TypeScript, Tailwind CSS  
**Backend:** Java, Spring Boot, GraphQL, WebSockets  
**Data & Infrastructure:** PostgreSQL, Redis, Supabase, Tesseract OCR

## Architecture

The application uses a Next.js frontend backed by a Spring Boot GraphQL API. Receipt uploads are processed asynchronously through Redis, while WebSocket events keep item claims and session state synchronized between participants in real time.

The Lite Agent reacts to user disconnects and can automatically claim compatible items on their behalf according to stored dietary preferences.
