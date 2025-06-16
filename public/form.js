import { q, fill, val, todayISO, formatPostal } from './common.js';

//logging to logcheckbox 
function logBox(label, box) {
  const id    = box.id    || '«no-id»';
  const name  = box.name  || '«no-name»';
  const note  = `${label}  :  id="${id}"  name="${name}"`;

  const inputs =
    box.shadowRoot?.querySelectorAll('input[type=checkbox]') ??
    box.querySelectorAll('input[type=checkbox]');

  console.groupCollapsed(note);
  console.log('box.value →', box.value);
  console.table([...inputs].map(i => ({
    id: i.id || i.value,
    checked: i.checked,
    attrChecked: i.hasAttribute('checked')
  })));
  console.groupEnd();
}
const REG_FM      = /^\d{5}$/;  //allowing max 5 digits
const REG_POSTAL  = /^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$/;

function isPastOrToday(dateStr) {
  const today = new Date().setHours(0,0,0,0);
  const d     = new Date(dateStr).setHours(0,0,0,0);
  return d <= today;
}
function normalisePostal(code = '') {   //auto change the unformatted correct post code to formatted one
  if (typeof code !== 'string') return '';
  return code.replace(/\s+/g, '')
    .toUpperCase()
    .replace(/^([A-Z]\d[A-Z])(\d[A-Z]\d)$/, '$1 $2');
}

//
const ALERT_ID = 'global-form-alert';
function alertHost() {
  let host = document.getElementById(ALERT_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = ALERT_ID;
    host.style.cssText = 'position:sticky;top:0;left:0;z-index:9000;width:100%;text-align:center;';
    document.body.prepend(host);
  }
  return host;
}
function showAlert(msg = '', kind = 'success', ms = 4000) {
  const host = alertHost();
  if (!msg) return (host.innerHTML = '');
  const color = kind === 'error' ? '#d4351c' : '#00703c';
  host.innerHTML = `<div style="display:inline-block;padding:.75rem 1.5rem;margin:.5rem 0;background:${color};color:#fff;font-weight:600;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,.15);">${msg}</div>`;
  if (ms) setTimeout(() => (host.innerHTML = ''), ms);
}

//for errors
function clearErrorUI(form) {
  form.querySelectorAll('.ontario-input--error')
      .forEach(e => e.classList.remove('ontario-input--error'));
  form.querySelectorAll('.ontario-input__message--error')
      .forEach(e => e.remove());
  
  form.querySelectorAll('ontario-input, ontario-textarea, ontario-checkboxes')
      .forEach(e => { e.error = false; e.errorMessage = ''; });
}
function markError(el, msg) {
  if (el.tagName.startsWith('ONTARIO-')) {
    el.error = true;
    el.errorMessage = msg;
    el.requestUpdate?.();
  } else {
    const wrap = el.closest('.prefix-wrap') ?? el;
    el.classList.add('ontario-input--error');
    wrap.classList.add('ontario-input--error');

    wrap.parentElement
        ?.querySelectorAll('.ontario-input__message--error')
        ?.forEach(e => e.remove());

    const span = document.createElement('span');
    span.className =
      'ontario-input__message ontario-input__message--error';
    span.textContent = msg;
    el.insertAdjacentElement('afterend', span);
  }
}


//
function forceUncheck(box) {
  if (!box) return;
  logBox('before forceUncheck', box);

  box.value = [];

  try {
    const opts = JSON.parse(box.getAttribute('options') ?? '[]');
    opts.forEach(o => delete o.checked);
    box.setAttribute('options', JSON.stringify(opts));
  } catch {  }

  (box.shadowRoot?.querySelectorAll('input[type=checkbox]') ?? [])
    .forEach(i => { i.checked = false; i.removeAttribute('checked'); });
  box.querySelectorAll('input[type=checkbox]')
    .forEach(i => { i.checked = false; i.removeAttribute('checked'); });

  box.requestUpdate?.(); 
  logBox('after forceUncheck', box);
}

