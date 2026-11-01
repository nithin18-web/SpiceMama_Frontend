// Site-wide settings. Business details here were approved by the owner (2026-11-01).

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
const isLocal = LOCAL_HOSTS.includes(location.hostname) || location.hostname.endsWith('.localhost');

// API mode: "mock" uses the in-browser adapter in /mock (development only),
// "live" calls the PHP backend at /api/v1. Production is always live.
// On a local host, add ?api=live or ?api=mock to switch; the choice is kept for the tab.
function pickApiMode() {
  if (!isLocal) return 'live';
  let mode = 'mock';
  try {
    const fromUrl = new URLSearchParams(location.search).get('api');
    if (fromUrl === 'mock' || fromUrl === 'live') sessionStorage.setItem('sm-api', fromUrl);
    mode = sessionStorage.getItem('sm-api') || mode;
  } catch { /* storage blocked: keep default */ }
  return mode;
}

export const config = Object.freeze({
  apiBase: '/api/v1',
  apiMode: pickApiMode(),
  timeoutMs: 15000,
  maxUploadBytes: 5 * 1024 * 1024, // backend cap until hosting post_max_size is raised
  uploadTypes: ['image/jpeg', 'image/png', 'image/webp'],
  catalogPageSize: 12,

  business: {
    name: 'Andhra Standard Products',
    brand: 'Spice Mama',
    addressLines: ['G.T. Road, Opp. Market Yard', 'Guntur – 522004, Andhra Pradesh, India'],
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Andhra+Standard+Products+G.T.+Road+Guntur+522004',
    phone: '+919441547648',
    phoneDisplay: '+91 94415 47648',
    email: 'andhrastandardproducts@gmail.com',
    // Empty until the owner confirms a WhatsApp business number. Buttons stay hidden while empty.
    whatsapp: '',
    fssai: '10115030000441',
  },
});
