// Stockist enquiry: no form (out of scope). The visitor picks what kind of business they are,
// and the email / WhatsApp buttons open with a ready-made message they can edit and send.
import { config } from './config.js';
import { links } from './ui.js';

export function initStockist(root) {
  if (!root) return;
  const mail = root.querySelector('[data-stockist="mail"]');
  const wa = root.querySelector('[data-stockist="whatsapp"]');
  const tel = root.querySelector('[data-stockist="tel"]');

  if (tel) tel.href = links.tel();
  if (wa && !config.business.whatsapp) wa.hidden = true;

  const update = () => {
    const type = root.querySelector('input[name="stockist-type"]:checked')?.value || 'Retailer';
    const subject = `Stockist enquiry: ${type}`;
    const body = [
      'Hello Spice Mama team,',
      '',
      `I'm a ${type.toLowerCase()} and would like to stock Spice Mama.`,
      '',
      'My name:',
      'Business name:',
      'City or town:',
      'Phone:',
      'Products I am interested in:',
    ].join('\n');
    if (mail) mail.href = links.mail(subject, body);
    if (wa && config.business.whatsapp) {
      wa.href = links.whatsapp(`Hello, I'm a ${type.toLowerCase()} and would like to stock Spice Mama. Business name: , City: `);
    }
  };
  root.querySelectorAll('input[name="stockist-type"]').forEach((r) => r.addEventListener('change', update));
  update();
}
