You are redesigning the existing EduRecover web application.

IMPORTANT:
This is a REFINEMENT and PROFESSIONAL REDESIGN of an already-built product, NOT a rebuild from scratch.

Do NOT delete existing functionality, routes, pages, components, workflows, mock data, API integrations, business logic, or working interactions just because you think they can be designed differently.

Your responsibility is to critically inspect the existing frontend first, understand what is already implemented, then improve its visual hierarchy, information architecture, typography, spacing, responsiveness, usability, and overall product quality.

The current frontend feels too text-heavy, has weak hierarchy, small typography, insufficient spacing, excessive card-like UI, and some content feels AI-generated rather than naturally written for humans.

The goal is to make EduRecover look like a serious, polished, production-grade academic technology platform.

==================================================
1. PRODUCT CONTEXT
==================================================

Product:
EduRecover

Purpose:
An academic recovery platform that helps institutions identify academic signals, understand student backlog situations, assess recovery possibilities, coordinate interventions, monitor progress, and keep humans involved in consequential decisions.

Core philosophy:

"AI monitors. Humans decide."

The product should feel:
- trustworthy
- calm
- intelligent
- professional
- human-centered
- institutional
- modern
- easy to scan
- evidence-driven

It should NOT feel:
- like an AI chatbot
- like a generic AI SaaS landing page
- like a dashboard template
- like a collection of random cards
- overly futuristic
- neon/cyberpunk
- overly glassy
- visually noisy
- text-heavy
- robotic

==================================================
2. FIRST STEP — INSPECT BEFORE MODIFYING
==================================================

Before making changes:

1. Inspect the complete existing frontend structure.
2. Identify:
   - routes
   - pages
   - reusable components
   - layout components
   - navigation
   - authentication flow
   - dashboard logic
   - existing responsive behavior
   - existing data structures
   - existing charts
   - existing icons
   - existing animations
3. Determine which components can be refined instead of recreated.
4. Preserve all working functionality.
5. Do not replace working functionality with static mockups.
6. Do not remove existing pages simply because they are visually weak.
7. Do not introduce unnecessary libraries if existing dependencies can achieve the result.
8. Do not modify backend/API/database behavior unless absolutely required for frontend compatibility.

Think like a senior product designer + frontend engineer reviewing a real product.

Do not blindly apply generic Tailwind styling.

==================================================
3. DESIGN DIRECTION
==================================================

Use this design system:

Visual style:
Modern/Clean
Premium Product-led
Typography-first
Subtle Glassmorphism
Editorial/SaaS influence
Data-focused where appropriate

Do NOT use excessive glassmorphism.

The UI should primarily use:
- clean solid surfaces
- subtle borders
- restrained shadows
- generous whitespace
- strong typography
- carefully controlled gradients
- meaningful accent colors

The visual reference direction is similar to the supplied EduRecover screenshots:
soft blue/lavender environment, strong indigo/blue primary actions, large typography, clean institutional SaaS interface.

However, improve significantly on those references.

Do not copy another website.

EduRecover should have its own visual identity.

==================================================
4. COLOR SYSTEM
==================================================

Primary palette:

Background:
#F7F9FC
or a very subtle cool-white background.

Primary:
#4F46E5

Secondary:
#2563EB

Deep text:
#172554

Primary text:
#172033

Secondary text:
#64748B

Muted:
#94A3B8

Border:
#E2E8F0

Surface:
#FFFFFF

Success:
#10B981

Warning:
#F59E0B

Critical:
#EF4444

Information:
#3B82F6

Use gradients VERY selectively.

Preferred brand gradient:
Indigo → Blue

Example:
#4F46E5 → #2563EB

Do not turn every card into a gradient.

Critical/warning/success colors must communicate status, not decoration.

Maintain WCAG-readable contrast.

==================================================
5. TYPOGRAPHY — MAJOR PRIORITY
==================================================

The current site has a major typography problem.

Headings and descriptions often feel almost the same size/weight.

