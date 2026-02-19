The KodBank application is already built.

This is a UI refinement task only.

Do NOT rebuild.
Do NOT add features.
Do NOT change backend logic.
Do NOT modify authentication flow.
Do NOT change database or API logic.

Only apply the refinements described below.

🎯 OBJECTIVE

Refine spacing, header structure, logo branding, and dark mode visuals.

Functionality must remain unchanged.

1️⃣ UNIFIED LAYOUT SPACING SYSTEM (Header + All Pages)

The navbar and page content must follow the SAME container structure.

Current issue:
Too much horizontal empty space.

Required:

Use a centered container layout

Max width: approximately 1200px–1280px

Horizontal padding: 24px–32px on each side

Logo aligned inside container (not near viewport edge)

Avatar aligned symmetrically on right

Page content must align with the same container width

Header and body must visually align vertically

Do NOT use full-width stretched layout.
Do NOT create excessive empty margins.
Do NOT make it cramped.

Goal:
Balanced SaaS-style density.
Premium, intentional spacing.

2️⃣ odBank LOGO TYPOGRAPHY (LOGO ONLY)

Apply font:

Poppins SemiBold (600)

Important:
This font is ONLY for the logo text “odBank”.
Do NOT apply Poppins globally to entire UI.

Refinement rules:

Slightly tighten letter spacing (subtle)

Keep clean geometric look

Do not change logo layout

Color rules:

Dark mode:

“odBank” must be white (#ffffff or #fffdf5)

Light mode:

“odBank” must be black

Add smooth color fade transition on theme change.
Do not animate position or size.

3️⃣ REPLACE DIRECT LOGOUT WITH AVATAR DROPDOWN

Currently:
Logout text appears directly in header.

Refine to:

Circular avatar icon in top-right

Subtle hover effect (scale or elevation)

Clicking avatar opens dropdown

Dropdown contains ONLY:

Logout

No additional menu items.
Minimal clean dropdown.
Soft shadow.
Smooth fade + scale animation.

4️⃣ GRADIENT BLOBS IN DARK MODE

Currently:
Gradient blobs exist only in light mode.

Required:

Add same ambient gradient blobs in dark mode.

Dark mode behavior:

Lower opacity

Soft glow

Subtle diffusion

Blend naturally with #050509 background

Use brand color #feba01 glow

Must not overpower content

Both light and dark modes must have ambient depth.

Do NOT remove gradients in dark mode.

🚫 DO NOT MODIFY

Registration flow

Login flow

JWT logic

Database logic

Balance feature

Routing structure

Page layout hierarchy

Only visual and spacing refinement.

📦 OUTPUT REQUIRED

Provide:

Modified components only

Exact container width and padding values used

Confirmation logo font applied only to logo

Confirmation avatar dropdown implemented

Confirmation dark mode gradients added