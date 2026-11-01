// Product card used on the catalogue and in "more like this". Mirrors the design's pack cards.
import { h, links } from './ui.js';
import { lookFor, primaryImage } from './product-look.js';

export function productCard(p, { headingLevel = 3, eager = false } = {}) {
  const look = lookFor(p);
  const im = primaryImage(p);
  return h('article', { class: 'pcard reveal', vars: { '--c': look.c, '--cf': look.f } },
    h('div', { class: 'pimg' },
      im
        ? h('img', { src: im.url, alt: im.alt_text || p.name, loading: eager ? 'eager' : 'lazy', decoding: 'async' })
        : h('div', { class: 'noimg' }, 'Photo to come')),
    look.line ? h('p', { class: 'maker' }, look.line) : null,
    h(`h${headingLevel}`, {}, h('a', { href: links.product(p.slug) }, p.name)),
    p.short_description ? h('p', { class: 'desc' }, p.short_description) : null,
    p.pack_size_label ? h('span', { class: 'size' }, p.pack_size_label) : null);
}

export function skeletonCards(n) {
  return Array.from({ length: n }, () => h('div', { class: 'pcard is-skel skel', 'aria-hidden': 'true' }));
}
