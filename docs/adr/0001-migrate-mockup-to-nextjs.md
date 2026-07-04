# 0001 - Migrate Mockup to Next.js Project

**Date:** 2026-07-04
**Status:** Accepted

## Context
- The design mockup for the Zenith Premium e‑commerce site exists as a static HTML file (`zenith_premium_e_commerce_mockup.html`) in the `docs` directory.
- The project is being converted to a modern Next.js application to leverage server‑side rendering, routing, and component‑based architecture.
- Team members need a clear record of why and how the migration was performed.

## Decision
- Create a dedicated Architecture Decision Record (ADR) in `docs/adr/0001-migrate-mockup-to-nextjs.md` documenting the migration.
- The HTML mockup will be used as a visual reference while implementing corresponding React components and pages in the Next.js codebase.
- The migration includes:
  - Translating static sections (hero, catalog, product detail, cart, checkout, etc.) into reusable React components.
  - Moving styling to a custom CSS design system that follows the project's visual aesthetics.
  - Adding routing via Next.js pages and dynamic routes for product detail pages.
  - Preserving the original mockup file for future reference and documentation.

## Consequences
- **Positive:**
  - Enables SEO‑friendly rendering, fast performance, and easier maintenance.
  - Allows incremental development of UI components with better type safety.
  - Aligns the project with modern web development best practices.
- **Negative:**
  - Initial development effort is higher as components need to be built from the mockup.
  - Existing static content must be kept in sync with the new implementation, requiring occasional checks.

## References
- Original mockup file: `docs/zenith_premium_e_commerce_mockup.html`
- Next.js documentation: https://nextjs.org/docs
- ADR template guidelines used in this repository.
