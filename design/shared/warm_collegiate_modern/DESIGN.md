---
name: Warm Collegiate Modern
colors:
  surface: '#f9f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f9f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f5'
  surface-container: '#edeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e4'
  on-surface: '#1a1c1d'
  on-surface-variant: '#594139'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f0f2'
  outline: '#8d7168'
  outline-variant: '#e1bfb5'
  surface-tint: '#ab3500'
  primary: '#ab3500'
  on-primary: '#ffffff'
  primary-container: '#ff6b35'
  on-primary-container: '#5f1900'
  inverse-primary: '#ffb59d'
  secondary: '#006c4c'
  on-secondary: '#ffffff'
  secondary-container: '#99f5ca'
  on-secondary-container: '#007351'
  tertiary: '#865300'
  on-tertiary: '#ffffff'
  tertiary-container: '#d78800'
  on-tertiary-container: '#492b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#832600'
  secondary-fixed: '#99f5ca'
  secondary-fixed-dim: '#7dd8af'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005138'
  tertiary-fixed: '#ffddb9'
  tertiary-fixed-dim: '#ffb961'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#663e00'
  background: '#f9f9fb'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.2px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.4px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system targets busy college students and campus dining vendors navigating fast-paced meal breaks between classes. The experience delivers frictionless pre-ordering, quick pick-ups, and live counter queue monitoring. 

The aesthetic is energetic yet disciplined, blending Material 3 tactile surface principles with a modern, high-whitespace editorial clarity. It departs from dense, sensory-overload delivery apps by focusing on structured calm: generous touch targets, clear wayfinding, and punchy culinary warmth. The emotional tone is reliable, swift, and welcoming.

## Colors

The color palette centers around appetite appeal and verified efficiency.

- **Primary (`#FF6B35` - Warm Orange):** Directs the primary visual pathway—used for key call-to-actions, cart badges, active navigational highlights, and vital checkout interactions.
- **Secondary / Success (`#1B7F5C` - Forest Green):** Indicates confirmation, readiness status (order ready for pickup), dietary callouts (e.g., vegan/vegetarian), and positive wallet balances.
- **Tertiary (`#F39C12` - Amber):** Used for order preparation alerts, pickup time estimates, and campus notification flags.
- **Neutral Base (`#F7F7F9` - Soft Light Grey):** The primary canvas background, creating clean separation from pure white elevated surfaces.
- **Surface Elevation Cards (`#FFFFFF`):** High-contrast containers for interactive units, food items, and merchant listings.
- **Surface Outlines (`#E5E7EB`):** Subtle dividers and low-contrast borders preserving structure without noise.
- **Text & Core Tokens:**
  - `on-surface-primary`: `#1A1A1A` (900 Dark Charcoal)
  - `on-surface-secondary`: `#6B7280` (600 Muted Charcoal)
  - `on-surface-subtle`: `#9CA3AF` (400 Placeholder & Inactive)

## Typography

This design system uses **Plus Jakarta Sans** across all roles to achieve clean, geometric readability with friendly, contemporary curves. It delivers optimal micro-legibility for dense menus, price tags, and rapid scanning on mobile viewports.

- Use `display-lg` sparingly for empty states and primary splash onboarding.
- Use `headline-sm` and `headline-md` for dining hub titles, section headers, and checkout summaries.
- Apply `label-md` and `label-sm` with letter-spacing tracking for dietary tags, pill labels, status indicators, and micro-quantities.

## Layout & Spacing

The layout is built on a mobile-first, 4-column fluid layout that expands to 8 columns on tablet and 12 columns on desktop frames.

- **Mobile (<600px):** 4 columns, 16px (`1rem`) outer margins, 16px (`1rem`) gutters. Sticky bottom actions utilize standard safe-area padding.
- **Tablet (600px - 1024px):** 8 columns, 24px (`1.5rem`) outer margins, 16px gutters. Menu feeds render in a 2-column card grid.
- **Desktop (>1024px):** 12 columns constrained to a max-width of 1200px centered, 32px outer margins, 24px gutters.
- **Rhythm & Safe Insets:** Use `space-md` for standard component padding within cards. Bottom navigation bars and order snackbars clear an absolute minimum of `space-xl` + system safe-area insets.

## Elevation & Depth

