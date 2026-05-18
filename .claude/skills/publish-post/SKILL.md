---
name: publish-post
description: This skill should be used when the user asks to "publish a post", "add a new blog post", "publish article", "add post from ai-productivity-blog", or mentions publishing/adding content to bootloader.live. Handles the complete workflow of copying a blog post from the ai-productivity-blog project and registering it in the blog site.
---

# Publish a Blog Post to bootloader.live

Publish a blog post from the `ai-productivity-blog` project into `bootloader.live`. Both Markdown (`blog.md`) and HTML (`blog.html`) formats are supported.

## Core principle

The post file ships content. **The host site (`index.html`) ships the renderer.** Copying the post is necessary but not sufficient — for HTML-format posts, the host's CSS, DOMPurify allowlist, and SVG-interaction JS must also support every class and convention the post uses. The source repo's `preview.html` (one per post) is the authoritative spec for how the post is expected to render. Treat it as ground truth.

If you only verify "the page loads," you will miss silent rendering failures: empty `var()` references collapse to SVG defaults (invisible strokes), missing class rules collapse to browser defaults (black SVG fills), and JS selector/attribute-name drift collapses to non-interactive UI. None of these throw errors.

## Prerequisites

- `ai-productivity-blog` repo at `../ai-productivity-blog` relative to this project
- Post directory contains either `blog.md` (Markdown) or `blog.html` (HTML)
- HTML posts also ship a `preview.html` next to `blog.html` — that's the renderer-of-record

## Workflow

### 1. Identify the post

```bash
ls ../ai-productivity-blog/posts/ | sort > /tmp/source-posts.txt
ls posts/ | sort > /tmp/host-posts.txt
diff /tmp/host-posts.txt /tmp/source-posts.txt | grep '^>'
```

Anything in source but not in host is unpublished. Present candidates; pick by user direction or by newest source commit date.

### 2. Detect format and copy files

```bash
ls ../ai-productivity-blog/posts/<slug>/
```

If `blog.html` is present, treat it as an HTML-format post (different verification path). Otherwise it's Markdown.

```bash
mkdir -p posts/<slug>
cp ../ai-productivity-blog/posts/<slug>/blog.{md,html} posts/<slug>/ 2>/dev/null
cp -r ../ai-productivity-blog/posts/<slug>/images posts/<slug>/ 2>/dev/null
```

**Always confirm byte-identity with `diff`** — never edit the post file. If diff is not identical, stop and figure out why before continuing.

```bash
diff posts/<slug>/blog.html ../ai-productivity-blog/posts/<slug>/blog.html && echo IDENTICAL
```

### 3. Extract metadata

**Markdown** — title from first `# `, excerpt from first paragraph after the title.

**HTML** — `blog.html` has no `<h1>` (the SPA injects it). Pull title from `goal.md` (first `# ` heading) or use the commit subject. Excerpt comes from `<p class="lead">` text content.

Date from earliest commit on the post directory:

```bash
git -C ../ai-productivity-blog log --format="%ai" --diff-filter=A -- "posts/<slug>/" | tail -1
```

### 4. **HTML-only: host-capability pre-flight** (skip for Markdown)

Markdown posts go through `marked` and rarely surface host bugs. HTML posts route raw fragments through DOMPurify and rely on `.post-html .svg-figure ...` CSS plus `initHoverReveal` / `initStepThrough` / `initToggleView` JS. These three surfaces have drifted from the source's `preview.html` before — verify each one explicitly.

**4a. Class vocabulary check.** List every class the post uses, then confirm each appears in `index.html`:

```bash
grep -oE 'class="[^"]+"' posts/<slug>/blog.html \
  | sed 's/class="//;s/"$//' | tr ' ' '\n' | sort -u > /tmp/post-classes.txt

# Each post class should appear in index.html. Anything missing is a future bug.
while read cls; do
  grep -q "\.$cls\b" index.html || echo "MISSING: .$cls"
done < /tmp/post-classes.txt
```

For any `MISSING:` output, add a matching CSS rule under `.post-html .svg-figure ...` in `index.html`, mirroring the corresponding rule in `../ai-productivity-blog/posts/<slug>/preview.html`. **Do not invent styling** — copy from the source preview.

**4b. CSS variable check.** When mirroring rules from `preview.html`, confirm every `var(--token)` reference resolves in the host's theme blocks (around `:root, [data-theme="dark"]` and `[data-theme="light"]`). Known dangling tokens that have caused silent stroke/fill failures: `--text-body`, `--border-soft`. If a needed token doesn't exist, either define it in both theme blocks or substitute an existing token with comparable contrast (`--text-secondary` is usually the right substitute for SVG strokes — it has WCAG-compliant contrast in both themes).

