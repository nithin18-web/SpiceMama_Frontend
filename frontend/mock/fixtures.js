// DEVELOPMENT ONLY. Sample data shaped exactly like API_CONTRACT.yaml.
// Product names, descriptions and pack sizes come from the approved design / pack art.
// Categories are a MOCK grouping until the owner confirms the real ones.
// Nothing in /mock is deployed to production.

const img = (slug, alt) => [{ id: 0, url: `/assets/images/packs/${slug}.webp`, alt_text: alt, sort_order: 0 }];

export const categories = [
  { id: 1, name: 'Chilli powders', slug: 'chilli-powders', description: 'Chilli powders made from red chillies from Guntur.', sort_order: 1, is_active: true },
  { id: 2, name: 'Spices', slug: 'spices', description: null, sort_order: 2, is_active: true },
  { id: 3, name: 'Masalas', slug: 'masalas', description: null, sort_order: 3, is_active: true },
  { id: 4, name: 'Flours', slug: 'flours', description: null, sort_order: 4, is_active: true },
];

const P = (id, slug, name, category_id, short_description, description, pack_size_label, ingredients, alt) => ({
  id, slug, name, category_id, short_description, description, pack_size_label, ingredients,
  status: 'published', sort_order: id, images: img(slug, alt),
});

export const products = [
  P(1, 'guntur-gold-premium-chilli-powder', 'Guntur Gold Premium Chilli Powder', 1,
    'A blend of premium dried red chillies.',
    'A perfect blend of premium dried red chillies.',
    null, null, 'Guntur Gold Premium Chilli Powder stand-up pouch'),
  P(2, 'chilli-powder-guntur-special', 'Chilli Powder', 1,
    'Red and hot Guntur chilli, from the premium range.',
    'Made from red chillies from Guntur, packed to keep their freshness and flavour.',
    '500 g', 'Chilli', 'Spice Mama Guntur Special Chilli Powder pack'),
  P(3, 'coriander-powder', 'Coriander Powder', 2,
    'Green coriander from M.P. and Rajasthan.',
    'Made from green coriander from Madhya Pradesh and Rajasthan.',
    '100 g', 'Coriander', 'Spice Mama Aroma Special Coriander Powder pack'),
  P(4, 'oont-chap-chilli-powder', 'Chilli Powder, Pure Spices', 1,
    'Made from handpicked Guntur chillies.',
    'Made from handpicked Guntur chillies.',
    '500 g', null, 'Oont Chap Chilli Powder, Pure Spices pack'),
  P(5, 'turmeric-powder', 'Turmeric Powder', 2,
    'Turmeric from Erode, with no added colours.',
    'Made from fresh turmeric from Erode.',
    '100 g', 'Turmeric', 'Spice Mama Aroma Special Turmeric Powder pack'),
  P(6, 'sambar-powder', 'Sambar Powder', 3,
    'A premium blend of aromatic spices for sambar.',
    'A premium blend of aromatic spices for sambar.',
    '100 g', null, 'Spice Mama Sambar Powder pack'),
  P(7, 'rasam-powder', 'Rasam Powder', 3,
    'A premium blend of aromatic spices for rasam.',
    'A premium blend of aromatic spices for rasam.',
    null, null, 'Spice Mama Rasam Powder pack'),
  P(8, 'kasuri-methi', 'Kasuri Methi', 2,
    'Dried fenugreek leaves.',
    'Dried fenugreek leaves.',
    '100 g', null, 'Spice Mama Kasuri Methi pack'),
  P(9, 'garam-masala', 'Garam Masala', 3,
    'A premium blend of aromatic whole spices, ground.',
    'A premium blend of aromatic whole spices, ground.',
    null, null, 'Spice Mama Garam Masala pack'),
  P(10, 'chicken-masala', 'Chicken Masala', 3,
    'A premium spice blend for chicken curry.',
    'A premium spice blend for chicken curry.',
    null, null, 'Spice Mama Chicken Masala pack'),
  P(11, 'ragi-flour', 'Ragi Flour', 4,
    'Finger millet flour, for dosa, roti and mudde.',
    'Finger millet flour, for dosa, roti and mudde.',
    '500 g', null, 'Spice Mama Ragi Flour pack'),
].map((p) => ({ ...p, images: p.images.map((im) => ({ ...im, id: p.id * 10 })) }));
