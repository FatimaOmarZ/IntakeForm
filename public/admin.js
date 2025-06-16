
document.addEventListener('DOMContentLoaded', async () => {
  const banner      = document.getElementById('admin-banner');
  const tbody       = document.querySelector('#submissions-table tbody');

  const drawer      = document.getElementById('detail-drawer');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerFields= document.getElementById('drawer-fields') ||
                      createDrawerFields();              
  const closeBtn    = document.getElementById('drawer-close');

  function createDrawerFields () {
    const dl = document.createElement('dl');
    dl.id = 'drawer-fields';
    dl.className = 'drawer-fields';
    drawer.querySelector('pre, dl')?.remove();  
    drawer.appendChild(dl);
    return dl;
  }

  const showBanner = (msg, isErr = true) => {
    banner.textContent = msg;
    banner.classList.toggle('ontario-hide', !msg);
    banner.classList.toggle('ontario-status--error', isErr);
    banner.classList.toggle('ontario-status--success', !isErr);
  };

  function formatKey (key) {
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')   
      .replace(/[_-]/g, ' ')               
      .replace(/\b\w/g, c => c.toUpperCase());
  }

function openDrawer(rowData) {
  drawerTitle.textContent = `Submission ${rowData.id}`;
  drawerFields.innerHTML = '';                  

  Object.entries(rowData)
    .filter(([_, v]) =>
      v !== null &&
      v !== undefined &&
      !(typeof v === 'string' && v.trim() === ''))
    .forEach(([key, val]) => {
      const dt = document.createElement('dt');
      dt.textContent = formatKey(key);           

      const dd = document.createElement('dd');
      dd.textContent =
        typeof val === 'object' && !Array.isArray(val)
          ? JSON.stringify(val, null, 2)
          : Array.isArray(val)
            ? val.join(', ')
            : String(val);

      drawerFields.append(dt, dd);
    });

  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  closeBtn.focus();
}

  function closeDrawer () {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  closeBtn.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  try {
    const rows = await fetch('/submissions').then(r => r.json());

    if (!rows.length) {
      showBanner('No submissions found.', false);
      return;
    }
//displaying table item,s
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><button class="linkish" data-id="${r.id}">${r.id}</button></td>
        <td>${r.inspectionDate || ''}</td>
        <td>${r.inspectorName  || ''}</td>
        <td>${r.inspectionType || ''}</td>
        <td>${r.city           || ''}</td>
      </tr>
    `).join('');

    // click id to open drawer
    tbody.addEventListener('click', e => {
      const btn = e.target.closest('button[data-id]');
      if (!btn) return;

      const row = rows.find(r => r.id === btn.dataset.id);
      if (row) openDrawer(row);
    });

  } catch (err) {
    console.error(err);
    showBanner('Unable to load submissions - server error.');
  }
});
