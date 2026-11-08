// Tabs: show one section at a time; the address (#privacy, #terms, #cookies) picks the tab.
(function () {
  const panels = document.querySelectorAll('[data-panel]');
  const tabs = document.querySelectorAll('[data-tab]');
  function show(name) {
    if (![...panels].some((p) => p.id === name)) name = 'privacy';
    panels.forEach((p) => { p.hidden = p.id !== name; });
    tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === name));
  }
  tabs.forEach((t) => t.addEventListener('click', () => { history.replaceState(null, '', '#' + t.dataset.tab); show(t.dataset.tab); }));
  document.querySelectorAll('[data-tab-link]').forEach((a) => a.addEventListener('click', () => setTimeout(() => { show(a.dataset.tabLink); window.scrollTo(0, 0); })));
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
})();