function forceCheck(box, value = 'certify') {
  if (!box) return;
  box.value = [value];

  try {
    const opts = JSON.parse(box.getAttribute('options') ?? '[]');
    opts.forEach(o => {
      if (o.value === value) o.checked = true;
    });
    box.setAttribute('options', JSON.stringify(opts));
  } catch { /* ignoring bad JSON struct */ }

  (box.shadowRoot?.querySelectorAll(`input[value="${value}"]`) ?? [])
    .forEach(i => { i.checked = true; i.setAttribute('checked', '') });

  box.requestUpdate?.();
}

function clearFormValues(form) {
  form.querySelectorAll('input,select,textarea')
      .forEach(el => { if (el.type !== 'date') el.value = ''; });
  form.querySelectorAll('ontario-input, ontario-textarea')
      .forEach(el => { el.value = ''; el.requestUpdate?.(); });
  form.querySelectorAll('ontario-checkboxes').forEach(forceUncheck);
}
function collectPayload(form) {
  const data = Object.fromEntries(new FormData(form));

  form.querySelectorAll('ontario-input, ontario-textarea').forEach(el => {
    if (!el.name) return;

    let value = el.value;
    
    if (value === undefined || value === null) {
      const inner = el.shadowRoot?.querySelector('input, textarea');
      value = inner?.value || '';
    }

    data[el.name] = value;
  });

  form.querySelectorAll('ontario-checkboxes').forEach(el => {
    if (!el.name) return;

    const val = el.value;
    data[el.name] = Array.isArray(val) ? val : !!val?.length;
  });

  return data;
}




//main func
document.addEventListener('DOMContentLoaded', async () => {
  const hdr = document.getElementById('common-header');
  if (hdr) hdr.innerHTML = await fetch('/common.html').then(r => r.text());
  initForm();
});