Visual hierarchy combines flat background neutrals with diffused, ambient shadows to produce calm, tangible surfaces:

- **Level 0 (Base / Canvas):** Surface color `#F7F7F9`, no shadow. Background backdrop for non-interactive areas.
- **Level 1 (Cards, Menu Items, List Tile Surfaces):** `#FFFFFF` surface with a delicate warm ambient shadow: `box-shadow: 0 2px 8px -2px rgba(26, 26, 26, 0.04), 0 1px 4px -1px rgba(26, 26, 26, 0.02)`. Borders use `#E5E7EB` (1px solid) to maintain structure.
- **Level 2 (Floating Action Buttons, Active Bottom Navigation, Segmented Controllers):** `#FFFFFF` surface with `box-shadow: 0 8px 16px -4px rgba(26, 26, 26, 0.08), 0 2px 6px -1px rgba(26, 26, 26, 0.04)`.
- **Level 3 (Modal Sheets, Pre-Order Drawer, Pickup Notifications):** `#FFFFFF` surface with `box-shadow: 0 16px 32px -8px rgba(26, 26, 26, 0.12), 0 4px 12px -2px rgba(26, 26, 26, 0.06)`.

## Shapes

The design system implements defined rounding to deliver an approachable, modern feel:

- **Cards & Surface Containers:** `16px` (`rounded-2xl` / `1rem`), generating approachable, rounded modules for food cards, meal customization panels, and order summaries.
- **Inputs & Form Controls:** `12px` (`0.75rem`) for text boxes, counter controls, and search fields.
- **Badges, Pills & Primary Action Buttons:** `9999px` (`pill`), ensuring immediate tactile affordance for chips, status trackers, and checkout actions.

## Components

### Buttons
- **Primary:** Filled `#FF6B35` with pure white text, 48px min-height, pill-shaped (`border-radius: 9999px`). Active state scales slightly down (`0.98`) with a darker hue `#E55A27`.
- **Secondary:** Filled `#E8F5F0` with `#1B7F5C` text and label-lg typography for complementary actions like "Add Special Request" or "Filter Dietary."
- **Tertiary / Outlined:** 1px `#E5E7EB` border, transparent background, `#1A1A1A` text.
- **Floating Cart Button:** Fixed bottom bar, `#FF6B35` background, Level 2 elevation, pill-shaped, carrying total price, item count counter, and action chevron.

### Chips & Badges
- **Pill Badges:** 28px height, rounded pill shape, horizontal padding of `space-sm`. 
  - *Dietary / Status Ready:* `#E8F5F0` background with `#1B7F5C` text.
  - *Popular / Quick Snack:* `#FFF0EB` background with `#FF6B35` text.
  - *Prep Time / Counter Queue:* `#FEF6E9` background with `#F39C12` text.
- **Filter Chips:** 36px height, 1px `#E5E7EB` border, `#FFFFFF` background. Selected state transitions to `#1A1A1A` fill with white text.

### Cards
- **Food & Snack Cards:** `#FFFFFF` background, 16px rounded corners, 1px `#E5E7EB` outline, Level 1 shadow. Generous 12px or 16px inner padding. Image container uses 12px internal rounding.
- **Order Progress Card:** Displays current state with a 3-step linear pill tracker, order ID in bold mono/charcoal, and estimated pickup window in forest green.

### Input Fields
- **Search & Filter Bars:** 48px height, `#FFFFFF` background, `12px` corner radius, 1px `#E5E7EB` border. Prefix icon in `#6B7280`, placeholder text in `#9CA3AF`. Focus state rings with 2px `#FF6B35` at 20% opacity.
- **Quantity Selector:** Stepper unit inside a pill container, containing minus/plus touch points (`32x32px`) separated by `title-md` centered count.

### Lists & Dividers
- Lists sit directly on `#FFFFFF` card groups. Rows maintain a minimum touch target height of 56px.
- Use 1px `#E5E7EB` dividers inset by `16px` to avoid cutting edges, or use pure `space-sm` separation using Level 0 background gaps.

### Checkboxes & Radio Buttons
- Rounded square (checkbox) and circular (radio) controls with 20px diameter.
- Unchecked: 1.5px border `#E5E7EB`, transparent background.
- Checked: `#FF6B35` filled background with pure white icon check/dot, ensuring clear feedback for topping selections.