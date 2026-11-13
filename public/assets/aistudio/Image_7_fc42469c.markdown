---
name: IdeaToStack
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#7bd0ff'
  on-tertiary: '#00354a'
  tertiary-container: '#009bd1'
  on-tertiary-container: '#002d40'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  code-base:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.01em
  code-badge:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-ui:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies high-velocity developer infrastructure: laser-focused, architecturally rigorous, and visibly modern. Tailored for engineers, software architects, and technical founders constructing scalable tech stacks, it projects precision, deep focus, and state-of-the-art tooling.

The aesthetic fuses **Modern Technical Minimalism** with **Refined Dark Glassmorphism**:
- **Atmosphere:** Deep void foundations set against crystalline, hairline borders and faint optical blurs.
- **Accents:** High-potency electric indigo guides the primary cognitive path, countered by radiant emerald indicators signaling validated, live architectural states.
- **Tone:** Engineered, noise-free, and keyboard-centric. Visual effects avoid decorative excess, existing strictly to signal interaction state, stack stability, and architectural hierarchy.

## Colors

The palette operates in high-contrast technical darkness, using precise color steps to separate infrastructure surfaces from interactive nodes:

- **Canvas & Backgrounds:** Deepest void `#030712` for primary shell surfaces and `#090d16` for contextual working panes and canvas docks.
- **Surfaces & Overlays:** Translucent zinc-900 layers (`rgba(17, 24, 39, 0.65)`) that let ambient gradients bleed softly through.
- **Structural Borders:** Hairline boundaries calibrated at `rgba(39, 39, 42, 0.8)` (zinc-800) to frame micro-components without visual weight.
- **Primary Accent (`#6366f1`):** Electric indigo drives active selections, terminal cursor focus, dynamic wiring links, and primary CTA triggers.
- **Secondary Accent (`#10b981`):** Radiant emerald represents active services, compatibility verification, healthy deployments, and production-ready stacks.
- **Tertiary Accent (`#38bdf8`):** Electric cyan used selectively for API nodes, pipeline bridges, and code-hover insights.
- **Neutrals & Text:** Primary text resolves at `#f9fafb` (zinc-50), supporting text at `#9ca3af` (zinc-400), and muted code comments at `#4b5563` (zinc-600).

## Typography

Typography establishes an uncompromising hierarchy between structural copy and technical tokens:

- **Headlines (Geist):** Rendered tight with negative tracking to convey structural density and modern engine aesthetics. Used across navigation heads, panel targets, and stack blueprint titles.
- **Body & UI Narrative (Inter):** High-legibility neutral workhorse for technical documentation, architectural rationales, parameter hints, and form interfaces.
- **Code & Micro-Badges (JetBrains Mono):** Monospaced type reserved for CLI snippets, environment tokens, tech stack tags, package versions, and protocol schemas.
- **Optical Rules:** Monospaced elements must always be optically centered within pills or badges, paired with a slightly elevated line-height to maintain character column balance.

## Layout & Spacing

The layout is built on a responsive fluid canvas grid engineered for complex data visualization and node graph manipulation:

- **Desktop (12 Columns):** Fluid grid anchored with a maximum workspace envelope of `1440px`. Gutters run at `1.5rem` (`24px`), margins at `2rem` (`32px`). Split-pane layout isolates the configuration panel (4 columns) from the live architecture workspace (8 columns).
- **Tablet (8 Columns):** Collapses auxiliary toolbars into drawer menus; margins and gutters reduce uniformly to `1rem` (`16px`).
- **Mobile (4 Columns):** Stacks panels sequentially into vertical tabs; full-width margins contract to `1rem` (`16px`).
- **Spacing Rhythm:** Strictly locked to an 8-point base grid (`0.5rem` / `8px` steps) with 4-point micro steps (`space-xs`: `4px`) for dense code blocks, terminal tags, and status dots.

## Elevation & Depth

Visual depth is achieved through layered semi-transparency, optical borders, and selective photonic luminescence rather than traditional drop shadows:

