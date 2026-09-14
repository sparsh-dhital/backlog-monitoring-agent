# EduRecover Visual Redesign Implementation Plan

A professional redesign of the existing EduRecover academic recovery platform — **refinement only, no feature removal**.

## Background

The prompt.md specifies a full visual redesign across:
- Landing page
- Auth page
- Dashboard/Prototype page (sidebar, topbar, content areas)
- Global design tokens (colors, typography, spacing, buttons, dark mode)

The codebase uses **React + TypeScript + TailwindCSS + Vanilla CSS**. Most of the landing page and auth are in custom CSS (`App.css` ~5,300 lines + `styles/auth.css`). The dashboard uses Tailwind utility classes inside `PrototypePage.tsx`.

The theme system toggles a `.dark` class on `<html>` and `<body>`. Dark mode is already partially wired but CSS dark mode tokens are incomplete/inconsistent.

---

## Key Problems Identified (Audit Results)

| Problem | Location |
|---|---|
| Typography too uniform — headings and body near-same size | App.css, auth.css |
| Hero h1 uses `clamp(42px, 4.2vw, 64px)` — not large enough for punch | App.css line 218 |
| Nav links are 14px, body text is 16px — weak hierarchy | App.css |
| Section headings use `clamp(32px, 3vw, 48px)` — reasonable, but letter-spacing too tight | App.css line 639 |
| Workflow steps have weak typography (11px strong, 8px small) | App.css ~690 |
| Landing background is a flat lavender gradient — needs more refinement | App.css line 33 |
| CTA section is fine but buttons are slightly generic | App.css |
| Dashboard sidebar is clean but needs dark-mode polish | PrototypePage.tsx |
| Dashboard cards have no elevation hierarchy | App.css |
| Dark mode: `.dark` class is toggled but only partial CSS dark overrides exist | App.css lower sections |
| Auth panel needs slightly more breathing room | auth.css |
| Role detail panel in landing is cramped | App.css |

---

## Design Tokens to Establish (Global)

```css
/* Light Mode */
--bg: #F7F9FC
--surface: #FFFFFF
--surface-raised: #F0F4FF
--border: #E2E8F0
--border-strong: #CBD5E1
--text-primary: #172033
--text-secondary: #475569
--text-muted: #94A3B8
--accent: #4F46E5
--accent-secondary: #2563EB
--accent-surface: #EEF2FF
--success: #10B981
--warning: #F59E0B
--critical: #EF4444
--info: #3B82F6

/* Dark Mode */
--bg: #0D1117
--surface: #161B22
--surface-raised: #1F2937
--border: #2D3748
--border-strong: #4A5568
--text-primary: #F1F5F9
--text-secondary: #94A3B8
--text-muted: #64748B
--accent: #6366F1
--accent-secondary: #3B82F6
--accent-surface: #1E1B4B
```

---

## Proposed Changes

### PHASE 1 — Global Tokens & Typography

#### [MODIFY] [App.css](file:///c:/Users/ACER/OneDrive/Desktop/Agentic-Hackathon/backlog-monitoring-agent/frontend/src/App.css)
- Add CSS custom properties for full light + dark mode token set at `:root` and `html.dark` / `.dark`
- Fix h1 size: hero heading to `clamp(52px, 5.5vw, 72px)` with tighter `line-height: 0.96`
- Fix h2: section headings to `clamp(36px, 3.5vw, 52px)`
- Fix body text to `16px` consistently
- Fix nav link size to `14px` (visible but not competing with headings)
- Fix eyebrow to `11-12px` uppercase with better letter-spacing
- Add `.dark` overrides for all landing page colors
- Refine button styles (more generous padding, cleaner hover)
- Improve workflow step typography (step name ~14px, description ~12px)
- Clean up role card typography
- Improve the CTA section spacing

#### [MODIFY] [index.css](file:///c:/Users/ACER/OneDrive/Desktop/Agentic-Hackathon/backlog-monitoring-agent/frontend/src/index.css)
- Update `:root` base colors to match new token set
- Add `.dark` root overrides

---

### PHASE 2 — Landing Page CSS (App.css)

Key improvements to the landing page visuals in App.css:

- **Landing background**: Replace flat lavender gradient with a more sophisticated cool-white `#F7F9FC` base with a subtle radial gradient
- **Hero layout**: Increase vertical padding, improve asymmetric grid ratio
- **Hero visual (dashboard-preview)**: Slightly less rotation, better shadow
- **Workflow rail**: Remove the flat grid look — add a subtle numbered connector feel, improve active state
- **Role cards**: Better active/selected state, cleaner typography hierarchy
- **Decision flow**: Refine the AI→Human→Action flow visual
- **CTA section**: Keep the deep navy, improve typography size
- **Footer**: Clean, remove excessive gradients

**Dark mode additions** (`.dark .landing-page`, `.dark .site-nav`, etc.):
- Background: `#0D1117` with subtle dark blue gradient
- Cards/surfaces: `#161B22` with subtle border `#2D3748`  
- Text colors adapted
- Buttons adapted

---

### PHASE 3 — Auth Page CSS (styles/auth.css)

- **Background**: In dark mode, change from white/lavender to dark
- **Auth panel**: In dark mode, `#161B22` with `border: 1px solid #2D3748`
- **Form inputs**: Dark mode bg `#0D1117`, text `#F1F5F9`
- **Role selector buttons**: Dark mode styling
- **Auth submit button**: Already solid — keep gradient, improve hover
- Slight spacing increases in the auth story left panel
- Eyebrow/label sizes made slightly more prominent

---

### PHASE 4 — Dashboard Shell (PrototypePage.tsx + App.css)

The dashboard uses Tailwind classes. I'll add targeted CSS overrides in App.css under `.dark` for the dashboard components:

- **Sidebar dark mode**: Background `#161B22`, borders `#2D3748`, active item indigo
- **Topbar dark mode**: Background `#161B22` with blur, search input dark
- **Stat cards dark mode**: Surface `#1F2937`, borders `#2D3748`
- **Content area dark mode**: Background `#0D1117`
- Light mode sidebar/topbar: Already clean, minor refinements

---

## User Review Required

> [!IMPORTANT]
> This is a **CSS-only redesign** — no TSX changes will break any existing logic, routes, or functionality. All changes are purely visual styling.

> [!NOTE]
> The dashboard (PrototypePage.tsx) uses Tailwind utility classes. Rather than converting everything to custom CSS, I'll add targeted `.dark` overrides in `App.css` using the existing `.dashboard-shell`, `.dashboard-sidebar`, `.dashboard-topbar` hooks already present. This preserves the existing Tailwind classes while adding proper dark-mode support.

> [!WARNING]  
> The App.css file is ~5,300 lines. I'll be making surgical additions/modifications — not a full rewrite. The existing structure will be preserved.

---

## Verification Plan

### Manual Verification
1. Launch `npm run dev` in `/frontend`
2. Visit landing page — check typography hierarchy (h1 >> h2 >> body)
3. Toggle dark mode — verify all sections look polished in dark
4. Visit auth page — verify split-screen layout, dark mode
5. Login to dashboard — verify sidebar, topbar, stat cards in both modes
6. Check on mobile viewport (320px) — no horizontal overflow
7. Check workflow section — feel connected, not just cards
