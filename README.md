# bootloader.live

A static blog on AI-assisted development, MCP tools, and developer productivity. Hosted on GitHub Pages at [bootloader.live](https://bootloader.live).

## Architecture

Zero-build-step SPA. All rendering happens client-side:

- **marked.js** — Markdown to HTML
- **highlight.js** — Code syntax highlighting
- **mermaid 11** — Flowchart/diagram rendering (ESM import)
- **DOMPurify** — HTML sanitization
- **github-markdown.css** — Content styling matching [mdp](https://github.com/mxcoppell/mdp)

Single `index.html` file with hash-based routing (`#/post/slug`). No framework, no bundler, no CI pipeline.

## Adding a New Post

1. Copy the markdown from `ai-productivity-blog`:
   ```bash
   mkdir -p posts/<slug>
   cp ../ai-productivity-blog/posts/<slug>/blog.md posts/<slug>/
   cp -r ../ai-productivity-blog/posts/<slug>/images posts/<slug>/ 2>/dev/null
   ```

2. Add an entry to the `POSTS` array in `index.html`:
   ```js
   {
       slug: '<slug>',
       title: 'Post Title',
       date: 'YYYY-MM-DD',
       excerpt: 'First sentence or two.',
       tags: ['Tag1', 'Tag2'],
       file: 'blog.md'
   },
   ```

3. Push to `main` — GitHub Pages deploys automatically.

A Claude Code skill (`/publish-post`) automates this workflow.

## Features

- Light/dark theme toggle with localStorage persistence
- Mermaid diagram rendering matching mdp exactly
- Table of contents panel for longer posts
- Reading progress bar and estimated reading time
- Responsive design (mobile-friendly)
- Newsreader serif typography for headings

## Project Structure

```
bootloader.live/
├── index.html          # Complete SPA (HTML + CSS + JS)
├── CNAME               # GitHub Pages custom domain
├── posts/
│   ├── what-is-agent/
│   │   └── blog.md
│   ├── claude-code-team-experience/
│   │   ├── blog.md
│   │   └── images/
│   └── ...             # 8 posts total
└── .claude/
    └── skills/
        └── publish-post/
            └── SKILL.md
```
