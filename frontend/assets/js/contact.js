// Contact page: icons, stockist enquiry links.
import { icon } from './ui.js';
import { initStockist } from './stockist.js';

document.querySelectorAll('[data-icon]').forEach((el) => el.append(icon(el.dataset.icon)));
initStockist(document.getElementById('stockist-card'));
