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

- Documents (group of document-related scenarios):
  - Inbox: scenario focused on document intake queue management. Operator watches incoming documents that require attention: review, approval or manual correction of metadata. Access only on newly arrived documents.
  - Registry: scenario focused on document repository management. Operator can search, filter, view, edit metadata, and delete documents. Access to all registered documents, including on inbox stage.

- Clients (group of client-related scenarios):
  - Clients: scenario focused on client management. Operator should pickup client and view associated documents.

- Inspections: group of available automated inspections
  - VAT: view and manage VAT inspections
  - Renewal: view and manage Renewal inspections

- Settings: group for application configuration
  - Users: manage application users and permissions
  - Integrations: manage third-party integrations (e.g., cloud storage, email services)

- Audit: view system activity logs for security and compliance
  - Audit Log: view system activity logs for security and compliance

**RULE** No collapsible menus. All sections always visible. Treat group names as semantic labels only.

## Landing Page Content

### HERO SECTION

Headline: Intelligent document operations for European fiduciaries

Fidudoc organizes, validates, and manages client documents automatically—so your team can focus on advisory and compliance work.

CTA: Request early access (form to ask email and company name) [Request access]

### PROBLEM

(short bulleted list with icons)

Every document creates work:

- Files arrive from everywhere—email, portals, chat
- Manual classification and validation takes hours daily
- Critical information gets buried in folder structures
- Compliance checks happen too late

### SOLUTION

Automatic document intake and organization

Fidudoc handles the full document lifecycle: automatic classification, metadata extraction, compliance validation, and smart organization following your firm's taxonomy.

Whether it's VAT invoices, lease contracts, or KYC packs—documents flow through validation workflows and land in the right place with key data already extracted.

Built for fiduciary and accounting firms handling hundreds of client documents monthly.

### HOW IT WORKS (3 steps with icons)

1. Connect your sources
   Email, Google Drive, OneDrive, client portals
2. Documents get classified
   Invoices, contracts, KYC, filings—automatically recognized and tagged
3. Everything lands in the right place
   Organized by client, type, and date in your existing folder structure

### BUILT ON A SIMPLE PRINCIPLE

1. Software handles repetitive tasks faster than humans.
2. Humans handle complex decisions better than software.
3. Fidudoc automates document intake so your team focuses on advisory, compliance, and client relationships—not filing.

### CLOSING CTA

Fidudoc is currently in pilot with select European fiduciary firms.
[Request access]
