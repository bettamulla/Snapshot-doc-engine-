# Snapshot Doc Engine — Design Philosophy

## Chosen Approach: Operational Clarity

**Design Movement:** Minimalist Audit Aesthetic + Professional Operational Design

**Core Principles:**
1. **Functional Minimalism** — Every UI element serves a direct operational purpose; no decorative elements
2. **Hierarchical Clarity** — Information architecture prioritizes input validation, real-time feedback, and deterministic output
3. **Audit-Grade Polish** — Premium typography and spacing convey institutional credibility and precision
4. **Neutral Operational Tone** — Visual language mirrors the writing engine: neutral, traceable, deterministic

**Color Philosophy:**
- **Primary Accent:** Deep purple (`#6B5B95` / `oklch(0.48 0.15 280)`) — conveys authority, precision, and operational rigor
- **Background:** Clean white (`oklch(1 0 0)`) — ensures maximum readability and professional appearance
- **Text:** Charcoal (`oklch(0.235 0.015 65)`) — high contrast, reduces eye strain during data entry
- **Borders & Dividers:** Soft gray (`oklch(0.92 0.004 286)`) — subtle structure without visual noise
- **Status Indicators:** Semantic colors (red for critical, amber for exposed, green for contained/optimised)

**Layout Paradigm:**
- **Two-Column Asymmetric Layout:** Left column for inputs (form + paste boxes), right column for live preview/status
- **Vertical Information Flow:** Inputs stack naturally; outputs follow deterministic order
- **Breathing Room:** Generous padding and spacing between sections; no cramped forms
- **Modular Card System:** Each input section is a distinct card with clear visual boundaries

**Signature Elements:**
1. **Validation Badges** — Real-time parsing feedback with inline error states
2. **Status Indicator Dots** — Color-coded dots showing parse status (pending, valid, error)
3. **Audit Report Preview** — Live preview of key metrics (score, status, exposure %) updates as user inputs data

**Interaction Philosophy:**
- **Immediate Feedback:** Parse validation happens as user pastes; no "submit" button required
- **Progressive Disclosure:** Optional fields (simulation, drivers) are clearly marked; users can skip without friction
- **Error Prevention:** Strict format requirements are communicated upfront; invalid blocks show specific missing headers
- **One-Click Export:** Generate PDF button is always visible and prominent once inputs are valid

**Animation:**
- **Entrance Animations:** Subtle fade-in for cards and sections (200ms, ease-out)
- **Validation Feedback:** Smooth color transitions when parse status changes (300ms)
- **Micro-interactions:** Gentle hover effects on interactive elements (buttons, cards)
- **No Distracting Motion:** Animations serve functional clarity, not decoration

**Typography System:**
- **Display Font:** `Geist` (geometric, modern, professional) — used for page titles and section headers
- **Body Font:** `Inter` (highly readable, neutral) — used for form labels, input text, and body copy
- **Hierarchy:**
  - H1: 32px, 700 weight, Geist (page title)
  - H2: 20px, 600 weight, Geist (section headers)
  - H3: 16px, 600 weight, Inter (card titles)
  - Body: 14px, 400 weight, Inter (form labels, descriptions)
  - Small: 12px, 400 weight, Inter (helper text, validation messages)

---

## Implementation Notes

- **No Gradients:** Use solid colors and subtle shadows for depth
- **Consistent Spacing:** Use 8px/16px/24px/32px grid for all margins and padding
- **Accessible Contrast:** All text meets WCAG AA standards (4.5:1 minimum)
- **Print-Ready Aesthetics:** UI design complements the premium PDF output