Fix this globally.

Use a modern highly readable sans-serif such as:
Inter, Geist, or another existing project font if already installed.

Create a deliberate type scale.

Suggested desktop hierarchy:

Hero eyebrow:
13–14px
uppercase
medium/semibold
letter spacing

Hero heading:
56–72px
line-height around 0.95–1.05
font-weight 600–700

Section heading:
40–48px
line-height 1.05–1.15

Page heading:
32–40px

Card heading:
18–22px

Body:
16–18px

Supporting text:
14–16px

Metadata:
12–13px

Dashboard KPI:
28–36px

Never make the entire page use similar font sizes.

Create clear visual hierarchy:

EYEBROW
↓
LARGE HEADLINE
↓
SHORT SUPPORTING DESCRIPTION
↓
PRIMARY ACTION
↓
SECONDARY ACTION

Avoid paragraphs that look like marketing essays.

==================================================
6. HUMAN-READABLE CONTENT
==================================================

Review existing visible copy.

Do NOT preserve awkward AI-generated wording merely because it exists.

Rewrite UI copy when necessary to make it:
- shorter
- clearer
- conversational
- human
- specific
- useful

Avoid phrases such as:
"Leverage intelligent academic signals to facilitate..."
"Unlock transformative student success..."
"AI-powered ecosystem..."

Prefer:
"See which students need attention."
"Review a student's backlog and recovery options."
"Find repeated failure patterns."
"Approve the next intervention."
"Track whether the student is recovering."

The interface should explain what something does rather than advertise itself.

Keep terminology appropriate for an academic institution.

Do NOT invent new claims or functionality.

==================================================
7. LANDING PAGE REDESIGN
==================================================

Keep all existing landing-page sections/content that are useful.

Do NOT simply stack many sections vertically.

Create a strong narrative:

1. Navigation
2. Hero
3. Proof / product value
4. Nine connected workflows
5. How the system works
6. Stakeholder experience
7. AI + Human oversight
8. Product/dashboard preview
9. Strong CTA
10. Footer

--------------------------------------------------
NAVIGATION
--------------------------------------------------

Make the header simple.

Left:
EduRecover logo

Center/right:
Platform
Workflows
For Institutions
About

Right:
Sign in
Get started

On mobile:
logo
menu button

Do not overcrowd navigation.

Use a sticky/floating navigation only if it improves usability.

--------------------------------------------------
HERO
--------------------------------------------------

This is one of the most important improvements.

Do NOT make the hero a huge wall of text.

Use an asymmetric two-column layout.

Left:
Small eyebrow:
ACADEMIC RECOVERY PLATFORM

Large headline:

"Turn academic signals
into timely
student action."

Allow one or two words to use the primary brand accent.

Short description:
2–3 lines maximum.

Example direction:
"EduRecover helps institutions spot academic problems early, understand what is driving them, and coordinate the right support."

Actions:
Explore platform
View live demo

Right:
Use the existing dashboard/product visual if already available.

Do not create an enormous decorative illustration.

Instead show a believable product preview:
- backlog KPI
- students needing attention
- recovery status
- failure pattern
- intervention recommendation

The product itself should be the visual hero.

--------------------------------------------------
VISUAL HIERARCHY
--------------------------------------------------

The hero should have much more whitespace than the current design.

Use:
max-width around 1200–1280px
large horizontal margins
comfortable vertical spacing

Do not allow the hero to feel cramped.

==================================================
8. NINE WORKFLOWS
==================================================

Do NOT display nine equally sized cards in a boring grid.

The nine workflows represent a connected academic process.

Present them as a JOURNEY.

Concept:

DETECT
→ UNDERSTAND
→ IDENTIFY
→ ASSESS
→ RECOMMEND
→ APPROVE
→ INTERVENE
→ MONITOR
→ RECOVER

Create a visually interesting workflow section.

Desktop:
Use a horizontal journey / bento composition.

