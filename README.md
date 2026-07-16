# CORE Portal (XXC-399) - IIT Roorkee

The CORE Portal is a serverless web application designed to manage the data pipeline for IIT Roorkee's Community Outreach (CORE) course (Senate Item No. 105.9). It facilitates student team registration, faculty field-work proposals, and secure cloud storage for final digital assets.

## Architecture

This project is built using a modern, serverless architecture that separates the frontend UI from the backend data services:

- **Frontend:** Vanilla HTML5, JavaScript, and Tailwind CSS (styled to replicate `shadcn/ui` enterprise aesthetics without the React overhead).
- **Backend / APIs:** Vercel Serverless Functions (Node.js).
- **Database:** MongoDB (NoSQL document storage for structured JSON compliance).
- **Object Storage:** Supabase (for handling large PDF/ZIP file uploads, bypassing serverless payload bottlenecks).

## Core Modules

1. **Team Registration (`register-team.html` / `api/register-team.js`)**
   - Validates student roll numbers against the database.
   - Prevents duplicate registrations.
   - Maps 4 students to 3 distinct project preferences, generating a unique `TEAM-XXXX` ID.

2. **Project Intake (`project-intake.html` / `api/submit-project.js`)**
   - Dynamic form adjusting fields for IITR Faculty vs. external NGOs/SHGs.
   - Includes a locked dropdown for standard IIT Roorkee Departments, Schools, and Centres.
   - Validates geographical radius constraints (100km rule).
   - Generates a unique `CORE-XXXX` ID.

3. **Asset Management (`submit-report.html` / `api/submit-report.js`)**
   - securely captures student deliverables (PDF, Images, ZIP).
   - Base64 encodes files on the frontend to pass through Vercel's API limits (4MB).
   - Utilizes Supabase Service Role Keys to bypass Row-Level Security (RLS) for direct bucket insertion.
   - Saves the returned public URL to the assigned team's document in MongoDB.

4. **Admin Dashboard (`admin-dashboard.html` / `api/admin-dashboard.js`)**
   - A unified viewing console fetching live data from MongoDB.
   - Cross-references student groups and approved projects.
   - Provides direct, one-click access to Supabase-hosted field reports.

## Setup & Deployment Instructions

### 1. Database Provisioning
1. Set up a MongoDB cluster.
2. Create a database named `community_service`.
3. Create three collections: `users` (pre-populated with eligible student roll numbers), `teams`, and `projects`.

### 2. Object Storage Provisioning
1. Set up a Supabase project.
2. Create a public storage bucket named `reports`.

### 3. Vercel Deployment
Deploy this repository directly to Vercel. You must configure the following **Environment Variables** in your Vercel project settings for the APIs to function:

- `MONGODB_URI` - The connection string for your MongoDB cluster (e.g., `mongodb+srv://<username>:<password>@cluster.mongodb.net/`).
- `SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxxx.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` - The bypass-RLS admin key (Found in Supabase -> Settings -> API). Do **not** use the `anon` key.

## Maintenance Notes
- **File Upload Limits:** Due to Vercel's Serverless Function payload limits on the Hobby tier, uploads via the standard pipeline are capped at 4MB. 
- **Modifying Departments:** If new Schools or Centres are added to IIT Roorkee, update the `<optgroup>` lists inside `project-intake.html` accordingly.

---
*An initiative by Academic Outreach and Community Connect - IIT Roorkee (2026)*