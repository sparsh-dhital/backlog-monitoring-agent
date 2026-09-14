I want you to thoroughly audit and improve the existing website without changing its core functionality, branding, or overall design direction.

## Main Objectives

Fix the current UI/UX issues, improve performance, and ensure the entire website is properly responsive across desktop, tablet, and mobile devices.

### 1. Properly Implement Dark Mode

The current dark mode implementation is incomplete. Some components still appear as if they are using light mode.

Please audit **every UI component and page**, including:

* Cards
* Buttons
* Inputs and forms
* Dropdowns
* Modals
* Tables
* Sidebar
* Navigation
* Badges/tags
* Tooltips
* Empty states
* Alerts/notifications
* Hover, active, focus, and disabled states
* Borders, dividers, and shadows
* Icons
* Text and secondary text

Use a **proper dark color system** rather than simply replacing white with black.

The dark theme should have:

* Rich, layered background colors
* Proper contrast between the page, cards, and elevated elements
* Clear primary/secondary/accent colors
* Readable text hierarchy
* Proper contrast for accessibility
* Consistent hover and active states
* No accidental white/light backgrounds

Make sure there are no visually inconsistent light-mode elements remaining anywhere on the site.

### 2. Fix Performance and Choppiness

The website currently feels laggy and choppy.

Perform a performance audit and identify unnecessary causes of:

* Slow rendering
* Excessive re-renders
* Heavy animations
* Layout shifts
* Unoptimized images/assets
* Unnecessary JavaScript execution
* Expensive event listeners
* Poor component rendering patterns

Optimize the implementation while **preserving the existing functionality and visual quality**.

Animations should feel smooth and intentional rather than excessive. Avoid adding animations simply for visual effects.

The final interaction should feel responsive and smooth, especially when:

* Opening/closing the sidebar
* Navigating between sections
* Scrolling
* Hovering/interacting with components
* Loading dashboard content

### 3. Complete Responsive Design Audit

Thoroughly test the entire website at different viewport sizes.

Check at minimum:

* Large desktop
* Standard desktop/laptop
* Tablet
* Small tablet
* Mobile
* Small mobile

Do not only fix obvious overflow issues. Review the actual layout behavior at each breakpoint.

Check:

* Typography
* Spacing
* Card layouts
* Grid/flex behavior
* Navigation
* Sidebar
* Buttons
* Forms
* Tables
* Images
* Icons
* Modals
* Content overflow
* Horizontal scrolling
* Touch targets
* Fixed/sticky elements

Nothing should be clipped, overlap, overflow, or become unusable on smaller screens.

### 4. Make the Sidebar Collapsible

The sidebar should be properly collapsible.

Implement a clean, intuitive collapse/expand control using an appropriate icon.

Requirements:

* Use a professional and recognizable icon.
* The icon/button should be easy to find and click.
* Sidebar transitions should be smooth.
* Collapsing the sidebar must not break the main content layout.
* Main content should automatically adjust to the available width.
* On smaller screens, the sidebar should behave appropriately for mobile rather than simply shrinking the desktop sidebar.
* Ensure there is no horizontal overflow when opening or closing it.
* Preserve the current navigation functionality.

Do not use an oversized or visually distracting toggle button.

### 5. Move Dashboard Navigation on Smaller Screens

On smaller/mobile screens, the **Dashboard option should be positioned at the bottom instead of the top**.

This should be implemented specifically for smaller screen layouts while keeping the desktop layout logical.

Make sure:

* The Dashboard option remains easily accessible.
* It does not overlap other navigation items.
* It works properly with the collapsible/mobile sidebar.
* It remains usable on different mobile screen heights.
* The change does not negatively affect desktop/tablet responsiveness.

## Important Implementation Rules

1. **Do not rebuild the website unnecessarily.**
   Work with the existing codebase and improve the current implementation.

2. **Do not remove existing functionality.**
   All current features should continue working after the changes.

3. **Maintain the existing branding and design language**, but improve its consistency and polish.

4. Do not introduce unnecessary libraries or dependencies when the existing stack can handle the requirement.

5. Prioritize:
   **Performance → Responsiveness → Accessibility → Visual consistency → Animation polish**

6. Check the entire site rather than fixing only the specific component where an issue was first noticed.

## Testing & Verification

After implementing the changes:

1. Run the application.
2. Test all major pages/components.
3. Test dark mode throughout the entire site.
4. Test sidebar collapse/expand.
5. Test desktop, tablet, and mobile layouts.
6. Test the Dashboard position on smaller screens.
7. Check for console errors.
8. Check for horizontal overflow.
9. Check for broken interactions.
10. Verify that performance is noticeably smoother.

If you identify additional UI/UX or responsiveness issues while auditing the site, fix them as long as they are directly related to the objectives above and do not alter the product's intended functionality.

**Do not stop after making the code changes. Actually run and verify the implementation before considering the task complete.**