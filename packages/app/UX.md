# Color scheme

**Description:** A grounded and supportive theme using an organic green for key elements on a clean, neutral background.

**Emotion:** Optimistic, fresh, calm, restorative.

**Story:** This scheme says, "This is a space for positive change and new beginnings." It directly ties into the idea of **self-discovery** and career growth.

**Color Palettes:**

Basic colors are following. Application may require more variations and specific shades or accents. The general rule is to keep the palette minimal and focused on the core colors.

- **Light Mode:**
  - #f9fafb
  - #15803d
  - #ffffff
  - #14532d
  - #6b7280
- **Dark Mode:**
  - #111827
  - #22c55e
  - #1f2937
  - #bbf7d0
  - #9ca3af

# Typography

The typographic scale uses two primary font families to create a clear hierarchy and add personality.

- **Sans-serif:** **Inter** is used for all UI elements, body copy, and interactive text for its excellent readability.
- **Serif:** **Lora** is used for major headings on landing page to provide a touch of elegance and character.

### Typographic Scale

Base font size must be reset to 14px for better readability. Then the following scale is applied:

| Tailwind Class  | Font Size (rem/px) | Line Height (rem) | Usage Examples                          |
| --------------- | ------------------ | ----------------- | --------------------------------------- |
| `text-display`  | `2.5rem` / 40px    | `3rem`            | Main page titles (`Career Overview`)    |
| `text-headline` | `1.5rem` / 24px    | `2rem`            | Section headings, question text         |
| `text-body-lg`  | `1.125rem` / 18px  | `1.75rem`         | Main body text, text area content       |
| `text-body`     | `1rem` / 16px      | `1.5rem`          | Standard body text (not currently used) |
| `text-body-sm`  | `0.875rem` / 14px  | `1.25rem`         | Helper text, footer links               |
| `text-caption`  | `0.75rem` / 12px   | `1rem`            | Smallest text (not currently used)      |

Implementation notes: use variable fonts which are a single font file that contains multiple “styles” or “weights” (and even widths, slants, optical sizes, etc.) in one package, e.g. In tables use monospaced digits of Inter.

Load Inter from the official **Inter CDN** (`rsms.me`)

```html
<link rel="preconnect" href="https://rsms.me/">
<link rel="stylesheet" href="https://rsms.me/inter/inter.css">
```

# Layout System Overview

The application uses a multi-panel adaptive workspace, not a rigid 3-pane shell.
Panels appear or hide depending on context.

## Core Regions

Header: Global controls — navigation, search, language, account, system status
Sidebar (Left): Contextual navigation: Inbox · Exceptions · Inspections · Settings · Admin
Main Content Area: Primary view (tables, dashboards, editors)
Right Panel: Contextual detail — preview, extracted data, JSON editors
Bottom Panel (Footer): Status feed, task progress, background jobs, connected source indicators, version info

Panels are resizable and collapsible.

Default layout: Header + Left Sidebar + Main + Optional Right Panel + Footer

# Global UI Patterns

- Light/dark modes (auto-detect browser setting)
- Hotkeys:
  - / → search bar
  - ⌘+U → upload modal
- Toasts: top-right for async feedback
- Audit indicator: show who last touched a record in row tooltip

# Screen Specifications

## Inbox / Queues

Route: /
Goal: review and approve documents.

Layout: Sidebar (navigation) · Main Table · Right Preview Panel

Main Table Columns:

- doc Id
- file name
- file type (pdf, txt, image, etc)
- size (in KB/MB)
- received date time (ingestedAt)
- status (new, classifying, accepted, inspecting, processed, rejected)
- document type (invoice, receipt, contract, lease, tax return, unknown)
- client (name + id chip)
- storage location (S3 bucket/folder)
- updated date time

Toolbar

- Upload (opens modal)
- Approve Selected
- Reject Selected
- Defer Selected (snooze to tomorrow)
- Save Metadata (enabled when inline edits pending)
- Filter Menu (status/type/date)
- Search by client or file name