async function initForm() {
  fill('#inspection-date', todayISO());
  const cache = {}, fm = q('#marshal-number');
  fm.addEventListener('blur', async e => {
    const d = e.target.value.trim();
    if (!/^\d{5}$/.test(d)) return;
    const code = `FM-${d}`;
    if (!(code in cache)) {
      try { cache[code] = (await fetch('inspectors.json').then(r => r.json()))[code] ?? null; }
      catch { cache[code] = null; }
    }
    const i = cache[code];
    if (i) {
      fill('#inspector-name',  i.name);
      fill('#inspector-email', i.email);
      fill('#inspector-phone', i.phone);
      showAlert('');
    } else {
      ['#inspector-name','#inspector-email','#inspector-phone'].forEach(s => fill(s,''));
      showAlert('No inspector found for that number', 'error', 6000);
    }
  });

  //dynamic fields
  const sect = { routine:'#type-routine', followup:'#type-followup', complaint:'#type-complaint' };
  const selType = q('#inspection-type');
  const toggle  = () => Object.entries(sect).forEach(([k,s]) =>
                      q(s).classList.toggle('ontario-hide', selType.value !== k));
  selType.onchange = toggle; toggle();

  await customElements.whenDefined('ontario-checkboxes');
  const certifyBox = q('#certify-box');
  const prefillBox = q('#prefill-box');
  let certChecked  = false;

//   certifyBox.addEventListener('checkboxOnChange', ev => {
//     logBox('certifyBox change', certifyBox);
//     certChecked = ev.detail.checked;
//     fill('#signoff-name', certChecked ? val('#inspector-name') : '');
//     fill('#signoff-date', certChecked ? new Date().toLocaleString() : '');
//   });

certifyBox.addEventListener('checkboxOnChange', ev => {
  certChecked = !!ev.detail.checked;            
  logBox('certifyBox change', certifyBox);

  fill('#signoff-name', certChecked ? val('#inspector-name') : '');
  fill('#signoff-date', certChecked ? new Date().toLocaleString() : '');
});
 prefillBox.addEventListener('checkboxOnChange', async ev => {
  logBox('prefillBox change', prefillBox);

  if (!ev.detail.checked) {
    clearFormValues(q('#inspectionForm'));
    fill('#inspection-date', todayISO());
    toggle();
    forceUncheck(certifyBox);
    certChecked = false;                
    showAlert('');
    return;
  }
  const data = await fetch('/mock-data.json').then(r => r.json()).catch(() => null);
  if (!data) { showAlert('Could not load mock data', 'error', 6000); return; }

  Object.entries(data).forEach(([n, v]) => {
    const el = document.querySelector(`[name="${n}"]`);
    if (!el) return;
    if (el.tagName === 'ONTARIO-CHECKBOXES') {
      el.value = v ? ['certify'] : [];
      el.requestUpdate?.();
      el.dispatchEvent(new CustomEvent('checkboxOnChange',
        { detail: { checked: !!v } }));
        
    } else {
      el.value = v;
    }
  });

//   certifyBox.value = ['certify'];
//   certifyBox.requestUpdate?.();
  forceCheck(certifyBox);  
  certChecked = true;                     

  document.querySelectorAll('ontario-input, ontario-textarea')
          .forEach(c => c.requestUpdate?.());
  toggle();
  showAlert('Form pre-filled with sample data');
});


  //submitting form validation + handling
q('#inspectionForm').addEventListener('submit', async ev => {
  ev.preventDefault();
  const form = ev.target;

  clearErrorUI(form);
  showAlert('');

  const certifyBox = q('#certify-box');
  const prefillBox = q('#prefill-box');

 const errs = [];
  form.querySelectorAll('[required]').forEach(el => {
    if (el === certifyBox) return;   

    let v = el.value;

    if (el.id === 'addr-postal') {
     v = normalisePostal(v ?? '');
      el.value = v;   
    }

    if (el.id === 'marshal-number' && !REG_FM.test(v))
      return errs.push([el,'Enter a 5-digit FM number.']);

    if (el.id === 'inspection-date' && !isPastOrToday(v))
      return errs.push([el,'Date cannot be in the future.']);

    if (el.id === 'addr-postal' && !REG_POSTAL.test(v))
      return errs.push([el,'Postal code format: A1A 1A1']);

    const pat   = el.getAttribute('pattern');
    const empty =
    v === undefined || v === null
      ? true
      : Array.isArray(v)
        ? v.length === 0
        : String(v).trim() === '';

    if (empty) errs.push([el,'This field is required.']);
    else if (pat && !(new RegExp(pat,'i').test(v)))
              errs.push([el,'Invalid format.']);
  });

  if (!certChecked) errs.push([certifyBox, 'You must certify the inspection.']);

  if (errs.length) {
    errs.forEach(([el, msg]) => markError(el, msg));
    showAlert('Please fix the highlighted fields.', 'error', 7000);
    errs[0][0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;                                   
  }

  const payload = collectPayload(form);
  console.log('Final payload →', payload);

  let res;
  try {
    res = await fetch('/submit', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload)
    });
  } catch {
    res = { ok: false };
  }
if (res.ok) {
  let newId = '';    

  try {
    const data = await res.clone().json();
    if (data?.id) {
      newId = String(data.id);

      const list = document.getElementById('past-ids');
      if (list && !list.querySelector(`option[value="${newId}"]`)) {
        const opt = document.createElement('option');
        opt.value = newId;
        list.prepend(opt);       
      }
    }
  } catch { /* no JSON body – ignore */ }

  showAlert(`Saved ✓${newId ? ` (ID ${newId})` : ''}`, 'success', 4500);

  clearFormValues(form);
  fill('#inspection-date', todayISO());
  toggle();
  forceUncheck(prefillBox);
  forceUncheck(certifyBox);
  certChecked = false;

} else {
  showAlert('Server error - please try again.', 'error', 7000);
}

});

}

