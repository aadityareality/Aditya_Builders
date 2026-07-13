# PHASE 2: AUTOMATED SALES ASSISTANT INTEGRATION DOCUMENTATION

This document maps out the implementation details, database models, cron intervals, state machine definitions, and validation checks completed in Phase 2.

---

## 1. Database Model Schema Extensions

### Projects (`models/Project.js`)
- Added `availableUnits` (Number, default `0`) to track inventory dynamically.

### Customers / Leads (`models/Customer.js`)
- **Single Source of Truth**: Unified leads and customers.
- Added `stage` field: `enum: ["New", "Engaged", "Site Visit Booked", "Negotiation", "Closed"], default: "New"`.
- Added `leadScore` field: increments by +1 for every meaningful incoming chatbot text.
- Added `source` field: set to `"WhatsApp"` for chatbot-originating leads.
- Added smart follow-up tracking booleans: `followUp24hSent`, `followUp3daySent`, and `followUp7daySent`.

### Callback Requests (`models/CallbackRequest.js`)
- Added `reason` (String, default `""`) to log client inquiry reason details.

### Site Visit Appointments (`models/Appointment.js`)
- Added `customerEmail` (String, default `""`) to capture email addresses during booking.
- Added `h2` boolean flag under `remindersSent` to track the 2-hour reminder dispatch.

### Inquiry Question Logs (`models/InquiryQuestionLog.js` - [NEW])
- Created lightweight schema to log user queries matching target keywords: `phone`, `question`, `project` (Ref Project), `projectName`, `keywords`, and `timestamp`.

---

## 2. Conversation State Flow Router

We mapped out conversational flows in `ConversationState`:
- **`project_list_new`**: Dynamic listing of Ongoing/Upcoming active projects.
- **`project_list_possession`**: Dynamic listing of Completed active projects.
- **`project_detail`**: Renders project card (Locality, configuration, pricing, cover image, and RERA number) followed by options to book visit, download brochure, contact sales, or return back.
- **`brochure_followup`**: Prompts the user "Would you like to book a site visit? YES / NO" after downloading a brochure.
- **`contact_sales`**: Renders dynamic team contact detail and prompts "Would you like us to call you? YES / NO".
- **`callback_request`**: 4-step step-by-step query (Name -> Phone -> Preferred Time -> Reason).
- **`site_visit_booking`**: 9-step appointment workflow (Name -> Phone -> Email -> Project Catalog Choice -> Preferred Date -> Time -> Visitors -> Notes -> Final Confirmation).

---

## 3. Background Services & Consolidated Scheduler

In `services/reminderService.js`:
- **Periodic Checks**: Combined cron jobs into a single routine running every 15 minutes.
- **Site Visit Reminders**: Triggers at:
  - 24 hours before (Tomorrow)
  - 2 hours before (In 2 hours)
  - 30 minutes before (In 30 minutes)
- **Smart Follow-ups**: Scans for inactive contacts and sends:
  - After 24h: Free-form checklist text check.
  - After 3d: Meta-approved `followup_3day` template.
  - After 7d: Meta-approved `followup_7day` template.

---

## 4. Input Validations & Security Rules

- **Future Dates**: Prevents scheduling visits for past dates. Parses dates cleanly in `DD/MM/YYYY` format.
- **Email Formats**: Regex validates standard email format inputs before moving steps.
- **Phone Numbers**: 10-digit number length checks.
- **Duplicate Appointments**: Queries database to check if an active appointment with the same phone + project + date + time already exists before registering.
