# SpiceMama — Business, Content and Visual Brief

## What this business/site is
SpiceMama is a brand website for Indian spices. Its first release is a product **catalogue and brand presentation**, not a transactional e-commerce shop. Visitors should explore spice products and categories, learn about the brand, and contact the business. Admins must manage the catalogue without asking a developer to redeploy.

## Audiences and goals
- Customers exploring spices on mobile, especially India-based visitors.
- Wholesale/distributor inquiries may be supported via contact information **only if the owner confirms**.
- Primary goals: discover products, understand product details, trust the brand, and contact the business.
- Secondary goal: preserve architecture for later India-only e-commerce.

## Brand direction (proposed, owner to approve)
Premium, warm, modern Indian spice heritage; appetizing photography, clean readable typography, generous whitespace, rich chili red, turmeric gold, warm cream and subtle leaf green. Avoid visual clutter. Premium does not mean heavy animations or slow pages. Provide a design system with tokens for colors, type, spacing, radii and components. Ensure contrast and keyboard access.

## Pages (phase 1)
1. Home: hero, featured categories/products, brand introduction, trust/story content, contact CTA.
2. Product catalogue: categories, product cards, search/filter (client-side or API query), pagination if needed.
3. Product detail: name, gallery, description, pack sizes/ingredients **only if confirmed**, contact CTA.
4. About/Our Story: owner-approved text and imagery.
5. Contact: approved business contact information, optional WhatsApp link; contact form only if backend is explicitly scoped.
6. 404 and generic error states.
7. Admin: login, dashboard, products list, product create/edit, image management, categories; accessible only to authenticated administrators.
8. Privacy policy/terms as owner-approved content; don't fabricate legal text.

## UX states and quality
Mobile-first, desktop polished; loading, empty, error, offline/timeout, invalid form, upload progress and success states. No misleading fake testimonials, review counts, certifications or invented business claims. Use accessible form labels, visible focus, alt text, semantic headings, reduced-motion support. Optimize Core Web Vitals: compress images, lazy-load below fold, avoid huge JS bundles, avoid auto-play heavy media.

## Content model
Product: ID, slug, name, short and full description, category, optional pack-size display, optional ingredients, sort order, status, images with alt text. **Price and stock are not displayed in v1 unless the owner explicitly approves.** Product images and factual claims require owner-provided/approved assets. Use clearly labeled placeholders during development.

## Animation guidance
Subtle reveal on scroll, tasteful hover and page transitions; use CSS and IntersectionObserver first, GSAP only if justified and approved. Honor prefers-reduced-motion. Keep navigation and product browsing fast.

## Business decisions pending
- Exact brand voice and logo files
- Actual categories and catalogue items
- Is 'contact for enquiry' via phone, WhatsApp, email, or form?
- Product details (ingredients, sizes, nutrition, origin) approved for publication
- Whether to show prices in showcase phase
- Legal pages, policies, social links and business identity
