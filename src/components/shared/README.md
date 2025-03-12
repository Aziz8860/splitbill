# Splitbill UI Components

This directory contains shared UI components for the Splitbill application. These components are designed to provide a consistent look and feel across the application.

## Color Palette

The application uses a consistent color palette defined in `tailwind.config.mjs`:

- **Primary**: #793EF4 (Purple)
- **Secondary**: #6C7280 (Gray)
- **Success**: #10B981 (Green)
- **Danger**: #EF4444 (Red)

Each color has various shades (50-900) for different use cases.

## Components

### Button

```jsx
import { Button } from '@/components/shared/Button';

// Usage
<Button variant="primary">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="danger">Danger Button</Button>
<Button variant="success">Success Button</Button>

// Sizes
<Button size="sm">Small Button</Button>
<Button size="md">Medium Button</Button>
<Button size="lg">Large Button</Button>

// States
<Button isLoading={true}>Loading Button</Button>
<Button isDisabled={true}>Disabled Button</Button>
```

### Card

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/shared/Card';

// Usage
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    Card Content
  </CardContent>
  <CardFooter>
    Card Footer
  </CardFooter>
</Card>

// Variants
<Card variant="default">Default Card</Card>
<Card variant="elevated">Elevated Card</Card>
<Card variant="outlined">Outlined Card</Card>
<Card variant="filled">Filled Card</Card>
```

### Input

```jsx
import { Input, Label, FormGroup } from '@/components/shared/Input';

// Usage
<FormGroup>
  <Label htmlFor="name" required>Name</Label>
  <Input id="name" placeholder="Enter your name" />
</FormGroup>

// With error
<FormGroup error="This field is required">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" error={true} />
</FormGroup>
```

## CSS Classes

The application also provides CSS classes for consistent styling:

```css
/* Button styles */
.hero-button-primary
  .hero-button-secondary
  .hero-button-outline
  .hero-button-danger
  .hero-button-success;
```

These classes can be used directly in className props for consistent styling.
