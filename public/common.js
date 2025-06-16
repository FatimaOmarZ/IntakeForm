// common.js contains items that both admin and form have
export const q = s => document.querySelector(s);
export const fill = (s, v = '') => { const e = q(s); if (e) e.value = v; };
export const val = s => q(s)?.value || '';
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const formatPostal = r => (/^[A-Za-z]\d[A-Za-z]\d[A-Za-z]\d$/.test(r.replace(/\s/g, '')))
  ? r.toUpperCase().replace(/^(.{3})(.{3})$/, '$1 $2') : r;

export function banner(msg = '', err = false) {
  const b = q('#global-error');
  if (!msg) {
    b?.classList.add('ontario-hide');
    return;
  }
  b.classList.remove('ontario-hide');
  b.textContent = msg;
  b.className = `ontario-status ${err ? 'ontario-status--error' : 'ontario-status--success'}`;
}


export function errorField(ctrl, msg = 'This field is required.') {
  if (ctrl.tagName.startsWith('ONTARIO-')) {
    ctrl.error        = true;
    ctrl.errorMessage = msg;
    ctrl.requestUpdate?.();          
    return;                         
  }

  const wrapper = ctrl.closest('.prefix-wrap') || ctrl; 

  wrapper.querySelectorAll('.ontario-input__message--error').forEach(e => e.remove());

  ctrl.classList.add('ontario-input--error');

  const span       = document.createElement('span');
  span.className   = 'ontario-input__message ontario-input__message--error';
  span.textContent = msg;
  wrapper.appendChild(span);
}


export async function loadCommonLayout() {
  const res = await fetch('common.html');
  const html = await res.text();
  document.body.insertAdjacentHTML('afterbegin', html);
}