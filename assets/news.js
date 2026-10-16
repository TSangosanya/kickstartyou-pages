// News: the latest story on Home and the list on the News page.
// Data comes from data/news.json. A story only shows once scripts/build_news.py has built its page
// and listed it in data/news_live.json (from its "publish" date, a week behind The Weekly Kick).
// Add ?preview to the address to see unpublished ones.
// Each story's own page (news/<id>/) is plain HTML made by scripts/build_news.py, so Google can read it.
(function () {
  const { BASE, esc } = window.KSY;
  const home = document.getElementById('latest-news');
  const featured = document.getElementById('news-featured');
  const earlier = document.getElementById('news-earlier');
  if (!home && !featured) return;

  const ICONS = {
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
    passport: '<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="10" r="3.5"/><path d="M9 17h6"/>',
    pound: '<path d="M17 20H7c1.5-1.5 2-3.5 2-6V8a4 4 0 0 1 7.5-2M6 13h8"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
  };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const pretty = (s) => parse(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const preview = /[?&]preview\b/.test(location.search);
  const storyUrl = (s) => BASE + 'news/' + encodeURIComponent(s.id) + '/';
  const shareUrl = (s) => 'https://wa.me/?text=' + encodeURIComponent(s.headline + ' https://kickstartyou.org/news/' + s.id + '/');

  const image = (s) => `<div class="newsimg" role="img" aria-label="${esc(s.headline)}"><div class="in"><div class="l">
<div><span class="lab">${esc(s.topic)}</span><div class="hl">${esc(s.headline)}</div></div></div>
<div class="r"><div class="circ"><svg viewBox="0 0 24 24" fill="none" stroke="#4b1e78" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[s.icon] || ICONS.calendar}</svg></div></div></div></div>`;

  const getJson = (f) => fetch(BASE + 'data/' + f, { cache: 'no-cache' }).then((r) => r.json());
  Promise.all([getJson('news.json'), getJson('news_live.json').catch(() => null)])
    .then(([data, built]) => {
      // Without the built list (an older build), fall back to the publish date.
      const live = built ? new Set(built.ids) : null;
      const stories = data.stories
        .filter((s) => preview || (live ? live.has(s.id) : parse(s.publish) <= today))
        .sort((a, b) => parse(b.publish) - parse(a.publish));
      render(stories);
    })
    .catch(() => render([]));

  function render(stories) {
    const latest = stories[0];
    if (home) {
      home.innerHTML = latest ? `${image(latest)}
<span class="small" style="margin-top:6px">${pretty(latest.date)} · From last week's Weekly Kick</span>
<span style="font-size:22px;font-weight:700;line-height:1.25">${esc(latest.headline)}</span>
<span>${esc(latest.summary)}</span>
<a href="${storyUrl(latest)}" class="go">Read more</a>`
        : '<p style="margin:0">Our first story is on its way. Subscribe to The Weekly Kick to read it first.</p>';
    }
    if (featured) {
      featured.innerHTML = latest ? `<div class="featured"><div>${image(latest)}</div><div>
<span class="eyebrow" style="margin:0">Latest · ${pretty(latest.date)}</span>
<span class="tag solid">${esc(latest.topic)}</span>
<span class="ftitle">${esc(latest.headline)}</span>
<span style="font-size:18px">${esc(latest.summary)}</span>
<span class="small">Source: ${esc(latest.sourceName)}</span>
<div class="row" style="align-items:center;margin-top:4px"><a href="${storyUrl(latest)}" class="btn btn-purple">Read the story</a><a class="btn btn-green" target="_blank" rel="noopener" href="${shareUrl(latest)}">Share on WhatsApp</a></div>
</div></div>`
        : '<p>Our first story is on its way. Subscribe to The Weekly Kick to read it first.</p>';
    }
    if (earlier) {
      const rest = stories.slice(1);
      earlier.hidden = rest.length === 0;
      earlier.querySelector('.cards').innerHTML = rest.map((s) => `<div class="card">${image(s)}
<span class="small">${pretty(s.date)}</span><span class="tag" style="align-self:flex-start;margin:0">${esc(s.topic)}</span>
<span style="font-size:21px;font-weight:700">${esc(s.headline)}</span><span>${esc(s.summary)}</span>
<span class="small">Source: ${esc(s.sourceName)}</span>
<div class="row" style="justify-content:space-between;align-items:center;margin-top:auto"><a href="${storyUrl(s)}" class="go">Read more</a><a href="${shareUrl(s)}" target="_blank" rel="noopener" style="font-weight:700;color:var(--green)">Share on WhatsApp</a></div></div>`).join('');
    }
  }
})();