Right Panel

- Document preview (GET /documents/:id/preview)
- Extracted data tab
- Raw JSON tab
- Metadata tab with editable fields
  - Document type (select from enum, defaults to extracted value)
  - Client (search + assign, optional)
  - Storage destination (path selector with auto-suggest)
  - Tags and notes (chips + free text)
- Activity tab: approval history, ingestion source, workflow events

Interactions

- Row click → opens right panel.
- Rows with `accepted` status display an amber badge (“Needs review”) until operator approves or rejects.
- Rows with `processed` status are subdued; `rejected` rows show a red badge with tooltip reason from audit log.
- Keyboard nav with arrows + Enter.
- Multi-select → bulk approve/reject/defer.
- Inline status chips update as workflow progresses (websocket/polling every 10s).
- Unsaved metadata edits show pill “Unsaved changes” in toolbar; Save commits via `PUT /documents/:id` (metadata only).

### Automated Outcomes After Inspection

- Unsupported or corrupted files (executables, videos, unreadable PDFs) are auto-rejected during the inspection workflow; workflow status jumps to `rejected` and the audit log records the automated decision (reason: “Unsupported file” or “Corrupted file”).
- If document type is confidently determined (`confidence >= minConfidence`) **and** auto-approval is enabled for that document type, the workflow transitions the document from `classifying` → `processed` without pausing for operator review; the audit log entry notes “Auto-approved via ruleset”.
- All other documents move from `classifying` → `accepted` with an audit log note “Manual approval required”. Operators review metadata, adjust fields if needed, and trigger manual approval. When metadata violates required rules, the metadata tab surfaces the validation errors; once resolved, approval moves the status to `processed` and records the action in the audit log. Manual rejection sets status to `rejected`.

### Document Detail Drawer

Structure

- Header: file name, status chip, confidence meter.
- Tabs: Preview · Extracted Data · Metadata · Activity (default tab respects workflow status, e.g., `accepted` opens Metadata).

Metadata Tab Behavior

- Editable fields inline with validation messages; required fields gated (document type, client if routing rules demand).
- “Apply & return” button saves metadata (`PUT /documents/:id`) without approving.
- “Save & Approve” runs metadata save then calls `POST /documents/approve`.
- Changes tracked per field; unsaved fields highlighted.

Activity Tab

- Timeline showing ingestion, auto-classification, edits, approvals (from `/audit-log` filtered to document).
- Links to the user who performed last action.

### Approval Actions

- **Single Approve:** From toolbar or drawer; requires resolved validation warnings.
- **Approve with Edit:** Operator can adjust metadata, hit “Save & Approve”, system writes metadata then bulk-approves.
- **Reject:** Opens modal requesting reason (`POST /documents/reject`), optional tag (e.g., “Re-upload required”).
- **Defer:** Keeps status `accepted` but adds a `snoozedUntil` timestamp (visible on hover). Snoozed items hide from the default queue until the reminder elapses—useful when waiting on client clarification.

Bulk actions respect mixed states: documents with unresolved validation errors are skipped with a tooltip explaining why.

## Upload Modal (Manual Intake)

Trigger: Header “Upload” button or Inbox toolbar.
Fields:

- Files (drop zone, multi)
- Client (optional)
- Tags
- Source note (“USB”, “email”)

Action: POST /uploads mock

Result: toast + “Recently Uploaded” filter chip appears in Inbox.

## Settings Screen

Route: /settings

Layout: Main JSON editor in center panel, live validation footer.

Header actions: Save · Revert · Apply.

Editor behavior:

- Syntax highlighting, auto-lint on save
- Diff preview when unsaved changes
- Read-only audit block in footer (“Last updated by X at Y”)

## Admin / Audit

Route: /admin
Tabs: Users · Audit Log
Users: CRUD table (/users)
Audit: Filter by user/action/resource.
Right panel: detail view of details JSON.
