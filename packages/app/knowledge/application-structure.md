# Application structure development

Rework current implementation to provide the following application structure and user flows.

## First Screen as a Landing Page

Index page should serve as a landing page with the following features:

- sign-in form for existing users, contains email only. If user email belongs to fastmail.com, 3f.lu or easybiz.lu domains, they allowed to pass through without further verification. Otherwise shows the message the system is in private beta and ask if user want to request an invite as soon as possible.
- typical landing page features: hero section, features overview, about us, contact form, footer with links to privacy policy and terms of service. See the content section for copy text. Use React Lucide icons and Lora typeface for visual enhancement.

## Application Screens

Available for users with emails from allowed domains. (We will introduce real authentication later.)

### Section navigation on the left side

Left panel (sidebar) with navigation links to the following sections:

- Inbox: scenario focused on document intake queue management. Operator watches incoming documents, reviews them, approves or rejects them.
- Documents: scenario focused on document repository management. Operator can search, filter, view, edit metadata, and delete documents.
- Clients: scenario focused on client management. Operator should pickup client and view associated documents.
- Inspections: group of availabe inspections
  - VAT: view and manage VAT inspections
  - Renewal: view and manage Renewal inspections
- Settings: group for application configuration
  - Users: manage application users and permissions
  - Integrations: manage third-party integrations (e.g., cloud storage, email services)
- Audit Log: view system activity logs for security and compliance

## Landing Page Content

### HERO SECTION

Headline: Stop filing documents manually. Start processing them automatically.

Subheadline: Fidudoc organizes client documents from email, portals, and chat into your firm's folder structure—no manual sorting required.
CTA: Request early access (form to ask email and company name) [Request access]

### PROBLEM

(short bulleted list with icons)

Every document creates work:

- Emails, portals, chats—documents arrive from everywhere
- Manual classification takes hours each day
- Critical files get lost in folder chaos

### SOLUTION

Automatic document intake and organization

Fidudoc connects to your document sources, classifies incoming files, extracts key metadata, and routes them to the right folders following your firm's taxonomy.

Built for fiduciary and accounting firms handling hundreds of client documents monthly.

### HOW IT WORKS (3 steps with icons)

1. Connect your sources
   Email, Google Drive, OneDrive, client portals
2. Documents get classified
   Invoices, contracts, KYC, filings—automatically recognized and tagged
3. Everything lands in the right place
   Organized by client, type, and date in your existing folder structure

### CLOSING CTA

Early access starting Q4 2025
Fidudoc is currently in pilot with select European fiduciary firms.
[Request access]
