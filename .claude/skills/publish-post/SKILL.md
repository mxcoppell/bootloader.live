---
name: publish-post
description: This skill should be used when the user asks to "publish a post", "add a new blog post", "publish article", "add post from ai-productivity-blog", or mentions publishing/adding content to bootloader.live. Handles the complete workflow of copying a blog post from the ai-productivity-blog project and registering it in the blog site.
---

# Publish a Blog Post to bootloader.live

Automate publishing a markdown blog post from the `ai-productivity-blog` project to the `bootloader.live` static blog site.

## Prerequisites

- The `ai-productivity-blog` repo must exist at `../ai-productivity-blog` relative to this project
- The post directory must contain a markdown file (typically `blog.md`)

## Workflow

### 1. Identify the Post

If no slug is provided, list available posts:

```bash
ls ../ai-productivity-blog/posts/
```

Compare against existing posts in `posts/` to find unpublished ones. Present unpublished posts to the user for selection.

### 2. Copy Post Files

```bash
mkdir -p posts/<slug>
cp ../ai-productivity-blog/posts/<slug>/blog.md posts/<slug>/
```

If the post has an `images/` directory, copy that too:

```bash
cp -r ../ai-productivity-blog/posts/<slug>/images posts/<slug>/ 2>/dev/null
```

If no `blog.md` exists, find the primary `.md` file in the directory and use that filename instead.

### 3. Extract Metadata

Read the first 10 lines of the markdown to extract:
- **Title**: The first `# ` heading
- **Excerpt**: The first paragraph after the title (truncate to ~200 characters)

Determine the publication date from git history:

```bash
git -C ../ai-productivity-blog log --format="%ai" --diff-filter=A -- "posts/<slug>/" | tail -1
```

Use the earliest commit date, formatted as `YYYY-MM-DD`.

### 4. Infer Tags

Read the full post and infer 1-2 short tags from the content. Common tags in this blog:
- MCP, Agents, Architecture, SDK, AI Editors, Workflow, Teams, Claude Code, Prompt Engineering, Context, Pricing, Data Design

### 5. Register in POSTS Array

Open `index.html` and find the `const POSTS = [` array. Add a new entry:

```js
{
    slug: '<slug>',
    title: '<title from H1>',
    date: '<YYYY-MM-DD>',
    excerpt: '<first paragraph, ~200 chars>',
    tags: ['<Tag1>', '<Tag2>'],
    file: '<filename.md>'
},
```

The array is auto-sorted by date at runtime, so insertion position does not matter.

### 6. Verify

Start a local server and confirm the post renders correctly:

```bash
python3 -m http.server 8080 &
```

Navigate to `http://localhost:8080/#/post/<slug>` and verify:
- Content renders with correct text and formatting
- Mermaid diagrams display (if any)
- Tables have correct dark/light theme colors
- Back navigation works
- Post appears in the landing page list at the correct date position

Kill the server after verification.

### 7. Report

Output a summary:
- Post title
- Publication date
- URL path: `/#/post/<slug>`
- Number of mermaid diagrams (if any)
- Any issues found during verification