Mobile:
Convert it into a vertical timeline.

Each workflow should have:
- number
- small icon
- short name
- ONE concise description

Do not put paragraphs inside workflow cards.

The active workflow can visually expand or highlight.

The visual hierarchy should communicate:

Signal
↓
Understanding
↓
Decision support
↓
Human approval
↓
Intervention
↓
Measurement
↓
Recovery

This is more important than showing nine independent boxes.

==================================================
9. STAKEHOLDER SECTION
==================================================

Keep the stakeholder concept.

Current actors include:

Student
Faculty / Mentor
HOD
Examination Cell
Placement Cell

Do NOT introduce unnecessary actors just for visual completeness.

Present them as perspectives into the same academic recovery system.

Use a bento-style layout.

Example:

"One student story.
Different perspectives."

Then show five stakeholder cards.

Each card should have:
icon
role
one-line purpose
small "View workspace →"

Avoid large descriptions.

==================================================
10. AI + HUMAN OVERSIGHT
==================================================

This should be a major trust section.

Instead of a generic AI illustration, show a simple visual flow:

AI
Detects · Calculates · Explains · Recommends

↓

Human Review

Approves · Modifies · Rejects

↓

Action

Intervention · Monitoring · Recovery

Use visual connectors.

Make this section visually calm and trustworthy.

The important message:

"AI monitors. Humans decide."

Do not imply that AI autonomously makes consequential academic decisions.

==================================================
11. CTA
==================================================

Use one strong full-width CTA section.

Do not create a huge marketing block.

Example:

"Academic problems become harder
when they're discovered too late."

Small supporting sentence.

Button:
Explore EduRecover →

Use a deep navy/indigo surface with subtle gradient treatment.

==================================================
12. FOOTER
==================================================

Keep the footer simple.

Columns:

EduRecover
Short one-line description

Platform
How it works
Workflows
Dashboard

For People
Students
Faculty & Mentors
Institutions

Trust
Human oversight
Privacy
Security

Bottom:
© 2026 EduRecover

Do not overload the footer.

==================================================
13. AUTHENTICATION PAGE
==================================================

Refine the existing login/signup page.

The current concept is good but typography and spacing need refinement.

Use a split-screen layout on desktop.

Left:
Brand story / product message.

Right:
Authentication card.

Do NOT make the left side excessively text-heavy.

Possible hierarchy:

ACADEMIC RECOVERY PLATFORM

"Your academic journey,
understood."

Short explanation.

Then 3 concise trust points:

Context, not just alerts.
People stay in control.
One shared academic picture.

Right:

Sign in | Sign up

Welcome back

Institutional email or ID
Password
Remember me
Forgot password?

Sign in to workspace

Then optional authentication providers if already implemented.

Role selection should NOT dominate the login experience.

If demo mode requires role selection, visually separate it:

DEMO MODE
Choose workspace

Student
Faculty / Mentor
HOD
Examination Cell
Placement Cell

Make clear that this is for demo/testing if that is what it represents.

==================================================
14. DASHBOARD DESIGN
==================================================

Use:

Sidebar + top bar + content

This should become the primary application layout.

Desktop:

LEFT SIDEBAR
↓
TOP BAR
↓
MAIN CONTENT

Sidebar should be approximately 220–250px.

Do not make the sidebar visually heavy.

Navigation:

Dashboard
Students
Backlogs
Patterns
Interventions
Examinations
Alerts
Reports

Bottom:
Settings
Logout

Use clear active-state highlighting.

--------------------------------------------------
TOP BAR
--------------------------------------------------

Include:

Search students, courses, or IDs...

Notifications

User profile

Do not waste vertical space.

--------------------------------------------------
HOD DASHBOARD
--------------------------------------------------

The HOD dashboard should answer these questions immediately:

1. How many active backlogs exist?
2. How many students are affected?
3. Which cases need attention?
4. What patterns are appearing?
5. What interventions are happening?
6. Are students actually recovering?

