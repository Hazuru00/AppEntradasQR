---
version: "alpha"
name: "Y2K Windows 98 / Frutiger Aero Taquilla"
description: "Taquilla digital retro Y2K / Frutiger Aero. Landing page + checkout + admin + scanner. AI-ready template."
colors:
  primary: "#2E2E2E"
  secondary: "#B5A642"
  tertiary: "#8C2727"
  neutral: "#E9E1D4"
  surface: "#6B8E23"
  accent: "#3B5998"
typography:
  h1:
    fontFamily: Courier New
    fontSize: 2.5rem
    fontWeight: 700
  body-md:
    fontFamily: Courier New
    fontSize: 1rem
    fontWeight: 400
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    borderTop: 2px solid "#728EC7"
    borderLeft: 2px solid "#728EC7"
    borderBottom: 2px solid "#142242"
    borderRight: 2px solid "#142242"
    padding: 8px 16px
---

## Overview

Y2K / Frutiger Aero aesthetic — the sleek, bubbly, optimistic future as imagined in the late 90s and early 2000s — reinterpreted through the iconic Windows 98 desktop shell. Every screen behaves as an application window on a dot-granulated desktop: beveled frames, gradient title bars with window buttons `[_] [□] [✕]`, sunken panels, tactile 3D buttons and status bars. The result is nostalgic but clean: zero AI clichés, zero loud gradients, a high-quality retro look that feels like a working program from the year 2000.

- Density: 5/10 — Balanced
- Variance: 6/10 — Expressive
- Motion: 4/10 — Subtle

- **Style:** Retro-UI, Desktop Metaphor, Clean-Retro
- **Keywords:** y2k, windows 98, frutiger aero, desktop, bevel, chrome, nostalgia, retro-ui, monospace
- **Era:** Late 1990s – Early 2000s
- **Light/Dark:** ✓ Full / ✗ No

## Colores

