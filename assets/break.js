// Newsletter break line for the "You're in!" page, shown only in these dates (UK time).
// Keep the same dates and text as NEWSLETTER_BREAK in assets/site.js.
(function () {
  const NEWSLETTER_BREAK = { from: '2026-12-18', until: '2027-01-06',
    text: 'The Weekly Kick is on a Christmas break until 7th January, so your first one arrives then.' };
  const ukToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
  const el = document.getElementById('break-note');
  if (el && ukToday >= NEWSLETTER_BREAK.from && ukToday <= NEWSLETTER_BREAK.until) {
    el.textContent = NEWSLETTER_BREAK.text;
    el.hidden = false;
  }
})();
