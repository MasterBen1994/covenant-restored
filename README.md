# Covenant Restored — Concept Site

A lightweight static concept site for Terrye McCaulay's marriage ministry. It's plain HTML, CSS and JS with no build step, and it runs on GitHub Pages.

> "Covenant Restored" is a placeholder ministry name.

## Files
| File | Purpose |
|---|---|
| `index.html` | Home: mission, story, six pillars, how it works, cohort, testimonies |
| `scorecard.html` + `js/scorecard.js` | 24-question Marriage Scorecard → teaser results → email capture |
| `thanks.html` | "Check your inbox" page |
| `masterclass.html` | Unlisted free masterclass page (link sent by email only) |
| `privacy.html`, `cohort-agreement.html`, `safety.html` | Policy drafts. **Attorney review required.** |
| `js/content.js` | **All editable copy**: name, story, testimonies, pillars, questions, tips |
| `js/config.js` | Email provider settings and `DEMO_MODE` |
| `robots.txt` | Keeps the concept out of search engines. Remove at launch. |

The internal docs (`ministry-model.md`, `content-workflow.md`) are gitignored so they never reach this public repo.

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Swap in client content
Edit `js/content.js`. Every placeholder is marked `[PLACEHOLDER]`. Search the HTML files for `[CLIENT` and `[DATE]` to find what's left in the policies. Add photos to `assets/` and set their paths in `SITE.images` in `js/content.js` (hero, portrait, hands, bible, family, cohort). Empty slots show a styled placeholder.

## Connect email (MailerLite)
`DEMO_MODE: true` logs the data in the browser console and doesn't send anything. To go live:
1. Create a MailerLite account and a group called **Scorecard**.
2. Create these custom fields: `overall_score`, `band`, `score_spiritual`, `score_communication`, `score_roles`, `score_conflict`, `score_intimacy`, `score_stewardship`, `weak_1`, `weak_2`.
3. Create an embedded form for the group. Copy its action URL (`https://assets.mailerlite.com/jsonp/.../subscribe`) into `MAILERLITE_FORM_URL`, then set `DEMO_MODE: false`.
4. Build an automation: **When subscriber joins group "Scorecard"** → send the results email (use conditional content on `weak_1` / `weak_2`), then the nurture sequence from the ministry model doc.
5. Run a test submission and confirm the fields came through in MailerLite.

The form posts with `mode: "no-cors"`, so the site can't read MailerLite's response. Check deliverability in MailerLite itself. If you switch to another provider, only replace `subscribe()` in `js/scorecard.js`.

## Masterclass video
Upload the video as **Unlisted** on YouTube (or use Vimeo) and set `masterclassEmbedUrl` in `js/content.js`. The page is hidden but not secure. Real gating comes with login in Phase 2.

## Deploy to GitHub Pages
Live at https://masterben1994.github.io/covenant-restored/ and it rebuilds automatically on every push to `main`:
```bash
git add -A && git commit -m "Update site" && git push
```
