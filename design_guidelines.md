# E-Sched Connect Design Guidelines

## Design Approach
**System-Based Approach**: Drawing from Linear's productivity aesthetics and Material Design's comprehensive patterns. This educational scheduling platform requires clarity, efficiency, and professional trustworthiness over visual flair.

## Typography System

**Font Family**: Inter via Google Fonts CDN
- **Display/Headers**: 600-700 weight, tracking-tight
- **Body Text**: 400-500 weight, leading-relaxed for readability
- **Data/Tables**: 400 weight, tabular-nums for alignment
- **Buttons/Labels**: 500-600 weight, uppercase for actions

**Scale**:
- Page Titles: text-3xl to text-4xl
- Section Headers: text-xl to text-2xl  
- Card/Module Titles: text-lg
- Body/Forms: text-base
- Labels/Captions: text-sm
- Table Data: text-sm with tabular-nums

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing: gap-2, p-2 (table cells, compact lists)
- Standard spacing: gap-4, p-4 (cards, form fields)
- Section spacing: gap-8, p-8 (major sections)
- Page padding: p-6 to p-12 (content areas)

**Grid System**:
- Dashboard: 12-column grid for flexible layouts
- Forms: Single column max-w-2xl for readability
- Tables: Full-width with horizontal scroll on mobile
- Calendar: 7-column grid (days of week)

**Container Widths**:
- Main content: max-w-7xl mx-auto
- Forms/Detail views: max-w-4xl
- Modals: max-w-2xl

## Component Library

### Navigation
**Top Navigation Bar**:
- Fixed header with shadow-sm
- Logo left, user profile/notifications right
- Height: h-16
- Links: inline with hover states

**Sidebar Navigation** (Admin/Professor dashboards):
- Fixed left sidebar, w-64
- Collapsible on mobile (hamburger menu)
- Icon + label pattern for menu items
- Active state clearly distinguished
- Spacing: py-2 per item, px-4 padding

### Dashboard Components
**Stat Cards**:
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Padding: p-6
- Icon top-left, number large (text-3xl), label below
- Border or subtle shadow for definition

**Data Tables**:
- Striped rows for readability
- Header row with sorting indicators
- Actions column right-aligned
- Pagination below table
- Row hover states
- Sticky header for long tables

**Calendar View**:
- Full-width grid layout
- Day/Week/Month toggle
- Time slots in 30-minute or 1-hour increments
- Schedule blocks with professor/room info
- Conflict indicators (border treatment)
- Drag-and-drop affordance

### Forms
**Input Fields**:
- Label above input (text-sm font-medium)
- Full-width inputs with p-3
- Border radius: rounded-md
- Focus ring for accessibility
- Error states with text-sm text below
- Required field indicators

**Select Dropdowns**:
- Native select styling or custom dropdown
- Chevron icon right-aligned
- Multi-select with tags for subjects/rooms

**Action Buttons**:
- Primary: Solid fill, px-6 py-3, rounded-md
- Secondary: Outline style, same padding
- Destructive: Distinct treatment for delete actions
- Icon + text for clarity

### Cards & Modules
**Schedule Cards** (Professor view):
- Padding: p-6
- Time/day prominent at top
- Subject, room, duration clearly listed
- Action buttons bottom-right
- Border radius: rounded-lg

**Request Cards** (Adjustment requests):
- Status badge top-right
- Original vs. requested schedule comparison
- Reason/notes in collapsed section
- Approve/Deny buttons for admin

### Modals & Overlays
**Modal Dialogs**:
- Centered overlay with backdrop
- Max width: max-w-2xl
- Padding: p-6
- Header with title and close button
- Footer with action buttons right-aligned

**Notifications/Toasts**:
- Top-right corner, fixed positioning
- Success/Error/Info variants
- Auto-dismiss after 5 seconds
- Icon + message + close button

### Conflict Detection UI
**Visual Indicators**:
- Warning borders on conflicting schedule blocks
- Conflict list panel with clear descriptions
- Real-time validation messages below form fields
- Color-coding for severity (handled via borders/icons, not colors)

## Color Palette

**Primary Colors**:
- Primary Orange: HSL(24.6, 95%, 53.1%) - Main brand color
- Success Green: HSL(143, 60%, 24%) - RGB(22, 101, 52) - Status indicators, positive actions
- Destructive Red: HSL(0, 84.2%, 60.2%) - Error states, deletions
- Muted Gray: HSL(60, 4.8%, 95.9%) - Secondary UI elements

**Charts**:
- Chart 1 (Red): HSL(12, 76%, 61%)
- Chart 2 (Teal): HSL(173, 58%, 39%)
- Chart 3 (Blue): HSL(197, 37%, 24%)
- Chart 4 (Yellow): HSL(43, 74%, 66%)
- Chart 5 (Orange): HSL(27, 87%, 67%)

**Semantic Usage**:
- Success: For approved requests, completed tasks
- Destructive: For cancellations, denials, deletions
- Primary: For primary actions and interactive elements
- Muted: For secondary information and disabled states

## Data Visualization

**Reports Section**:
- Charts using Chart.js or Recharts
- Bar charts for workload distribution
- Heatmaps for room utilization
- Export button prominent (top-right)

**Tabular Timetables**:
- Days as columns, time slots as rows
- Merged cells for multi-hour classes
- Professor/Room info in cells
- Print-optimized layout

## Responsive Behavior

**Breakpoints**:
- Mobile: Stack all cards/forms single column
- Tablet (md:): 2-column grids, sidebar toggles
- Desktop (lg:): Full multi-column layouts, fixed sidebar

**Mobile Optimizations**:
- Bottom navigation for key actions
- Collapsible table columns (show essential only)
- Simplified calendar view (day/list view default)

## Accessibility Standards
- Minimum touch targets: 44x44px
- Form labels always visible (no placeholder-only)
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Keyboard navigation throughout
- Screen reader announcements for dynamic updates

## Animation Guidelines
**Minimal Motion**:
- Page transitions: None or simple fade
- Modal entry: Scale from 0.95 to 1 (150ms)
- Dropdown menus: Slide down (200ms)
- Toast notifications: Slide in from right
- Avoid distracting animations on data updates

## Icons
**Heroicons** (via CDN) - outline style for consistency
- Navigation: Home, Calendar, Users, ClipboardList, Cog
- Actions: Plus, Pencil, Trash, Check, X
- Status: ExclamationCircle, CheckCircle, Clock

## Images
**Limited Image Usage**:
- User avatars in navigation/profile (rounded-full)
- Empty states: Simple illustrations for "no data" states
- No hero images - this is a utility application
- Focus on data clarity over visual decoration

This design prioritizes **data density, workflow efficiency, and professional clarity** suitable for daily administrative and academic use.