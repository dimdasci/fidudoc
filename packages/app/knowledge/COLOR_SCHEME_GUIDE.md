# Color Scheme Usage Guide

## Overview

The color scheme has been updated to reduce visual overload while maintaining the green brand identity. The main change is separating neutral text colors from accent colors to create better visual hierarchy.

## Color Token Structure

### Text Colors

| Token              | Light Mode               | Dark Mode                  | Usage                                |
| ------------------ | ------------------------ | -------------------------- | ------------------------------------ |
| `--text-primary`   | `#1f2937` (neutral gray) | `#f9fafb` (off-white)      | Body text, general content           |
| `--text-heading`   | `#14532d` (brand green)  | `#22c55e` (bright green)   | Headings, page titles                |
| `--text-accent`    | `#15803d` (brand green)  | `#34d399` (emphasis green) | Links, emphasis, call-to-action text |
| `--text-secondary` | `#6b7280` (muted gray)   | `#9ca3af` (muted gray)     | Supporting text, captions            |

### Semantic State Colors

| Token                          | Light Mode            | Dark Mode             | Usage          |
| ------------------------------ | --------------------- | --------------------- | -------------- |
| `--success` / `--success-text` | `#15803d` / `#14532d` | `#22c55e` / `#bbf7d0` | Success states |
| `--warning` / `--warning-text` | `#d97706` / `#92400e` | `#f59e0b` / `#fde68a` | Warning states |
| `--error` / `--error-text`     | `#dc2626` / `#991b1b` | `#ef4444` / `#fca5a5` | Error states   |

## CSS Utility Classes

### Text Color Classes

```css
.text-primary     /* Normal body text - neutral color */
.text-heading     /* Page/section headings - brand green */
.text-accent      /* Links, emphasis - brand green */
.text-secondary   /* Supporting text - muted gray */
.text-success     /* Success messages */
.text-warning     /* Warning messages */
.text-error       /* Error messages */
```

## Usage Guidelines

### ✅ Do Use

- **`.text-primary`** for: Body text, table content, form labels, general content
- **`.text-heading`** for: Page titles, section headings, component titles
- **`.text-accent`** for: Links, buttons with text, call-to-action elements, emphasis
- **`.text-secondary`** for: Captions, metadata, supporting information

### ❌ Avoid

- Using `.text-heading` for body text (too visually heavy)
- Using `.text-accent` everywhere (creates visual noise)
- Mixing heading colors with primary text inappropriately

## Component-Specific Patterns

### Headers and Titles

```tsx
<h1 className="text-headline text-heading">{title}</h1>
<p className="text-body text-secondary">{subtitle}</p>
```

### Tables

```tsx
<td className="text-body-sm text-primary">{content}</td>
<span className="text-body-sm text-secondary">{metadata}</span>
```

### Links and Buttons

```tsx
<a className="text-accent hover:underline">{linkText}</a>
<button className="text-accent">{actionText}</button>
```

### Forms

```tsx
<label className="text-body-sm text-primary">{label}</label>
<input className="text-primary" />
<span className="text-caption text-secondary">{helpText}</span>
```

## Migration Notes

### What Changed

1. **Primary text color** changed from brand green (`#14532d`) to neutral gray (`#1f2937`)
2. **New `text-heading` token** introduced for strategic brand color usage
3. **Improved `text-accent` token** for emphasis and interactive elements
4. **Updated components**: Logo, page headers, and some core UI components

### Benefits

- **Reduced visual fatigue**: Neutral primary text is easier to read
- **Better hierarchy**: Green now signals importance and interactivity
- **Maintained brand identity**: Logo and headings still use brand colors
- **Improved accessibility**: Better contrast ratios for body text
- **Strategic emphasis**: Green color draws attention to the right elements

## Testing the Changes

To see the improvements:

1. Compare body text readability (should be less overwhelming)
2. Notice how headings and logos stand out with the brand green
3. Check that links and interactive elements are clearly emphasized
4. Verify the visual hierarchy feels more balanced
