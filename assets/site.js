// Shared behaviour for every page: cookie banner, analytics (only after Accept),
// the sign-up pop-up and the "Never miss a role" side tab.
(function () {
  const CONFIG = {
    GA_ID: 'G-ZR0EX5Y8KZ', // Google Analytics measurement ID (G-XXXXXXX). Empty = not loaded.
    CLARITY_ID: 'yzif9mgw9j', // Microsoft Clarity project ID. Empty = not loaded.
    SIGNUP_READY: true, // false pauses sign-ups: nothing is sent.
    SIGNUP_URL: 'https://ksy-signup.tsangosanya.workers.dev' // the Cloudflare middleman that passes answers to Brevo
  };
  const POPUP_AFTER = 15000;        // ms on the site before the pop-up opens by itself
  const GAP_AFTER_COOKIES = 10000;  // never sooner than this after the cookie choice
  const WHATSAPP = 'https://whatsapp.com/channel/0029VbEMesjEquiK8Z1TzF3m';

  const BASE = new URL('..', document.currentScript.src).href;
  window.KSY = { BASE, CONFIG };

  const store = {
    get(k) { try { return localStorage.getItem('ksy-' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('ksy-' + k, v); } catch (e) { /* private mode: fine */ } }
  };
  const $ = (id) => document.getElementById(id);
  const fromNewsletter = /[?&](utm_source=brevo|ref=kick)/i.test(location.search);
  if (fromNewsletter) store.set('subscribed', '1');
  const subscribed = () => store.get('subscribed') === '1';
  const morePage = $('more-page'); // only on kickstartyou.org/more/

  // ---------- markup added to every page ----------
  const legal = BASE + 'legal/';
  document.body.insertAdjacentHTML('beforeend', `
<div class="cookie" id="cookie" role="region" aria-labelledby="ck-title" hidden>
<button type="button" class="ck-x" aria-label="Close" data-cookie-later>✕</button>
<p class="ck-t" id="ck-title">Can we use cookies?</p>
<p>They show us which roles you click on, so we can find more like them.</p>
<div class="ck-btns"><a class="ck-more" href="${legal}#cookies">More info</a><button type="button" class="ck-yes" data-consent="yes">Accept all</button><button type="button" class="ck-no" data-consent="no">Reject all</button></div>
</div>
<button type="button" class="sidetab" id="sidetab" hidden data-open-signup><svg class="ico-mail" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><svg class="ico-bell" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6"/><path d="M9 17v1a3 3 0 0 0 6 0v-1"/></svg>Never miss a role</button>
<div class="overlay" id="popup" role="dialog" aria-modal="true" aria-labelledby="pp-title" hidden>
<div class="modal">
<button type="button" class="close" aria-label="Close" data-close>✕</button>
<div id="pp-form">
<h2 id="pp-title">Never miss a closing date.</h2>
<p class="intro">The roles you can't miss and the sponsorship news that matters. Free, every Thursday.</p>
<div class="fields">
<div class="two">
<div class="ul"><label for="pp-name">First name <span class="req">*</span></label><input id="pp-name" autocomplete="given-name"><span class="ferr" id="pp-name-err" role="alert" hidden>Enter your first name</span></div>
<div class="ul"><label for="pp-email">Email <span class="req">*</span></label><input id="pp-email" type="email" autocomplete="email"><span class="ferr" id="pp-email-err" role="alert" hidden>Enter a valid email address, e.g. name@example.com</span></div>
</div>
<div><span class="legend">Are you an international student? <span class="req">*</span></span><div class="row" style="margin-top:10px" data-group="intl"><button type="button" class="pill" data-v="yes" aria-pressed="false">Yes</button><button type="button" class="pill" data-v="no" aria-pressed="false">No</button></div><span class="ferr" id="pp-intl-err" role="alert" hidden>Choose an answer</span></div>
<div class="note" id="pp-welcome-intl" hidden>KickStartYou is built for international students from the African and Caribbean diaspora, but everyone's welcome. Know someone it's perfect for? Share it with them.</div>
<div><span class="legend">Do you identify as Black? <span class="req">*</span></span><div class="row" style="margin-top:10px" data-group="black"><button type="button" class="pill" data-v="yes" aria-pressed="false">Yes</button><button type="button" class="pill" data-v="no" aria-pressed="false">No</button><button type="button" class="pill" data-v="pns" aria-pressed="false">Prefer not to say</button></div><span class="ferr" id="pp-black-err" role="alert" hidden>Choose an answer</span></div>
<div class="note" id="pp-welcome-black" hidden>KickStartYou is built for international students from the African and Caribbean diaspora, but everyone's welcome. Know someone it's perfect for? Share it with them.</div>
<div class="ul"><label for="pp-stage">Where are you at? <span class="req">*</span></label><select id="pp-stage"><option value="">Choose one</option><option>First year</option><option>Second year</option><option>Final year</option><option>Master's</option><option>Graduated</option><option>Other</option></select><span class="ferr" id="pp-stage-err" role="alert" hidden>Choose where you're at</span></div>
<div class="ul" id="pp-other" hidden><label for="pp-otherin">Tell us where you're at <span class="req">*</span></label><input id="pp-otherin"><span class="ferr" id="pp-other-err" role="alert" hidden>Tell us where you're at</span></div>
</div>
<p class="small" style="margin:16px 0 0;font-size:14px">We ask so we can see who we're reaching. You can always choose "Prefer not to say".</p>
<div style="position:absolute;left:-9999px" aria-hidden="true"><label for="pp-website">Website</label><input id="pp-website" tabindex="-1" autocomplete="off"></div>
<button type="button" class="bigbtn" id="pp-submit">Sign me up</button>
<span class="ferr" id="pp-send-err" role="alert" style="display:block;text-align:center;margin-top:10px" hidden>Something went wrong, please try again.</span>
<p class="small" style="margin:12px 0 0;font-size:13px;text-align:center">By signing up you confirm you're 18 or over and agree to our <a href="${legal}#privacy">privacy note</a>.</p>
</div>
<div id="pp-done" hidden>
<h2 id="pp-done-title">Check your inbox.</h2>
<p class="intro" id="pp-done-text">We've sent you an email. Tap the link inside to confirm your subscription.</p>
<div class="box" id="pp-more-box" style="margin-top:24px;background:var(--light);border:2px solid var(--lav2)">
<p class="bt">Help shape KickStartYou</p><p class="bd">Tell us your sector and what you need most right now. It takes about a minute.</p>
<button type="button" class="btn btn-purple" style="width:100%" data-step="more">Tell us a bit more</button>
</div>
<div class="box" style="background:var(--greenbg)">
<p class="bt">Want updates faster?</p><p class="bd">Our WhatsApp channel shares standout roles as soon as we find them.</p>
<a href="${WHATSAPP}" target="_blank" rel="noopener" class="btn btn-green" style="display:block">Follow the channel</a>
</div>
</div>
<div id="pp-more" hidden>
<h2>Help shape KickStartYou</h2>
<p class="intro">Tell us your sector and what you need most right now. It takes about a minute.</p>
<p class="small" style="margin:6px 0 0;font-size:14px"><span class="req">*</span> Required</p>
<div class="fields" style="gap:28px;margin-top:24px">
<div><span class="q">Which sectors are you targeting? <span class="req">*</span></span><div class="checks" data-checks="sectors"></div><div class="ul othertxt" hidden><label>Which other sector?</label><input></div></div>
<div><span class="q">What kind of role are you looking for? <span class="req">*</span></span><div class="checks" data-checks="types"></div><div class="ul othertxt" hidden><label>What other kind of role?</label><input></div></div>
<div><span class="q">What are your biggest challenges right now? <span class="req">*</span></span><div class="checks" data-checks="challenges"></div><div class="ul othertxt" hidden><label>What other challenge?</label><input></div></div>
<div class="ul plain"><label for="m-city">Which city are you based in? <span class="req">*</span></label><input id="m-city"><div class="checks" style="margin-top:6px"><label><input type="checkbox" data-pns="m-city">Prefer not to say</label></div></div>
<div class="ul plain"><label for="m-country">Which country is home for you? <span class="req">*</span></label><input id="m-country"><div class="checks" style="margin-top:6px"><label><input type="checkbox" data-pns="m-country">Prefer not to say</label></div><p class="small" style="margin:8px 0 0;font-size:14px"><span class="req">*</span> Your city and home country help us make sure KickStartYou reflects everyone it's for, including the culture events in The Weekly Kick.</p></div>
<div class="ul plain"><label for="m-uni">Which university are you at, or did you graduate from? <span class="req">*</span></label><input id="m-uni"><div class="checks" style="margin-top:6px"><label><input type="checkbox" data-pns="m-uni">Prefer not to say</label></div></div>
<div class="ul plain"><label for="m-heard">How did you hear about KickStartYou? <span class="req">*</span></label><select id="m-heard"><option value="">Choose one</option><option>LinkedIn</option><option>WhatsApp</option><option>A friend</option><option>My university</option><option>An event</option><option>Google</option><option>Other</option></select></div>
<div style="display:flex;flex-direction:column;gap:6px"><label for="m-else" style="font-weight:700">Anything else you'd want help with? <span style="font-weight:400;color:var(--muted)">(optional)</span></label><textarea id="m-else" rows="4" style="font:inherit;border:2px solid #c9bde0;border-radius:6px;padding:10px 12px"></textarea></div>
</div>
<button type="button" class="bigbtn" id="more-submit">Send my answers</button>
<span class="ferr" id="more-send-err" role="alert" style="display:block;text-align:center;margin-top:10px" hidden>Something went wrong, please try again.</span>
<p class="small" style="margin:12px 0 0;font-size:13px;text-align:center">Your answers are covered by our <a href="${legal}#privacy">privacy note</a>.</p>
</div>
<div id="pp-thanks" hidden>
<h2>Thank you.</h2>
<p class="intro">Your answers help shape what we build next.</p>
<button type="button" class="bigbtn" data-close>Back to the site</button>
</div>
</div>
</div>`);

  // ---------- "Tell us a bit more" options ----------
  const OPTIONS = {
    sectors: ['Finance and banking', 'Consulting and accounting', 'Tech and data', 'Engineering and energy', 'Healthcare and science', 'Law', 'Public sector and charity', 'Other'],
    types: ['Graduate scheme', 'Internship', 'Placement', 'Entry-level job', 'Other'],
    challenges: ['Finding employers that actually sponsor', 'Finding roles that meet the salary requirements', 'Getting rejected before interview', 'Getting rejected at interview', 'Running out of time on my visa', 'Understanding how sponsorship works', 'Building a professional network in the UK', 'Other']
  };
  document.querySelectorAll('[data-checks]').forEach((el) => {
    OPTIONS[el.dataset.checks].forEach((o) => {
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      label.append(box, o);
      el.append(label);
      if (o === 'Other') {
        const txt = el.parentElement.querySelector('.othertxt');
        box.addEventListener('change', () => { txt.hidden = !box.checked; if (box.checked) txt.querySelector('input').focus(); });
      }
    });
  });
  document.querySelectorAll('[data-pns]').forEach((box) => box.addEventListener('change', () => {
    const input = $(box.dataset.pns);
    input.disabled = box.checked;
    if (box.checked) input.value = '';
  }));

  // "Tell us a bit more": every question except "Anything else" is required.
  function moreError(block, msg) {
    let err = block.querySelector(':scope > .ferr');
    if (!err) { err = document.createElement('span'); err.className = 'ferr'; err.setAttribute('role', 'alert'); block.append(err); }
    err.textContent = msg || '';
    err.hidden = !msg;
    return !msg;
  }
  // Sends answers to the middleman. Returns its reply, or null after showing the error line.
  let pass = '';
  async function send(path, btn, busyText, errEl, body) {
    errEl.hidden = true;
    if (!CONFIG.SIGNUP_READY || !CONFIG.SIGNUP_URL) { errEl.hidden = false; return null; }
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = busyText;
    try {
      const r = await fetch(CONFIG.SIGNUP_URL + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok || data.status === 'error') throw new Error('not saved');
      return data;
    } catch (e) {
      errEl.hidden = false;
      return null;
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }
  async function checkMore() {
    let first = null;
    const flag = (block, msg) => { if (!moreError(block, msg) && !first) first = block; };
    document.querySelectorAll('#pp-more [data-checks]').forEach((el) => {
      const block = el.parentElement;
      const ticked = [...el.querySelectorAll('input:checked')].map((b) => b.parentElement.textContent);
      const otherTxt = block.querySelector('.othertxt input');
      flag(block, !ticked.length ? 'Choose at least one'
        : ticked.includes('Other') && !otherTxt.value.trim() ? 'Tell us what "Other" means for you' : '');
    });
    ['m-city', 'm-country', 'm-uni'].forEach((id) => {
      const pns = document.querySelector(`[data-pns="${id}"]`).checked;
      flag($(id).parentElement, pns || $(id).value.trim() ? '' : 'Fill this in, or tick "Prefer not to say"');
    });
    flag($('m-heard').parentElement, $('m-heard').value ? '' : 'Choose one');
    if (first) { first.scrollIntoView({ block: 'center' }); return; }
    const picked = (key) => [...document.querySelectorAll(`[data-checks="${key}"] input:checked`)].map((b) => b.parentElement.textContent);
    const otherOf = (key) => document.querySelector(`[data-checks="${key}"]`).parentElement.querySelector('.othertxt input').value.trim();
    const typed = (id) => (document.querySelector(`[data-pns="${id}"]`).checked ? 'Prefer not to say' : $(id).value.trim());
    const res = await send('/more', $('more-submit'), 'Sending…', $('more-send-err'), {
      pass,
      sectors: picked('sectors'), sectorsOther: otherOf('sectors'),
      types: picked('types'), typesOther: otherOf('types'),
      challenges: picked('challenges'), challengesOther: otherOf('challenges'),
      city: typed('m-city'), country: typed('m-country'), uni: typed('m-uni'),
      heard: $('m-heard').value, anythingElse: $('m-else').value.trim()
    });
    if (!res) return;
    store.set('pass', '');
    step('thanks');
  }
  $('more-submit').addEventListener('click', checkMore);
  $('pp-more').addEventListener('input', (e) => {
    const block = e.target.closest('#pp-more .fields > div');
    if (block) moreError(block, '');
  });

  // ---------- pop-up ----------
  const popup = $('popup');
  let lastFocus = null;
  function step(name) {
    // On the "Tell us a bit more" page the questions and thanks are on the page itself, not in the pop-up.
    if (morePage && (name === 'more' || name === 'thanks')) {
      if (!popup.hidden) closePopup();
      pageStep(name);
      return;
    }
    ['form', 'done', 'more', 'thanks'].forEach((k) => { $('pp-' + k).hidden = k !== name; });
    popup.scrollTop = 0;
  }
  function openPopup() {
    lastFocus = document.activeElement;
    step('form');
    popup.hidden = false;
    document.body.style.overflow = 'hidden';
    $('pp-name').focus();
  }
  function closePopup() {
    popup.hidden = true;
    document.body.style.overflow = '';
    store.set('popup-seen', '1');
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open-signup],[data-close],[data-step],[data-cookie-settings],[data-consent],[data-cookie-later]');
    if (!t) return;
    if (t.matches('[data-open-signup]')) { e.preventDefault(); openPopup(); }
    else if (t.matches('[data-close]')) closePopup();
    else if (t.matches('[data-step]')) step(t.dataset.step);
    else if (t.matches('[data-cookie-settings]')) { e.preventDefault(); $('cookie').hidden = false; }
    else if (t.matches('[data-consent]')) consent(t.dataset.consent === 'yes');
    else if (t.matches('[data-cookie-later]')) cookieLater();
  });
  popup.addEventListener('click', (e) => { if (e.target === popup) closePopup(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !popup.hidden) closePopup(); });

  const ans = {};
  document.querySelectorAll('[data-group]').forEach((g) => g.querySelectorAll('.pill').forEach((b) => b.addEventListener('click', () => {
    ans[g.dataset.group] = b.dataset.v;
    g.querySelectorAll('.pill').forEach((x) => x.setAttribute('aria-pressed', x === b));
    $('pp-' + g.dataset.group + '-err').hidden = true;
    $('pp-welcome-intl').hidden = ans.intl !== 'no';
    $('pp-welcome-black').hidden = ans.black !== 'no';
  })));
  $('pp-stage').addEventListener('change', (e) => { $('pp-other').hidden = e.target.value !== 'Other'; });
  [['pp-name', 'name'], ['pp-email', 'email'], ['pp-stage', 'stage'], ['pp-otherin', 'other']].forEach(([id, k]) => {
    $(id).addEventListener('input', () => { $('pp-' + k + '-err').hidden = true; $(id).style.borderBottomColor = ''; });
  });
  $('pp-submit').addEventListener('click', async () => {
    const stage = $('pp-stage').value;
    const checks = [
      ['name', $('pp-name').value.trim() !== '', $('pp-name')],
      ['email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('pp-email').value.trim()), $('pp-email')],
      ['intl', !!ans.intl, null],
      ['black', !!ans.black, null],
      ['stage', stage !== '', $('pp-stage')],
      ['other', stage !== 'Other' || $('pp-otherin').value.trim() !== '', $('pp-otherin')]
    ];
    let first = null;
    checks.forEach(([k, ok, field]) => {
      $('pp-' + k + '-err').hidden = ok;
      if (field) field.style.borderBottomColor = ok ? '' : 'var(--red)';
      if (!ok && !first) first = field || $('pp-' + k + '-err');
    });
    if (first) { first.scrollIntoView({ block: 'center' }); if (first.focus) first.focus(); return; }
    const res = await send('/signup', $('pp-submit'), 'Signing you up…', $('pp-send-err'), {
      name: $('pp-name').value.trim(), email: $('pp-email').value.trim(),
      intl: ans.intl, black: ans.black, stage,
      stageOther: stage === 'Other' ? $('pp-otherin').value.trim() : '',
      website: $('pp-website').value
    });
    if (!res) return;
    pass = res.pass || '';
    store.set('pass', pass); // lets kickstartyou.org/more/ open the questions on this browser for a day
    const already = res.status === 'already';
    $('pp-done-title').textContent = already ? "You're already subscribed." : 'Check your inbox.';
    $('pp-done-text').textContent = already ? "We've updated your details."
      : "We've sent you an email. Tap the link inside to confirm your subscription.";
    store.set('subscribed', '1');
    $('sidetab').hidden = true;
    // No pass means this email has answered before: only the private link in their emails can change answers.
    $('pp-more-box').hidden = !pass;
    // On the "Tell us a bit more" page, signing up leads straight to the questions.
    if (morePage) {
      closePopup();
      if (!pass) { pageStep('answered'); return; }
      $('mp-confirm').textContent = already ? "You're already subscribed, so you can go straight ahead."
        : "You're signed up. Check your inbox and tap the link to confirm your subscription.";
      pageStep('more');
      $('mp-confirm').hidden = false;
      return;
    }
    step('done');
  });

  // ---------- cookies and analytics ----------
  function loadAnalytics() {
    if (CONFIG.GA_ID) {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_ID;
      document.head.append(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', CONFIG.GA_ID);
    }
    if (CONFIG.CLARITY_ID) {
      (function (c, l, a, r, i) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        const t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        l.head.append(t);
      })(window, document, 'clarity', 'script', CONFIG.CLARITY_ID);
      window.clarity('consent'); // only reached after Accept; Clarity needs this signal for UK visitors
    }
  }
  // Click counts for Apply buttons (only reach Google Analytics after Accept).
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-apply]');
    if (a && window.gtag) window.gtag('event', 'apply_click', { company: a.dataset.company, role: a.dataset.role });
  });

  // The X on the cookie banner means "not now": nothing runs, and the banner comes back on the next visit
  // (remembered for this browser tab only).
  const later = { get() { try { return sessionStorage.getItem('ksy-cookie-later') === '1'; } catch (e) { return false; } },
                  set() { try { sessionStorage.setItem('ksy-cookie-later', '1'); } catch (e) { /* fine */ } } };
  let cookieDone = !!store.get('consent') || later.get(), cookieTime = 0;
  function cookieLater() {
    const first = !cookieDone;
    later.set();
    $('cookie').hidden = true;
    cookieDone = true;
    if (first) cookieTime = Date.now();
    showTab();
    if (autoWanted) autoPopup();
  }
  function consent(yes) {
    const first = !cookieDone;
    store.set('consent', yes ? 'yes' : 'no');
    $('cookie').hidden = true;
    if (yes) loadAnalytics();
    cookieDone = true;
    if (first) cookieTime = Date.now();
    showTab();
    if (autoWanted) autoPopup();
  }
  if (store.get('consent') === 'yes') loadAnalytics();
  if (!cookieDone) $('cookie').hidden = false;

  // ---------- side tab and automatic pop-up ----------
  function showTab() { if (!subscribed()) $('sidetab').hidden = false; }
  if (cookieDone) showTab();
  else if (window.innerWidth > 1023) setTimeout(showTab, 1500);  // phones and tablets wait for the cookie choice (corner button would sit on the banner)
  // On phones the tab sits in the corner with its words until the first scroll, then shrinks to the envelope;
  // it tucks away once the footer is in view
  const foot = document.querySelector('footer.site');
  if (foot) {
    const tuck = () => {
      if (window.scrollY > 40) $('sidetab').classList.add('mini');
      $('sidetab').classList.toggle('away', foot.getBoundingClientRect().top < window.innerHeight);
    };
    window.addEventListener('scroll', tuck, { passive: true });
    tuck();
    // roles and news load after the page, which pushes the footer down, so check again when the page grows
    if ('ResizeObserver' in window) new ResizeObserver(tuck).observe(document.body);
  }

  let autoShown = false, autoWanted = false, autoTimer = null;
  function autoPopup() {
    if (autoShown || subscribed() || store.get('popup-seen') === '1') return;
    // Phones never get the automatic pop-up: Google ranks pages lower when a pop-up covers them on phones.
    // Phone visitors use the corner button or the Subscribe buttons instead.
    if (window.matchMedia('(max-width:700px)').matches) return;
    if (!cookieDone) { autoWanted = true; return; }
    const wait = GAP_AFTER_COOKIES - (Date.now() - cookieTime);
    if (cookieTime && wait > 0) { clearTimeout(autoTimer); autoTimer = setTimeout(autoPopup, wait); return; }
    autoShown = true;
    openPopup();
  }
  function onScroll() {
    const el = document.scrollingElement || document.documentElement;
    const half = (el.scrollHeight - window.innerHeight) / 2;
    if (half > 0 && el.scrollTop >= half) autoPopup();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  setTimeout(autoPopup, POPUP_AFTER);

  // ---------- the "Tell us a bit more" page (kickstartyou.org/more/) ----------
  // The same questions as the pop-up step, moved onto the page. The private link in the emails (?c=...)
  // or a sign-up on this browser in the last day opens them straight away; anyone else gives their email first.
  let pageStep = () => {};
  if (morePage) {
    morePage.append($('pp-more'));
    pageStep = (name) => {
      ['wait', 'who', 'notfound', 'answered', 'thanks', 'confirm'].forEach((k) => { $('mp-' + k).hidden = k !== name; });
      $('pp-more').hidden = name !== 'more';
      window.scrollTo(0, 0);
    };
    const handle = (res) => {
      if (res.status === 'ok') { pass = res.pass; store.set('pass', pass); pageStep('more'); }
      else pageStep(res.status === 'notfound' || res.status === 'answered' ? res.status : 'who');
    };
    const start = async (body) => {
      if (!CONFIG.SIGNUP_READY || !CONFIG.SIGNUP_URL) return { status: 'error' };
      try {
        const r = await fetch(CONFIG.SIGNUP_URL + '/start', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        return await r.json();
      } catch (e) { return { status: 'error' }; }
    };
    (async () => {
      const code = window.KSY_MORE_CODE || '', saved = store.get('pass');
      let res = code ? await start({ code }) : null;
      if ((!res || res.status !== 'ok') && saved) res = await start({ pass: saved });
      if (res && res.status === 'ok') handle(res); else pageStep('who');
    })();
    $('mp-go').addEventListener('click', async () => {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('mp-email').value.trim());
      $('mp-email-err').hidden = ok;
      if (!ok) { $('mp-email').focus(); return; }
      const res = await send('/start', $('mp-go'), 'Checking…', $('mp-send-err'), { email: $('mp-email').value.trim() });
      if (res) handle(res);
    });
    $('mp-email').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('mp-go').click(); });
    $('mp-email').addEventListener('input', () => { $('mp-email-err').hidden = true; });
    morePage.addEventListener('click', (e) => { if (e.target.closest('[data-mp="who"]')) pageStep('who'); });
    // Not subscribed yet: open the sign-up with the email they just typed.
    $('mp-signup').addEventListener('click', () => {
      openPopup();
      $('pp-email').value = $('mp-email').value.trim();
    });
  }

  // Arriving from kickstartyou.org/join/ (QR code, WhatsApp, LinkedIn): open the sign-up straight away,
  // on phones too, since the visitor asked for it. Then tidy the address so a refresh doesn't reopen it.
  if (/[?&]join(=|&|$)/.test(location.search)) {
    autoShown = true;
    openPopup();
    const rest = location.search.replace(/([?&])join(=[^&]*)?(&|$)/, '$1').replace(/[?&]$/, '');
    try { history.replaceState(null, '', location.pathname + rest + location.hash); } catch (e) { /* fine */ }
  }

  // Shared helper for the roles and news scripts.
  window.KSY.esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
})();