- **Base Slate Plane:** Zero elevation, flat `#030712` canvas featuring a subtle dot grid texture (`1px` dot every `24px` at `rgba(255, 255, 255, 0.04)`).
- **Glassmorphic Surface (Tier 1):** Background `rgba(9, 13, 22, 0.72)` combined with `backdrop-filter: blur(12px)` and bordered by a crisp `1px solid rgba(39, 39, 42, 0.8)`. Used across interactive workspace cards and module shelves.
- **Floating Overlays & Modals (Tier 2):** Background `rgba(15, 23, 42, 0.85)` with `backdrop-filter: blur(20px)`, enclosed by `1px solid rgba(99, 102, 241, 0.3)`. Grounded by an ambient, extra-diffused indigo drop: `0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 25px -5px rgba(99, 102, 241, 0.15)`.
- **Glowing Gradient Borders:** Highlighted stack nodes and active drops employ pseudo-elements driven by conic or linear gradients (`linear-gradient(135deg, rgba(99, 102, 241, 0.6), rgba(16, 185, 129, 0.4), rgba(39, 39, 42, 0.2))`) with a `1px` stroke footprint, creating focused perimeter illumination.

## Shapes

The design uses a restrained, structural curvature strategy (Level 1: Soft) paired with full-pill treatments for specific interactive filters:

- **Containers, Cards, & Panels:** Standard radius at `0.25rem` (`4px`), expanding to `0.5rem` (`8px`) for `rounded-lg` modal panels and workspace viewports. Sharp, crisp corners reflect a terminal-inspired, architectural ethos.
- **Pill Selectors & Badges:** Interactive technology filter toggles, active profile switchers, and status tags break the boxy structure by using full pill geometry (`border-radius: 9999px`), immediately distinguishing actionable meta-controls from stack structural blocks.

## Components

### Buttons
- **Primary:** Electric indigo fill (`#6366f1`) with pure white text, transitioning to `#4f46e5` on hover. Enforced `1px` subtle highlight border at the top edge (`rgba(255, 255, 255, 0.25)`). Elevated states project a tight accent glow: `box-shadow: 0 0 16px rgba(99, 102, 241, 0.35)`.
- **Secondary / Ghost:** Glass background (`rgba(255, 255, 255, 0.03)`), crisp zinc border (`1px solid rgba(39, 39, 42, 0.8)`), text `#f9fafb`. Hover shifts border to `rgba(99, 102, 241, 0.5)` and text to electric indigo.
- **Monospace Icon Buttons:** Strict `32x32px` or `40x40px` squares with rounded-sm geometry, centered icon, and hairline border for toolbar operations.

### Cards & Stack Tiles
- **Glass Shell:** Multi-layered background with `backdrop-filter: blur(12px)`, `1px solid rgba(39, 39, 42, 0.8)`, and internal inset highlight (`inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`).
- **Interactive State:** Hover invokes the gradient border flow and lifts the surface with a localized `rgba(99, 102, 241, 0.08)` background tint.
- **Header Structure:** Combines the service icon, framework title in Geist, and a JetBrains Mono version tag anchored right.

### Monospace Badges & Status Chips
- **Tech Stack Badges:** JetBrains Mono (`11px`), upper- or lower-case literal (e.g., `v2.4.0`, `postgresql`, `rust`), padded with `space-xs` vertically and `space-sm` horizontally. Background `rgba(39, 39, 42, 0.5)`, text `#9ca3af`, border `1px solid rgba(63, 63, 70, 0.6)`.
- **Validation Chips (Emerald):** Radiates a live heartbeat: `rgba(16, 185, 129, 0.1)` background, `#10b981` text, with a pulsing `6px` emerald circle indicator.

### Pill Selectors
- Embedded segmented controls housed in an enclosed zinc-950 trench (`rgba(0, 0, 0, 0.4)` with inset border).
- Active item snaps into a solid pill with subtle glass sheen, bordered by hairline indigo or white micro-border, typography shifting from `#9ca3af` to crisp `#ffffff`.

### Input Fields & CLI Prompts
- High-density dark input surfaces (`#060a12`), inset border `1px solid rgba(39, 39, 42, 0.8)`.
- Focus shifts border to `#6366f1` with zero fuzzy focus rings, opting instead for a razor-thin dual border or `0 0 0 1px #6366f1` coupled with faint indigo ambient wash.
- Left accessory incorporates terminal chevron (`>`) in JetBrains Mono at `#6366f1`.

### Checkboxes & Switch Controls
- Custom square checkboxes (`16x16px`) with `2px` corners, deep slate fill, and zinc-700 borders. Checked state triggers solid `#6366f1` background with a crisp white check vector.
- Switches feature flat pill-slot mechanics (`18px` height) with a rolling circular zinc-100 thumb that glows emerald upon service connection.