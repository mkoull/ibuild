# iBuild QA Checklist

Manual regression checklist. Run through before each release.

## Setup

- [ ] `npm run build` passes with 0 errors
- [ ] No console errors on any page
- [ ] App loads on fresh browser (no localStorage)

## Clients

- [ ] Create client with display name + company
- [ ] Edit client details
- [ ] Client appears in client list
- [ ] Client searchable from TopBar

## Trades

- [ ] Create trade manually
- [ ] Seed sample trades from Dashboard onboarding (if no trades exist)
- [ ] Edit trade details
- [ ] Delete trade

## Quote Flow

- [ ] Create new project (from TopBar + or Quotes page)
- [ ] Assign client on Details step
- [ ] Add scope line items (toggle on, set qty)
- [ ] Add custom line item
- [ ] Add new category
- [ ] Edit margin % and contingency %
- [ ] Review step shows correct totals
- [ ] No focus loss when typing in any input

## Proposals

- [ ] Generate proposal from Review step
- [ ] Proposal detail shows correct scope + pricing
- [ ] Print/Save as PDF works (opens print dialog)
- [ ] Company name/logo/ABN from Settings appear on proposal
- [ ] Set proposal status: draft → sent → signed
- [ ] Client signature capture works
- [ ] Delete proposal

## Stage Transitions

- [ ] Send Quote (stage → Quoted)
- [ ] Accept Quote → convert to Job (stage → Approved)
- [ ] Conversion works from Overview CTA
- [ ] Conversion works from JobModuleGate CTA
- [ ] Job modules unlock after conversion (Costs, Schedule, Invoices, Bills, Variations, Site Diary, Defects, Trades)
- [ ] Refresh page — job stage persists
- [ ] Activity log records stage change

## Schedule

- [ ] Schedule page loads for Job
- [ ] Set start date → regenerate dates
- [ ] Mark milestones done
- [ ] Client view is clean (hides internal notes)

## Costs

- [ ] Add budget line
- [ ] Add commitment (PO)
- [ ] Add actual cost
- [ ] Trade breakdown shows correct totals
- [ ] Cost code view shows correct aggregation
- [ ] Report tab shows job cost summary
- [ ] CSV download works
- [ ] Commitment remaining updates when matched to bill

## Invoices

- [ ] Create progress claim → generate invoice
- [ ] Invoice detail shows correct amounts
- [ ] Print invoice — company details from Settings appear
- [ ] Mark invoice sent → paid
- [ ] Paid invoice creates actual in Costs
- [ ] Void invoice reverses actual

## Supplier Bills

- [ ] Create supplier bill with line items
- [ ] Match bill line to commitment (PO)
- [ ] Over-match warning appears with override option
- [ ] Remaining on commitment updates
- [ ] Approve → Pay bill
- [ ] Paid bill creates actuals (source="Bill")
- [ ] Void bill removes actuals
- [ ] Refresh — all bill data persists

## Variations

- [ ] Create variation order
- [ ] Approve variation → updates contract value

## Site Diary

- [ ] Add diary entry with weather + notes
- [ ] Entry persists across refresh

## Defects

- [ ] Add defect
- [ ] Mark defect resolved

## Dashboard

- [ ] KPIs update correctly (pipeline, active, receivables)
- [ ] Needs Attention items link to correct project
- [ ] Projects table shows all projects with stage badges
- [ ] First-run checklist appears when no clients/trades/projects
- [ ] Checklist items check off as data is added

## Settings

- [ ] Company name, ABN, email, phone, address save correctly
- [ ] Logo upload (under 500KB) displays
- [ ] Logo appears on proposals and invoices
- [ ] Default margin/contingency/validity/payment terms save
- [ ] Defaults apply to newly created projects
- [ ] Export backup downloads JSON
- [ ] Import backup restores data

## Navigation

- [ ] All sidebar items lead to working pages
- [ ] Mobile bottom tabs navigate correctly
- [ ] TopBar project switcher works
- [ ] TopBar search finds projects and clients
- [ ] No dead buttons or broken links

## Data Persistence

- [ ] Full refresh preserves all data
- [ ] Multiple projects can coexist
- [ ] Export → clear localStorage → import → data restored

## Performance (Data Layer)

- [ ] Normalized store: projects saved as `{ __v: 2, data: { byId, allIds } }` in localStorage
- [ ] Legacy array format auto-migrates to normalized on load
- [ ] 50+ projects do not lag Dashboard or list pages
- [ ] Quote editing does not cause global flicker (Sidebar/TopBar stay stable)
- [ ] No focus loss in forms during editing
- [ ] `selectCalc` WeakMap cache avoids recalculating unchanged projects
- [ ] Dev seed utility: `window.__SEED_100_PROJECTS__()` generates test data (dev only)