**4c. DOMPurify allowlist check.** Find `sanitizeHtmlFragment` in `index.html`. Verify any non-standard SVG attributes the post uses (e.g., `data-step`, `data-view`, `data-label`, custom `data-*`) appear in `ADD_ATTR`. Standard SVG attributes (`x`, `y`, `cx`, `cy`, `r`, `stroke-dasharray`, `viewBox`, etc.) are covered by `USE_PROFILES: { svg: true }`.

**4d. JS attribute-convention check.** Look at the source's `preview.html` `<script>` block. Find `initToggleView` / `initStepThrough` / `initHoverReveal`. Compare attribute names the source's JS reads/writes against the host's. Past divergences:
- Toggle-view: source uses SVG `display="none"` attribute; host previously toggled HTML `hidden`. Mirror the source.
- Step-through: source CSS uses `[data-state="active"]`; host JS sets `data-active="true"`. Mirror whichever side is correct and align both.

Whenever you find drift, the source's `preview.html` is the spec. Update the host to match — both CSS selectors and JS attribute names.

### 5. Register in `POSTS[]`

In `index.html`, find `const POSTS = [` and add at the top (array is sorted by date at runtime, so position doesn't matter for display):

```js
{
    slug: '<slug>',
    title: '<title>',
    date: '<YYYY-MM-DD>',
    excerpt: '<lead paragraph, ~200–300 chars>',
    tags: ['<Tag1>', '<Tag2>'],
    file: '<blog.md or blog.html>'
},
```

Tag pool in current rotation: `MCP`, `Agents`, `Architecture`, `SDK`, `AI Editors`, `Workflow`, `Teams`, `Claude Code`, `Prompt Engineering`, `Context`, `Pricing`, `Data Design`. Pick two that best describe the post; introduce a new tag only when nothing fits.

Escape apostrophes in single-quoted strings (`'Claude Code\'s ...'`). The `build.js` parser uses regex — keep field syntax simple.

### 6. Build

```bash
node build.js
```

Regenerates `posts/<slug>/index.html`, `sitemap.xml`, `llms.txt`. Confirm output mentions the new slug.

### 7. Verify rendering

Start a local server:

```bash
python3 -m http.server 8080 > /tmp/http-server.log 2>&1 &
sleep 1
```

**For Markdown posts**, screenshot the rendered post and landing page:

```bash
npx agent-browser open "http://localhost:8080/#/post/<slug>" \
  && npx agent-browser wait --load networkidle \
  && npx agent-browser wait 1500 \
  && npx agent-browser screenshot /tmp/<slug>-post.png
```

Visual check: title, date, paragraphs, code blocks, mermaid diagrams, images.

**For HTML posts**, do everything above PLUS:

**7a. Side-by-side preview parity.** In a second terminal or browser tab, serve the source's preview:

```bash
(cd ../ai-productivity-blog/posts/<slug> && python3 -m http.server 8765 > /tmp/preview-server.log 2>&1 &)
sleep 1
npx agent-browser open "http://127.0.0.1:8765/preview.html"
npx agent-browser screenshot /tmp/<slug>-source.png
```

Then open bootloader.live's render and screenshot the same SVG. Compare visually. Anything that looks meaningfully different is a host-side gap to close before publishing.

**7b. Computed-style probe.** For every interactive SVG, confirm key style properties aren't falling through to defaults:

```bash
npx agent-browser eval "(() => {
  const checks = [];
  document.querySelectorAll('.post-html .svg-figure .edge').forEach(e => {
    const s = getComputedStyle(e);
    if (s.stroke === 'none' || !s.stroke) checks.push('edge stroke fell to default');
  });
  document.querySelectorAll('.post-html .svg-figure .layer-band').forEach(e => {
    const s = getComputedStyle(e);
    if (s.fill === 'rgb(0, 0, 0)') checks.push('layer-band fill is pure black (missing rule)');
  });
  document.querySelectorAll('.post-html .svg-figure .label.box-title').forEach(e => {
    if (parseInt(getComputedStyle(e).fontSize) <= 14) checks.push('box-title not enlarged (missing rule)');
  });
  return checks.length ? checks : 'all OK';
})()"
```

Add more probes as new classes appear. If any check fails, fix the host CSS before publishing.

**7c. Interactive click-through.** Static screenshots will miss tab-toggles that swap to a blank view. Click every interactive control once and verify state changes:

```bash
# Toggle-view: click each tab, confirm view actually changes
npx agent-browser eval "(() => {
  const fig = document.querySelector('[data-interaction=\"toggle-view\"]');
  if (!fig) return 'no toggle-view';
  const tabs = fig.querySelectorAll('button[role=\"tab\"]');
  return Array.from(tabs).map(t => {
    t.click();
    const view = fig.querySelector('g[data-view=\"' + t.getAttribute('data-view') + '\"]');
    return {
      tab: t.textContent.trim(),
      viewVisible: view && !view.hasAttribute('display') && !view.hasAttribute('hidden')
    };
  });
})()"

# Step-through: click Next, confirm active step advances
npx agent-browser eval "(() => {
  const fig = document.querySelector('[data-interaction=\"step-through\"]');
  if (!fig) return 'no step-through';
  fig.querySelector('[data-action=\"next\"]')?.click();
  const active = fig.querySelector('.step[data-active=\"true\"]');
  return { activeStep: active?.getAttribute('data-step') };
})()"

# Hover-reveal: focus a node, confirm legend updates
npx agent-browser eval "(() => {
  const fig = document.querySelector('[data-interaction=\"hover-reveal\"]');
  if (!fig) return 'no hover-reveal';
  fig.querySelector('.node[tabindex]')?.focus();
  return { legend: fig.querySelector('.svg-legend')?.textContent?.slice(0, 80) };
})()"
```

Each probe should return real state, not `undefined` or default values. If any interaction doesn't work, the host JS is out of sync with the source — fix before publishing.

**7d. Landing page placement.**

```bash
npx agent-browser open "http://localhost:8080/" \
  && npx agent-browser wait --load networkidle \
  && npx agent-browser wait 1000 \
  && npx agent-browser screenshot /tmp/<slug>-landing.png
```

Confirm the post appears at the expected date position with correct title, excerpt, tags.

**7e. Light theme.** Switch theme and re-check the SVGs; light-theme contrast is the most common silent regression for SVG strokes:

```bash
npx agent-browser eval "document.documentElement.setAttribute('data-theme','light')"
npx agent-browser wait 600
npx agent-browser screenshot /tmp/<slug>-light.png
```

Cleanup:

```bash
npx agent-browser close 2>/dev/null
pkill -f "http.server 8080" 2>/dev/null
pkill -f "http.server 8765" 2>/dev/null
```

### 8. Commit

Stage post files, generated SEO files, and any `index.html` changes (CSS/JS additions from step 4):

```bash
git add posts/<slug>/ index.html sitemap.xml llms.txt
git commit -m 'Publish "<title>" blog post'
```

If the host needed CSS or JS changes to support the post, **separate them into their own commits** so the publish commit stays content-only:

```bash
# Commit 1: host-support additions
git add index.html
git commit -m 'fix(css): add rules for <classes> used by <slug> post'

# Commit 2: the publish itself
git add posts/<slug>/ sitemap.xml llms.txt
git commit -m 'Publish "<title>" blog post'
```

This makes the diff scope readable later and isolates host-side debt from the publication.

### 9. Push and merge

```bash
git push --set-upstream origin HEAD
```

`main` has branch protection requiring 1 approving review (which the author can't self-approve). The recent commit history goes direct-to-main without PRs for small fixes, but the publication workflow does open PRs.

Open a PR; if the user explicitly authorizes admin override, merge via:

```bash
gh pr merge <PR#> --squash --admin --delete-branch
```

Never use `--admin` without explicit user authorization in the current session.

Worktree caveat: `--delete-branch` will fail when the local branch is checked out in the calling worktree. Delete the remote branch separately:

```bash
git push origin --delete <branch-name>
```

### 10. Report

Output a concise summary:

- Post title and URL: `https://bootloader.live/posts/<slug>/`
- Format (Markdown vs HTML)
- Publication date and landing-page position
- For HTML posts: which interactive patterns were verified (hover-reveal / step-through / toggle-view) and any host-support commits that landed alongside
- Any issues that remain unresolved (e.g., GitHub Pages cache lag, follow-up improvements)

## Red flags — stop and ask

- The post file diff against the source is not identical
- The source repo has uncommitted changes (preview may not reflect what's published upstream)
- An HTML post uses classes not present in `index.html` AND not in the source's `preview.html` either (suggests the source itself is broken)
- DOMPurify is stripping attributes the post depends on (probe with `node.getAttribute(...)` after sanitization)
- Branch protection blocks the merge and admin override hasn't been authorized