Top KPI row:

Active Backlogs
Students Affected
Critical Cases
Interventions

Do NOT display too many KPIs.

Then:

SECTION:
"What needs attention now"

Three visual areas:

Backlogs by course
Failure patterns
Recoverability

Then:

Priority queue
Recent alerts

Then:

"From signal to recovery"

Show the connected workflow visually.

The HOD should be able to understand the page in approximately 10 seconds.

If a user has to read every card to understand the dashboard, the hierarchy is wrong.

==================================================
15. DASHBOARD CARD DESIGN
==================================================

Avoid the current problem where EVERYTHING is a card.

Use three levels:

LEVEL 1:
Page / section

LEVEL 2:
Important content container

LEVEL 3:
Individual information

Not every Level 3 element needs a bordered card.

Use:
- whitespace
- dividers
- grouped sections
- subtle backgrounds
- typography

instead of putting borders around everything.

Cards should communicate grouping, not simply decoration.

==================================================
16. STUDENT DIRECTORY
==================================================

Refine the existing Students page.

Keep table/list functionality.

Make it easier to scan.

Columns should have strong hierarchy:

Student
Backlogs
Attempts
Risk/Status
Recommended action

Use compact status badges.

Do not create giant empty tables.

Include:
search
filters
sort
status filter

On mobile:
convert rows into compact student cards.

==================================================
17. BACKLOG MONITORING WORKSPACE
==================================================

This page is central to Agent 35.

Make the purpose immediately obvious.

Header:

Backlog Monitoring

"Review a student's backlog, understand the pattern, and coordinate the next recovery step."

Top-right:
Scan ID
Registration number search
Review student record

This is an excellent place to preserve the Scan ID functionality.

Make "Scan ID" visually prominent but not gimmicky.

The empty state should feel intentional.

Instead of:

"Start with a student signal."

Use:

"Choose a student to begin."

Supporting text:
"Search by registration number or scan an institutional ID to review the student's recovery context."

Button:
Analyze student

Keep the page spacious.

==================================================
18. STUDENT DETAIL / RECOVERY PAGE
==================================================

This should feel like a real academic case file, not a generic dashboard.

Top:

Student identity
Program
Year / semester
Current status

Then a clear status summary.

Suggested structure:

Overview
Backlogs
Attempts
Pattern analysis
Recovery plan
Interventions

Use tabs where appropriate.

Important information should appear above the fold:

Active backlogs
Attempts remaining
Duration pressure
Promotion assessment
Recovery category

Then show detailed evidence.

Use clear distinctions:

FACT
CALCULATION
AGENT RECOMMENDATION
HUMAN DECISION

This is important for trust.

==================================================
19. DATA VISUALIZATION
==================================================

Keep existing useful charts.

Improve them rather than adding more charts.

Charts should answer questions.

Good:
Backlogs by course
Backlogs over semesters
Recoverability distribution
Clearance trend
Failure pattern

Avoid decorative charts.

Every chart needs:
clear title
small explanation if necessary
clear labels
reasonable spacing

Never use tiny unreadable chart labels.

==================================================
20. RESPONSIVENESS — MAJOR PRIORITY
==================================================

The current responsive implementation is not acceptable.

Do not simply shrink the desktop layout.

Design responsive behavior intentionally.

Breakpoints:

Mobile:
~320–767px

Tablet:
~768–1023px

Desktop:
~1024px+

Large desktop:
~1440px+

--------------------------------------------------
MOBILE RULES
--------------------------------------------------

On mobile:

Desktop sidebar becomes:
bottom navigation OR compact drawer

Use approximately 4–5 primary navigation destinations.

Secondary destinations go inside:
More

Do not squeeze 4–5 dashboard cards into one row.

KPI cards:
1 column or 2-column grid depending on width.

Charts:
full width

Tables:
become cards OR horizontally scrollable only when necessary.

Long desktop navigation:
collapse.

Large hero typography:
scale down smoothly.

