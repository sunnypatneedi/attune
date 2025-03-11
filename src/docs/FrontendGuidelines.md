# Adaptive Chat UI - Frontend Development Guidelines

## Overview
This document outlines the standards, best practices, and conventions to be followed when developing and maintaining the Adaptive Chat UI framework. Adherence to these guidelines ensures consistency, maintainability, and high-quality code throughout the project.

## Biophilic Design Implementation

### Color System
- Always use the defined color variables instead of hardcoded values:
  ```css
  /* Correct */
  color: var(--primary-color);
  
  /* Incorrect */
  color: #176D81;
  ```

- The biophilic color palette consists of:
  - Primary: Deep teal (`--primary-color`, #176D81)
  - Secondary: Warm amber (`--secondary-color`, #E19131)
  - Tertiary: Sage green (`--tertiary-color`, #7BA05B)
  - Neutral: Warm gray (`--neutral-color`, #E6E2DD)

- Apply colors with purpose:
  - Primary color for main UI elements and structural components
  - Secondary color for interactive elements, highlights, and call-to-actions
  - Tertiary color for supporting elements and visual accents
  - Neutral color for backgrounds, containers, and subtle UI elements

### Typography System
- Use the defined typography variables for consistent text styling:
  ```css
  /* Correct */
  font-family: var(--font-heading);
  
  /* Incorrect */
  font-family: 'Outfit', sans-serif;
  ```

- Typography hierarchy:
  - Headings: Outfit font (`--font-heading`)
  - Body text: Source Sans Pro (`--font-body`)
  - UI elements: Inter (`--font-ui`)

- Type scale guidelines:
  ```
  h1: 2.5rem
  h2: 2rem
  h3: 1.75rem
  h4: 1.5rem
  body: 1rem
  small: 0.875rem
  ```

### Component Design
- Incorporate organic shapes through border-radius:
  ```css
  /* Preferred: slightly irregular radius values */
  border-radius: 12px 14px 10px 15px;
  
  /* Alternative: consistent but organic */
  border-radius: 12px;
  ```

- Use subtle gradients that reflect natural environments:
  ```css
  background: linear-gradient(145deg, 
    var(--primary-color), 
    color-mix(in srgb, var(--primary-color), black 15%)
  );
  ```

- Implement natural motion principles in animations:
  - Ease-in-out transitions rather than linear
  - Subtle parallax effects
  - Animation timing that mimics natural movement (e.g., breathing, water)

## Code Organization

### Component Structure
- Each component should have:
  - A clearly defined, single responsibility
  - Proper TypeScript interfaces for props
  - JSDoc comments explaining purpose and usage
  - Carefully managed side effects

- Example component structure:
  ```tsx
  /**
   * Message component displays a chat message with appropriate styling
   * based on message type and content analysis.
   */
  interface MessageProps {
    /** The message content and metadata */
    message: EnhancedMessage;
    /** Whether to show the sender's avatar */
    showAvatar?: boolean;
    /** Callback when message is interacted with */
    onInteraction?: (messageId: string, action: string) => void;
  }
  
  export const Message: React.FC<MessageProps> = ({
    message,
    showAvatar = true,
    onInteraction
  }) => {
    // Component implementation
  };
  ```

### File Naming Conventions
- Component files: `kebab-case.tsx`
- Utility files: `camelCase.ts`
- Type definition files: `kebab-case-types.ts`
- Test files: `componentName.test.tsx`
- CSS modules: `componentName.module.css`

### Directory Structure
```
/components
  /common           # Shared components
  /chat             # Chat-specific components
  /demo             # Demo showcase components
/hooks              # Custom React hooks
/lib                # Core framework utilities
/styles             # Global styles and variables
/types              # TypeScript type definitions
/utils              # Helper functions
/docs               # Documentation
```

## Coding Standards

### TypeScript Best Practices
- Use explicit typing rather than inferring when defining state and props
- Prefer interfaces for objects that represent "things" (props, state)
- Use type aliases for unions, intersections, and simpler types
- Avoid `any` - use `unknown` with type guards instead
- Leverage discriminated unions for complex state management

Example:
```typescript
// Good
interface MessageState {
  status: 'sending' | 'sent' | 'failed';
  content: string;
  timestamp: number;
}

// Avoid
const [message, setMessage] = useState<any>({});
```

### React Patterns
- Use functional components with hooks
- Implement custom hooks for reusable logic
- Employ the compound component pattern for complex components
- Apply controlled components for form elements
- Use memoization appropriately for performance optimization

Example:
```typescript
// Custom hook example
function useMessageFormatter(message: EnhancedMessage) {
  return useMemo(() => {
    return {
      formattedText: highlightEntities(message.text, message.entities),
      intentionClass: getIntentionClassName(message.primaryIntention),
      timestamp: formatMessageTime(message.timestamp)
    };
  }, [message]);
}
```

### CSS Guidelines
- Use CSS variables for theme properties
- Employ BEM-inspired naming convention:
  ```css
  .message-bubble {}
  .message-bubble--user {}
  .message-bubble__timestamp {}
  ```
- Keep specificity low through shallow selectors
- Avoid using `!important`
- Leverage CSS Grid and Flexbox for layouts
- Include print styles for applicable components

Example:
```css
.chat-container {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: var(--spacing-md);
  height: 100%;
}

.message-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
```

## Accessibility Standards

### Core Requirements
- Semantic HTML structure
- Appropriate ARIA attributes when necessary
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (minimum WCAG AA)
- Focus management for interactive elements

Example:
```tsx
// Good
<button
  aria-label="Send message"
  onClick={handleSend}
  disabled={!message}
>
  <IconSend />
</button>

// Avoid
<div onClick={handleSend} className="send-button">
  <IconSend />
</div>
```

### Internationalization Considerations
- Support for RTL languages
- Text components that handle different language lengths
- Date/time formatting based on locale
- Translation-ready text (avoid hardcoded strings)

## Performance Guidelines

### Rendering Optimization
- Use `React.memo()` for components that render often but rarely change
- Implement virtualization for long lists of messages
- Avoid anonymous functions in render methods
- Keep component state as local as possible
- Use the React Profiler to identify performance bottlenecks

### Asset Optimization
- Optimize images with Next.js Image component
- Use SVG for icons and simple illustrations
- Implement lazy loading for non-critical components
- Configure appropriate caching strategies

## Testing Requirements

### Component Testing
- Test at least the following aspects:
  - Rendering with different props
  - User interactions
  - State changes
  - Error handling

Example test:
```typescript
describe('Message component', () => {
  it('renders user message correctly', () => {
    const message = createMockMessage({
      sender: 'user',
      text: 'Hello world'
    });
    
    render(<Message message={message} />);
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByTestId('message-bubble')).toHaveClass('message-bubble--user');
  });
  
  it('triggers onInteraction callback when clicked', () => {
    const handleInteraction = jest.fn();
    const message = createMockMessage({ id: '123' });
    
    render(<Message message={message} onInteraction={handleInteraction} />);
    
    fireEvent.click(screen.getByTestId('message-action-button'));
    expect(handleInteraction).toHaveBeenCalledWith('123', 'viewDetails');
  });
});
```

### Accessibility Testing
- Run automated tests with tools like jest-axe
- Include screen reader testing in QA process
- Perform keyboard navigation testing
- Test color contrast with accessibility tools

## Code Review Checklist

### Functional Review
- Does the component fulfill its intended purpose?
- Is the behavior consistent across different browsers/devices?
- Are edge cases handled appropriately?
- Is there proper error handling?

### Technical Review
- Does the code follow the project's style guidelines?
- Are there any unnecessary re-renders or performance issues?
- Is the code DRY (Don't Repeat Yourself) but also pragmatic?
- Are there appropriate types and interfaces?

### Accessibility Review
- Is semantic HTML used appropriately?
- Are ARIA attributes used correctly when needed?
- Is the component fully keyboard accessible?
- Does it meet color contrast requirements?

### Design Review
- Does the implementation match the design specifications?
- Is the biophilic design system applied consistently?
- Are animations and transitions smooth and natural?
- Is the component responsive across all breakpoints?

## Documentation Standards

### Component Documentation
- Each component should include:
  - Purpose description
  - Props documentation with types and defaults
  - Usage examples
  - Implementation notes or caveats

Example:
```tsx
/**
 * @component IntentionTag
 * @description Displays a visual indicator of a message's detected intention
 * 
 * @example
 * <IntentionTag type="QUESTION_FACTUAL" confidence={0.85} />
 * 
 * @param {object} props - Component props
 * @param {IntentionType} props.type - The type of intention
 * @param {number} props.confidence - Confidence score (0-1)
 * @param {boolean} [props.showLabel=true] - Whether to show the text label
 */
```

### Code Comments
- Use JSDoc for public API functions and components
- Add inline comments for complex logic
- Comment "why" rather than "what" when possible
- Keep comments updated when changing code

## Version Control Guidelines

### Commit Standards
- Use conventional commits format:
  ```
  feat: add message reaction capability
  fix: resolve entity highlighting in RTL mode
  chore: update dependencies
  docs: improve component documentation
  ```

- Keep commits focused on a single concern
- Write descriptive commit messages
- Reference issue numbers when applicable

### Branch Strategy
- `main`: Production-ready code
- `develop`: Next release development
- `feature/feature-name`: New features
- `fix/issue-description`: Bug fixes
- `refactor/scope`: Code improvements without feature changes

## Collaboration Tools
- Design System: Figma components and prototypes
- Issue Tracking: GitHub Issues
- Documentation: Markdown files in repo
- Code Review: GitHub Pull Requests
- API Documentation: Generated from JSDoc

## Additional Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/)
