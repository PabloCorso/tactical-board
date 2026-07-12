---
name: react-component-design
description: Design, review, and refactor understandable React component APIs. Use when creating React components, choosing between props and composition, organizing component files, reducing conditional variants or prop tunnelling, or deciding where state and context belong.
---

# React Component Design

Keep behavior and invariants encapsulated. Expose presentation and layout through composition.

If the caller knows which UI pieces it wants, let it compose them. If only the component knows how behavior must work, encapsulate the decision.

## 1. Expose configurable parts

Expose a meaningful inner part as a component when consumers may need to configure it directly—even if its placement never changes. This keeps props on the component that owns them and avoids growing the root API with tunneled props such as titleId, titleClassName, etc.

### Don't

```tsx
type CardProps = React.ComponentProps<"section"> & {
  title: React.ReactNode;
  titleClassName?: string;
};

function Card({ title, titleClassName, children, ...props }: CardProps) {
  return (
    <section {...props}>
      <h2 className={titleClassName}>{title}</h2>
      {children}
    </section>
  );
}
```

### Do

```tsx
function Card(props: React.ComponentProps<"section">) {
  return <section {...props} />;
}

function CardTitle(props: React.ComponentProps<"h2">) {
  return <h2 {...props} />;
}

// Consumer can now add any props to the title without tunneling them through the Card API
<Card>
  <CardTitle id="billing-title" className="text-accent">
    {title}
  </CardTitle>
</Card>;
```

## 2. Leverage underlying element props

Start with the wrapped element's props, then add component-specific props. Spread remaining props onto the element so consumers retain native attributes, events, `aria-*`, and `data-*`. Spread props last so consumers can override component defaults, but apply merged styles and invariants after spreading.

### Don't

```tsx
type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  loading?: boolean;
};
```

### Do

```tsx
type ButtonProps = React.ComponentProps<"button"> & {
  loading?: boolean;
};

function Button({ loading, disabled, className, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn("button", className)}
      {...props}
    />
  );
}
```

Spread general props first, then apply merged styles and invariants consumers must not override.

## 3. Order files by public API

Put the main exported component first, then private components and utilities. Keep each type next to its component. Use function declarations for hoisting and inline named exports; avoid default exports and export lists.

### Don't

```tsx
type SubscriptionSummaryProps = {
  /* ... */
};
type SubscriptionDateProps = {
  /* ... */
};

function formatDate(value: Date) {
  /* ... */
}
function SubscriptionDate(props: SubscriptionDateProps) {
  /* ... */
}
function SubscriptionSummary(props: SubscriptionSummaryProps) {
  /* ... */
}

export { SubscriptionSummary };
```

### Do

```tsx
export type SubscriptionSummaryProps = React.ComponentProps<"section"> & {
  renewsAt: Date;
};

export function SubscriptionSummary({
  renewsAt,
  ...props
}: SubscriptionSummaryProps) {
  return (
    <section {...props}>
      <SubscriptionDate renewsAt={renewsAt} />
    </section>
  );
}

type SubscriptionDateProps = React.ComponentProps<"span"> &
  Pick<SubscriptionSummaryProps, "renewsAt">;

function SubscriptionDate({ renewsAt, ...props }: SubscriptionDateProps) {
  return <span {...props}>{`Renews ${formatDate(renewsAt)}`}</span>;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(value);
}
```

## 4. Split files by responsibility

Keep a reusable component family together. Split domain components when parts have substantial independent responsibilities. Do not split by export count or line count.

### Don't

```text
combobox/
  root.tsx
  input.tsx
  item.tsx

workflows/
  workflow-list.tsx  # list and complex item logic
```

### Do

```text
components/
  combobox.tsx

workflows/
  workflow-list.tsx
  workflow-step.tsx
  workflow-step-header.tsx
  workflow-step-content.tsx
```
