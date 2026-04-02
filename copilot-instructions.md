# Copilot Instructions for Watch Ecommerce

Use these instructions when generating or modifying code in this repository.

## Layer 0: UX-First Override

For this project, prioritize user experience, visual quality, and smooth interactions over strict backend correctness when trade-offs are required.

Priority order for this project:

1. User Experience (UX) and smooth interactions
2. Visual design and responsiveness
3. Feature completeness for demo
4. Perceived performance (fast UI, loading states)
5. Code structure and backend correctness

- Prefer fast and responsive UI even if backend logic is simplified.
- It is acceptable to mock or simplify complex flows such as payment for demo purposes.
- Avoid breaking user flow with overly strict validation unless necessary.
- Focus on making admin and user flows intuitive, fast, and visually pleasing.

## Layer 1: Priority Rules

When rules conflict, follow this order:

1. UX-First Override
2. Security Rules
3. Payment Rules
4. Database Rules
5. Architecture Rules
6. Coding Convention and Style

## Layer 1: Business Invariants

- Order total must always match the sum of its items and discounts.
- Inventory must never go below zero.
- An order cannot become paid without verified payment.
- A user cannot access or modify another user's data without authorization.

## Layer 1: Data Flow Rules

- Data must flow Controller -> Service -> Model.
- Do not bypass layers with direct database logic in controllers.
- Avoid circular dependencies between modules.

## Layer 1: Non-Negotiables

- Protect security, payment, and data integrity unless explicitly simplified for demo UX.
- Keep changes localized to the task at hand.
- Preserve existing behavior unless a change is required.
- Prefer clarity over cleverness.

## Layer 2: Architecture

- Controller: request parsing, basic validation, response mapping only.
- Service: business logic.
- Model: schema and simple model-level concerns only.
- If data-access logic grows, introduce a repository/DAO layer.
- Keep each function focused on one responsibility.

## Layer 2: Definition of Done

A task is complete when:

- Code follows architecture and coding conventions.
- No obvious duplication or dead code is introduced.
- Errors are handled through the global error handler, or simplified safely for demo.
- At least one test is added or updated when the change is testable.
- No sensitive data is exposed.
- UI and UX flow should remain smooth and not block the user unnecessarily.

## Layer 2: Coding Convention

- Use `async/await` instead of chained `.then()` calls.
- Use `camelCase` for variables and functions.
- Use `PascalCase` for classes, React components, and model/service names.
- Keep functions short; split them when they grow or branch too much.
- Reuse helpers, services, and shared utilities instead of duplicating logic.

## Layer 2: Validation Rules

- Validate incoming request data at the controller boundary.
- Prefer schema-based validation or centralized helpers.
- Reject clearly invalid data, but avoid disrupting user flow unnecessarily.
- Never trust client input, especially for IDs, prices, and payment data.

## Layer 2: API Response Shape

- Prefer a consistent response format:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

- Keep error responses consistent with the same style.

## Layer 2: Database Rules

- Avoid partial updates that can leave inconsistent states.
- Use atomic operations or transactions for critical flows such as order and payment.
- Always check entity existence before updating.
- Never trust client-provided values for sensitive fields such as price or status.

## Layer 2: Performance Rules

- Optimize for perceived performance with fast UI, loading states, and smooth transitions.
- Avoid unnecessary database queries.
- Use pagination for list endpoints.
- Do not load large datasets into memory when not needed.
- Prefer indexed queries and lean queries where appropriate.

## Layer 2: Error Handling

- Route technical errors through the global error handler when possible.
- Use an `AppError` pattern when a custom error is needed.
- Do not expose stack traces to the client.
- Prefer user-friendly error messages over technical ones.
- Avoid breaking user flows with harsh error responses.

## Layer 2: Logging Rules

- Log important events: auth, payment, order status changes, and cron jobs.
- Do not log sensitive data such as passwords, tokens, or full payment details.
- Use structured and consistent log messages.
- Keep logs useful but not overly verbose for demo purposes.

## Layer 2: Payment Rules

- Treat payment flows as important, but they may be simplified or mocked for demo.
- An order must not be paid twice.
- Verify or simulate callbacks safely before changing order state.
- Guard against duplicate callbacks and double-processing.

## Layer 2: Cron and AI Rules

- Cron jobs must be observable and logged.
- Avoid overly frequent schedules unless the task truly requires it.
- Add rate limiting or guard rails to AI-triggered flows.
- Never create infinite loops or self-triggering job cycles.
- Keep AI and cron logic deterministic and bounded.

## Layer 2: Refactoring Rules

- Do not refactor large parts of the codebase unless explicitly requested.
- Keep changes localized to the task at hand.
- Preserve existing behavior unless a change is required.

## Layer 2: Frontend Rules

- Page components should focus on layout and composition.
- Components should contain UI and small local logic only.
- Zustand stores should own shared state and API orchestration when practical.
- Prefer smooth interactions, loading states, and visual feedback.
- Avoid blocking UI flows with unnecessary complexity.
- Reuse shared UI patterns instead of duplicating markup and logic.

## Layer 2: Animation Rules

- Use subtle animations such as hover, fade, and transition to enhance perceived quality.
- Keep motion lightweight and purposeful.

## Layer 2: Loading UX Rules

- Always provide visual feedback for user actions such as loading, success, and error.
- Do not leave buttons or forms without any state change after user interaction.

## Layer 2: Admin Experience

- Admin UI should be fast, clean, and easy to use.
- Minimize steps for common actions such as edit, update, and delete.
- Prefer inline actions and quick edits.
- Provide immediate visual feedback with toast, loading, and success states.
- Focus on clarity and usability over strict backend complexity.

## Layer 2: Testing Rules

- Every new service method should have at least one unit test when possible.
- Add unit tests for important backend services.
- Add component tests for important frontend interactions.
- Critical flows such as checkout and payment should have basic E2E coverage.
- For demo, prioritize flow coverage over exhaustive coverage.
- Every new feature should include at least one meaningful test.
- Prefer tests that protect business rules, not just rendering snapshots.

## Layer 2: Security Rules

- Validate and sanitize input before using it.
- Keep auth and authorization checks explicit.
- Always assume input can be malicious.
- Never trust client-side validation.
- Double-check authorization for sensitive actions.
- Do not leak secrets, tokens, or stack traces.
- Be careful with payment, OAuth, and upload flows.
- Prefer secure defaults when in doubt.
- Apply reasonable security without harming UX unnecessarily.

## Layer 2: Complex Logic Guidance

- For complex business logic, add a short comment explaining the intent before implementing.
- Prefer clarity and explicit steps over compact code.

## Layer 2: Working Style

- Make the smallest change that solves the problem.
- Preserve existing naming, structure, and UI patterns unless a change is requested.
- Add TODO comments only when a follow-up is genuinely required.
- When uncertain, choose the safest and clearest approach while maintaining good UX.