- **Faded Black** (#2E2E2E) — Dark text, primary foreground
- **Dirty Yellow** (#B5A642) — Warning states, pending payments, attention indicators
- **Muted Red** (#8C2727) — Danger, rejected payments, sensitive actions
- **Off-White** (#E9E1D4) — Light surface, card text, neutral text
- **Olive Drab** (#6B8E23) — Success states, approved tickets, decorative use
- **Denim Blue** (#3B5998) — Primary accent, approved buttons, selection
- **Window Haze** (#22232C) — Window body background
- **Desktop Base** (#14151B) — Page background behind windows
- **Titlebar Blue** (#1D3557 → #457B9D) — Classic gradient title bars
- **Concrete Grey** (#8F92A8) — Secondary text, muted elements, status bar text
- **Bevel Light** (#525464) — 3D bevel light edges (top / left)
- **Bevel Dark** (#0D0E12) — 3D bevel dark edges (bottom / right)

## Tipografía

- **Display / Hero:** Courier New — Weight 700, tight tracking, uppercase, used for headline impact
- **Body:** Courier New — Weight 400, 16px / 1.6 line-height, max 72ch per line
- **UI Labels / Captions:** Courier New — 0.875rem, weight 500, slight letter-spacing, uppercase
- **Monospace:** Courier New — Used for code, metadata, technical values, tokens, status messages

Scale:
- Hero: clamp(2.5rem, 5vw, 4rem)
- H1: 2.25rem
- H2: 1.5rem
- Body: 1rem / 1.6
- Small: 0.875rem

## Layout

- **Grid:** CSS Grid primary. Max-width containment: 1280px centered with 1.5rem side padding.
- **Spacing rhythm:** Balanced. Base unit: 0.5rem (8px).
- **Section vertical gaps:** clamp(4rem, 8vw, 8rem) — windows leave breathing room between each other.
- **Hero layout:** Asymmetric composition inside a window frame.
- **Feature sections:** Asymmetric grid. No 3-equal-columns unless it's a widget grid (KPI panels).
- **Mobile collapse:** All multi-column layouts collapse below 768px. No horizontal overflow.
- **z-index contract:** base (0) / sticky-nav (100) / overlay (200) / modal (300) / toast (500).

## Elevation & Depth

Desktop metaphor: every card is a window floating above a dot-granulated desktop. Windows cast a hard 4px offset shadow.

- **Window frame:** 2px beveled border — outer light on top/left, outer dark on bottom/right. Inner sunken panel for content.
- **Sunken panels** (`win98-sunken`): inner fields, data grids, counters, QR areas. Inverted bevel (dark top/left, light bottom/right).
- **Window shadow:** `box-shadow: 4px 4px 0 rgba(0,0,0,0.4)` — hard offset, no blur.
- **Physics:** Ease-out curves, 200–300ms duration. Smooth and predictable.
- **Entry animations:** Fade + translate-Y (16px → 0) over 420ms ease-out. Staggered cascades for lists: 80ms between items.
- **Hover states:** Subtle color lightening on buttons + pressed bevel inversion on active.
- **Page transitions:** Fade only (200ms).
- **Performance:** Only transform and opacity animated. No layout-triggering properties.

## Shapes

- **Windows:** Sharp corners (radius 0 / `rounded-none`). Beveled borders only.
- **Buttons:** Sharp corners. Raised bevel rest state → inverted bevel on `:active` + 1px translate for tactile press.
- **Badges / chips:** Sharp corners. Sunken or bordered tags.
- **Persons counter / KPI panels:** Sunken panels with bold monospace numbers.

## Componentes

- **Window (`.win98-box`):** Dark surface `#22232C`. 2px beveled border (light top/left, dark bottom/right). Hard 4px shadow. Rounded none. Contains a title bar, body and optional status bar.
- **Title bar (`.win98-titlebar`):** Gradient `#1D3557 → #457B9D`. Bold white text 12px. Right side window buttons `[_] [□] [✕]` (16×14px, beveled, invert on press). Uppercase mono title text.
- **Button (`.win98-btn`):** Raised 3D bevel. Primary variant `#3B5998` with blue bevels. Hover: lighten bg (`#353848` / `#4A6BB2`). Active: inverted bevel + `translate(1px, 1px)`. Disabled: opacity 50%.
- **Sunken panel (`.win98-sunken`):** Inset field. Dark bg `#121318`. Inverted bevel light border. Used for inputs, QR boxes, data grids, KPI counters, explanation boxes.
- **Status bar (`.win98-statusbar`):** 1px lines (dark top, light bottom). Bg `#191A22`. Small 11px text `#8F92A8`. Status indicators on the right.
- **Inputs:** Label above input (uppercase mono). Input uses sunken style. Focus: blue bevel ring. No floating labels.
- **Table:** Sunken container. Sticky zebra-less header `#181922`. Hover row highlight `white/3%`. Status badges in colored chips.
- **Modal:** Window frame centered over `black/80 backdrop-blur`. Reject / scan-result prompts.
- **Skeletons:** Shimmer animation matching component dimensions. No circular spinners.
- **Empty States:** Mono `[ ... ]` descriptive text inside the grid. No icons required.

## Do's and Don'ts

- No emojis in UI — use the icon system (Lucide) sparingly
- No pure black (#000000) — use off-black or charcoal variants
- No oversaturated accent colors (saturation cap: 80%)
- No 3-column equal-width feature layouts — use windows, zig-zag or asymmetric grid
- No `h-screen` — use `min-h-[100dvh]`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links — use inline SVG or the desktop dot-granule background
- No generic lorem ipsum in demos
- No rounded outer corners on windows / buttons / inputs — sharp is Y2K

- Do Use beveled 3D borders everywhere
- Do Use gradient title bars with window buttons
- Do Use sunken panels for data and inputs
- Do Use Courier New for everything
- Do Uppercase micro-labels
- Do Use status bars to finish each window
- Do Reference Windows 98 / Y2K / Frutiger Aero in decorative text (`.EXE` fastenings, `C:\>` prompts)

## Use Case

Event ticketing + payment verification (Pago Móvil) + QR gate scanning QrScannerComponent. Public checkout, ticket viewer, admin conciliation panel and gate scanner all share the same desktop-window language.