# KickStartYou pages

Public pages for KickStartYou, served with GitHub Pages.

The website (kickstartyou.org once the domain is pointed here):

- `index.html` (Home), `roles/`, `news/` (with `news/story/?id=...`), `about/`, `legal/` (`#privacy`, `#terms`, `#cookies`).
- `assets/site.css` and `assets/site.js`: shared look, cookie banner, analytics (only after Accept), the sign-up pop-up and the "Never miss a role" side tab. Analytics IDs go in `CONFIG` at the top of `site.js`.
- `assets/roles.js` reads `data/roles.json` (the roles tracker). `assets/news.js` reads `data/news.json` for the story lists; a story shows from its `publish` date, a week after its Weekly Kick edition. Add `?preview` to a news address to see stories before then.
- `scripts/build_news.py` turns `data/news.json` into one plain-HTML page per published story (`news/<id>/`, with Google and sharing tags), plus `sitemap.xml` and `robots.txt`. Run it after editing the news data and on each Thursday a story becomes due. `--preview` also builds unpublished stories for local checking; run it again without `--preview` before committing.
- All links are relative, so the site works both at the GitHub Pages address and on its own domain.

Other pages:

- `subscribed/`: where readers land after clicking "Yes, sign me up" in the double opt-in confirmation email.
- `thanks/`: the page readers see after tapping a poll option in The Weekly Kick. Each option links here with a different `?poll=...&vote=...` ending, and Brevo's click report counts the votes. The page itself stores nothing.

Nothing private belongs in this repository: it is public.
