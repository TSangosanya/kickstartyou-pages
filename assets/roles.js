// Roles: the "Closing soon" table on Home and the full roles tracker.
// Data comes from data/roles.json, which the Monday and Wednesday tracker tasks will refresh.
(function () {
  const { BASE, esc } = window.KSY;
  const soonBody = document.getElementById('soon');
  const allBody = document.getElementById('all');
  if (!soonBody && !allBody) return;

  const DAY = 86400000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const parse = (s) => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const pretty = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  fetch(BASE + 'data/roles.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((data) => start(data))
    .catch(() => {
      const msg = '<tr><td colspan="5" class="empty">The roles could not load. Please refresh the page.</td></tr>';
      if (soonBody) soonBody.innerHTML = msg;
      if (allBody) allBody.innerHTML = msg;
    });

  function start(data) {
    const updated = parse(data.updated);
    const roles = data.roles.map((x, i) => {
      const date = parse(x.closing);
      const days = date ? Math.round((date - today) / DAY) : null;
      return Object.assign({}, x, {
        i, date, days,
        closed: x.closed === true || (days !== null && days < 0), // "closed": true = advert taken down early
        week: days !== null && days >= 0 && days <= 7,
        isNew: !!(x.added && updated && parse(x.added) >= updated),
        urgent: days === null ? '' : days === 0 ? 'Closes today' : days === 1 ? 'Closes tomorrow' : days > 1 && days <= 14 ? `Closes in ${days} days` : ''
      });
    });
    // "8 new this week" pills (Home's Roles tracker card and the Roles page header); hidden when none are new
    const newCount = roles.filter((x) => x.isNew && !x.closed).length;
    document.querySelectorAll('[data-newcount]').forEach((el) => {
      el.textContent = `${newCount} new this week`;
      el.hidden = newCount === 0;
    });
    const upd = document.getElementById('updated');
    if (upd && updated) upd.textContent = 'Last updated: ' + updated.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    const byClosing = (a, b) => (a.date ? a.date.getTime() : 8.64e15) - (b.date ? b.date.getTime() : 8.64e15);
    // Closing in 3 days or less: Tangerine pill; any other "Closes in" or "Apply early": a plain tag
    const dateCell = (x) => x.date
      ? `<b>${pretty(x.date)}</b>${x.closed ? '<br><span class="tag grey">Closed</span>' : x.urgent ? `<br><span class="tag${x.days <= 3 ? ' hot' : ''}">${x.urgent}</span>` : ''}`
      : x.closed ? '<b>Closed early</b><br><span class="tag grey">Closed</span>'
      : '<b>No closing date</b><br><span class="tag">Apply early</span>';
    const row = (x) => `<tr class="${x.closed ? 'closed' : ''}">
<td class="co">${x.isNew && !x.closed ? '<span class="tag new">New</span><br>' : ''}<b>${esc(x.company)}</b></td>
<td>${esc(x.role)}${x.sector ? `<br><span class="tag">${esc(x.sector)}</span>` : ''}${x.note ? `<span class="rnote">${esc(x.note)}</span>` : ''}</td>
<td>${esc(x.location)}</td>
<td style="white-space:nowrap">${dateCell(x)}</td>
<td class="ap">${x.closed ? '' : `<a class="btn btn-purple btn-sm" target="_blank" rel="noopener" href="${esc(x.link)}" data-apply data-company="${esc(x.company)}" data-role="${esc(x.role)}">Apply</a>`}</td></tr>`;

    if (soonBody) {
      soonBody.innerHTML = roles.filter((x) => !x.closed && x.date).sort(byClosing).slice(0, 3).map(row).join('')
        || '<tr><td colspan="5" class="empty">No roles closing soon. See the full tracker for everything open.</td></tr>';
      const allBtn = document.getElementById('soon-all');
      const open = roles.filter((x) => !x.closed).length;
      if (allBtn && open) allBtn.textContent = `See all ${open} roles`;
    }
    if (!allBody) return;

    const $ = (id) => document.getElementById(id);
    // roles per page: 5 on phones, 8 on tablets held upright, 10 on computers
    const PER_PAGE = window.matchMedia('(max-width:700px)').matches ? 5
      : window.matchMedia('(max-width:1023px)').matches ? 8 : 10;
    const st = { week: false, closed: false, page: 1 };
    const sectorSel = $('f-sector');
    const sectors = [...new Set(roles.filter((x) => !x.closed && x.sector).map((x) => x.sector))].sort();
    sectorSel.innerHTML = ['All sectors'].concat(sectors).map((s) => `<option>${esc(s)}</option>`).join('');
    if (!sectors.length) sectorSel.closest('.field').hidden = true;

    function draw() {
      const q = $('f-search').value.toLowerCase().trim();
      const loc = $('f-loc').value;
      const sec = sectorSel.value;
      const sort = $('f-sort').value;
      const list = roles.filter((x) =>
        (st.closed || !x.closed) && (!st.week || x.week) && (sec === 'All sectors' || x.sector === sec) &&
        (!q || (x.company + ' ' + x.role).toLowerCase().includes(q)) &&
        (loc === 'All locations' || (loc === 'London' && /london/i.test(x.location)) ||
          (loc === 'Outside London' && !/london/i.test(x.location)) || (loc === 'Hybrid or remote' && /hybrid|remote/i.test(x.location))));
      const closedLast = (a, b) => (a.closed ? 1 : 0) - (b.closed ? 1 : 0);
      list.sort(sort === 'Company A to Z' ? (a, b) => a.company.localeCompare(b.company)
        : sort === 'New first' ? (a, b) => closedLast(a, b) || (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || byClosing(a, b)
        : (a, b) => closedLast(a, b) || byClosing(a, b));
      const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
      st.page = Math.min(st.page, pages);
      const from = (st.page - 1) * PER_PAGE;
      const shown = list.slice(from, from + PER_PAGE);
      const active = [loc !== 'All locations', sec !== 'All sectors', sort !== 'New first', st.week, st.closed].filter(Boolean).length;
      $('f-toggle').textContent = active ? `Filters (${active})` : 'Filters';
      $('count').textContent = list.length
        ? `Showing ${from + 1} to ${from + shown.length} of ${list.length} ${list.length === 1 ? 'role' : 'roles'}`
        : 'Showing 0 roles';
      allBody.innerHTML = shown.map(row).join('');
      $('empty').hidden = list.length > 0;
      $('endmore').hidden = !list.length || st.page !== pages; // under the last page, for people who looked through everything
      const pager = $('pager');
      pager.hidden = pages < 2;
      pager.innerHTML = `<button type="button" class="chip" data-page="${st.page - 1}" ${st.page === 1 ? 'disabled' : ''}>Previous</button>`
        + Array.from({ length: pages }, (_, n) => `<button type="button" class="chip" data-page="${n + 1}" aria-label="Page ${n + 1}" ${n + 1 === st.page ? 'aria-current="page" aria-pressed="true"' : ''}>${n + 1}</button>`).join('')
        + `<span class="pgof">Page ${st.page} of ${pages}</span>`  // phones show this instead of the numbers
        + `<button type="button" class="chip" data-page="${st.page + 1}" ${st.page === pages ? 'disabled' : ''}>Next</button>`;
    }
    const redraw = () => { st.page = 1; draw(); };
    ['f-search', 'f-loc', 'f-sort'].forEach((id) => $(id).addEventListener('input', redraw));
    sectorSel.addEventListener('change', redraw);
    ['week', 'closed'].forEach((k) => $('f-' + k).addEventListener('click', (e) => {
      st[k] = !st[k]; e.currentTarget.setAttribute('aria-pressed', st[k]); redraw();
    }));
    $('pager').addEventListener('click', (e) => {
      const b = e.target.closest('[data-page]');
      if (!b || b.disabled) return;
      st.page = Number(b.dataset.page);
      draw();
      $('count').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // Phones only: Location, Sector, Sort and the two chips sit behind a Filters button
    $('f-toggle').addEventListener('click', (e) => {
      const open = $('f-more').classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', open);
    });
    $('clear').addEventListener('click', () => {
      $('f-search').value = ''; $('f-loc').value = 'All locations'; sectorSel.value = 'All sectors'; $('f-sort').value = 'New first';
      st.week = st.closed = false;
      $('f-week').setAttribute('aria-pressed', false); $('f-closed').setAttribute('aria-pressed', false);
      redraw();
    });
    draw();
  }
})();