Do not allow:
horizontal overflow
text clipping
buttons overflowing
cards wider than viewport
tiny unreadable text
fixed desktop widths

Touch targets:
minimum ~44px where practical.

Spacing should remain comfortable.

--------------------------------------------------
TABLET
--------------------------------------------------

Use 2-column layouts where appropriate.

Do not immediately collapse everything into one column.

--------------------------------------------------
DESKTOP
--------------------------------------------------

Use generous max-width:
1200–1280px.

Avoid content stretching across extremely wide monitors.

==================================================
21. SPACING SYSTEM
==================================================

Create a consistent spacing system.

Prefer multiples of:
4 / 8px.

Examples:
8
12
16
24
32
40
48
64
80
96
120

Landing sections should have generous vertical spacing.

Do not allow unrelated sections to visually touch.

At the same time, avoid enormous empty areas caused by arbitrary fixed heights.

Never use excessive:
padding: 100px everywhere
min-height: 100vh everywhere

Spacing should follow content hierarchy.

==================================================
22. BUTTONS
==================================================

Create a consistent button system.

Primary:
solid indigo/blue

Secondary:
white / subtle border

Tertiary:
text button

Danger:
red only when actually destructive

Buttons should have:
clear labels
consistent height
clear hover
focus
disabled
loading states

Avoid vague labels like:
"Explore Now"
"Unlock"
"Discover More"

Prefer:
Review critical cases
View recovery plan
Analyze student
Approve intervention
View report

==================================================
23. ICONOGRAPHY
==================================================

Use ONE consistent icon family.

Prefer Lucide or the existing icon library.

Do not mix:
emoji
random SVG styles
3D icons
outline icons
filled icons

unless there is a deliberate system.

Icons should support meaning.

Do not put icons everywhere just to make cards look attractive.

==================================================
24. MOTION
==================================================

Use subtle animation.

Good:
fade
slide
small hover elevation
button feedback
chart animation
navigation transition

Avoid:
excessive bouncing
parallax everywhere
floating cards everywhere
continuous animations
large page transitions

Animation should communicate state, not decoration.

Respect prefers-reduced-motion.

==================================================
25. ACCESSIBILITY
==================================================

Ensure:

- semantic HTML
- keyboard navigation
- visible focus states
- sufficient contrast
- aria labels where required
- buttons are actual buttons
- links are actual links
- form labels are accessible
- charts have meaningful accessible context
- responsive text remains readable

Do not sacrifice accessibility for aesthetics.

==================================================
26. RESPONSIBLE AI UX
==================================================

EduRecover is an AI-assisted academic platform.

Never visually imply:

"AI decided this student's future."

Instead communicate:

AI analyzed the available evidence.

Human reviews the recommendation.

Human approves or modifies the action.

Use labels such as:

AI analysis
Evidence
Recommendation
Human review
Approved action

This should be visible in relevant workflows.

==================================================
27. DO NOT OVERDESIGN
==================================================

This is extremely important.

Do NOT respond to the current design problems by adding:

- more gradients
- more cards
- more shadows
- more icons
- more animations
- more text
- more charts
- more badges
- more decorative illustrations

The solution to visual clutter is usually SUBTRACTION and HIERARCHY.

If two components communicate the same thing, simplify their presentation.

If a paragraph can become one sentence, shorten it.

If a card does not need a border, remove it.

If a metric does not matter to the user, reduce its visual prominence.

==================================================
28. INFORMATION HIERARCHY TEST
==================================================

After redesigning each major page, mentally perform a 5-second test.

Ask:

"If someone sees this page for 5 seconds, what do they understand?"

Landing page:
What is EduRecover?
Who is it for?
Why does it matter?

HOD:
What requires my attention?

Student:
What is my current academic situation?
What should I do next?

Backlog workspace:
Which student am I reviewing?
What is wrong?
Why?
What can be done?
Who must approve it?

If the answer is not obvious, redesign the hierarchy.

==================================================
29. PRESERVE EXISTING PRODUCT
==================================================

Again:

DO NOT DELETE existing features.

Do not remove:
- existing routes
- existing workflows
- authentication
- dashboard functionality
- existing data
- charts
- student records
- backlog functionality
- intervention functionality
- existing mock/demo mode
- scan ID concept
- search
- alerts
- reports

Instead:

REFACTOR VISUAL PRESENTATION.

If a component is poorly structured, refactor it carefully while preserving behavior.

If a page is already functional, improve its presentation rather than replacing it with static content.

==================================================
30. CODE QUALITY
==================================================

Keep the frontend maintainable.

Prefer reusable components such as:

Button
Badge
Card
SectionHeader
MetricCard
StatusBadge
EmptyState
SearchInput
DataTable
PageHeader
Sidebar
TopBar
ChartCard
WorkflowStep
StudentCard
StudentSummary
EvidencePanel
ApprovalPanel

Do not duplicate large blocks of JSX.

Use a centralized design system/tokens where possible.

Keep responsive behavior in reusable components.

Do not create hundreds of one-off CSS rules.

==================================================
31. IMPLEMENTATION ORDER
==================================================

Do NOT modify everything randomly.

Work in this order:

PHASE 1
Audit current frontend.

PHASE 2
Create/refine global:
- typography
- colors
- spacing
- buttons
- cards
- badges
- inputs
- shadows
- borders
- responsive utilities

PHASE 3
Redesign global application shell:
- sidebar
- top bar
- navigation
- responsive navigation

PHASE 4
Redesign landing page.

PHASE 5
Redesign authentication.

PHASE 6
Redesign HOD dashboard.

PHASE 7
Redesign Students / Backlogs / Patterns / Interventions / Examinations / Alerts / Reports pages.

PHASE 8
Redesign Student Detail / Recovery experience.

PHASE 9
Improve mobile and tablet layouts.

PHASE 10
Run a visual consistency pass across every page.

PHASE 11
Test all existing interactions and routes.

==================================================
32. FINAL QUALITY CHECK
==================================================

Before finishing, inspect the application as if you were a real HOD, mentor, and student.

Check:

[ ] Headings are clearly larger than descriptions.
[ ] Important information has obvious visual priority.
[ ] No section feels unnecessarily text-heavy.
[ ] Landing page tells a logical story.
[ ] Nine workflows feel connected rather than nine random cards.
[ ] Stakeholder roles are easy to understand.
[ ] AI vs human responsibility is clear.
[ ] HOD can identify urgent cases quickly.
[ ] Student can understand their academic situation quickly.
[ ] Backlog workspace has a clear purpose.
[ ] Scan ID is easy to find.
[ ] Tables are readable.
[ ] Charts are readable.
[ ] Mobile does not look like compressed desktop.
[ ] Tablet layout is intentional.
[ ] No horizontal overflow.
[ ] No tiny body text.
[ ] No excessive cards.
[ ] No excessive gradients.
[ ] No excessive shadows.
[ ] No unnecessary animations.
[ ] No broken existing functionality.
[ ] No missing routes.
[ ] No console errors.
[ ] No obvious accessibility problems.
[ ] Copy sounds human and concise.
[ ] The interface feels like a real institutional product rather than an AI-generated prototype.

==================================================
33. MOST IMPORTANT DESIGN PRINCIPLE
==================================================

Do not optimize the interface for showing how much has been built.

Optimize it for helping a HUMAN understand what matters and what to do next.

EduRecover should communicate:

SIGNAL
→ CONTEXT
→ UNDERSTANDING
→ RECOMMENDATION
→ HUMAN DECISION
→ ACTION
→ RECOVERY

The UI should make this logic visually obvious.

Make the redesign feel like a mature, premium academic SaaS product that could realistically be presented to a university leadership team.

Start by inspecting the existing project. Do not immediately rewrite files.

After the audit, implement the redesign incrementally while preserving all existing functionality.