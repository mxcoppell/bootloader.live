#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const SITE_URL = 'https://bootloader.live';
const SITE_NAME = 'bootloader.live';
const SITE_DESCRIPTION = 'Practical writing on AI-assisted development, MCP tools, and developer productivity.';

// ─── Parse POSTS array from index.html ─────────────────
// Extracts each post object using regex pattern matching.
function parsePosts() {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
    const startMarker = 'const POSTS = [';
    const endMarker = '].sort(';
    const startIdx = html.indexOf(startMarker);
    const endIdx = html.indexOf(endMarker, startIdx);
    if (startIdx === -1 || endIdx === -1) {
        throw new Error('Could not find POSTS array in index.html');
    }
    const arrayStr = html.slice(startIdx + startMarker.length, endIdx);

    const posts = [];
    // Match each { ... } object block
    const matches = arrayStr.match(/\{[^}]+\}/g) || [];
    for (const block of matches) {
        const post = {};

        // Extract simple string fields (handles both 'single' and "double" quotes)
        const simpleField = (name) => {
            // Try single-quoted first, then double-quoted
            const reSingle = new RegExp(name + "\\s*:\\s*'([^']*)'");
            const reDouble = new RegExp(name + '\\s*:\\s*"([^"]*)"');
            const m = block.match(reSingle) || block.match(reDouble);
            return m ? m[1] : '';
        };

        post.slug = simpleField('slug');
        post.title = simpleField('title');
        post.date = simpleField('date');
        post.file = simpleField('file') || 'blog.md';

        // Extract excerpt — may contain escaped quotes
        const excerptMatch = block.match(/excerpt\s*:\s*(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/);
        post.excerpt = excerptMatch ? excerptMatch[2].replace(/\\'/g, "'").replace(/\\"/g, '"') : '';

        // Extract tags array
        const tagsMatch = block.match(/tags\s*:\s*\[([^\]]*)\]/);
        if (tagsMatch) {
            post.tags = [];
            const tagEntries = tagsMatch[1].match(/['"]([^'"]*)['"]/g) || [];
            for (const t of tagEntries) {
                post.tags.push(t.replace(/['"]/g, ''));
            }
        } else {
            post.tags = [];
        }

        if (post.slug) posts.push(post);
    }

    return posts;
}

// ─── Render a post's markdown to HTML ──────────────────
function renderMarkdown(mdContent) {
    return marked.parse(mdContent);
}

// ─── Generate pre-rendered post page ───────────────────
function generatePostPage(post, renderedHtml) {
    const postUrl = SITE_URL + '/posts/' + post.slug + '/';
    const escapedTitle = escapeHtml(post.title);
    const escapedExcerpt = escapeHtml(post.excerpt);
    const keywords = (post.tags || []).join(', ');

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        url: postUrl,
        author: { '@type': 'Person', name: 'Michael Xie' },
        keywords: keywords,
        publisher: { '@type': 'Person', name: 'Michael Xie' }
    }, null, 4);

    return '<!DOCTYPE html>\n'
+ '<html lang="en">\n'
+ '<head>\n'
+ '    <meta charset="UTF-8">\n'
+ '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
+ '    <title>' + escapedTitle + ' \u2014 ' + SITE_NAME + '</title>\n'
+ '    <meta name="description" content="' + escapedExcerpt + '">\n'
+ '    <link rel="canonical" href="' + postUrl + '">\n'
+ '    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>\uD83D\uDE80</text></svg>">\n'
+ '\n'
+ '    <!-- Open Graph -->\n'
+ '    <meta property="og:title" content="' + escapedTitle + '">\n'
+ '    <meta property="og:description" content="' + escapedExcerpt + '">\n'
+ '    <meta property="og:type" content="article">\n'
+ '    <meta property="og:url" content="' + postUrl + '">\n'
+ '    <meta property="og:site_name" content="' + SITE_NAME + '">\n'
+ '\n'
+ '    <!-- Twitter Card -->\n'
+ '    <meta name="twitter:card" content="summary">\n'
+ '    <meta name="twitter:title" content="' + escapedTitle + '">\n'
+ '    <meta name="twitter:description" content="' + escapedExcerpt + '">\n'
+ '\n'
+ '    <!-- JSON-LD -->\n'
+ '    <script type="application/ld+json">\n'
+ '    ' + jsonLd + '\n'
+ '    </script>\n'
+ '\n'
+ '    <style>\n'
+ '        body {\n'
+ '            font-family: \'Newsreader\', Georgia, serif;\n'
+ '            max-width: 740px;\n'
+ '            margin: 0 auto;\n'
+ '            padding: 2rem 1rem;\n'
+ '            background: #222222;\n'
+ '            color: #e6edf3;\n'
+ '            line-height: 1.7;\n'
+ '        }\n'
+ '        a { color: #58a6ff; }\n'
+ '        pre { background: #2a2a2a; padding: 1rem; border-radius: 6px; overflow-x: auto; }\n'
+ '        code { font-size: 0.9em; }\n'
+ '        img { max-width: 100%; height: auto; }\n'
+ '        h1 { font-size: 2rem; margin-bottom: 0.5rem; }\n'
+ '        .meta { color: #8b949e; font-size: 0.9rem; margin-bottom: 2rem; }\n'
+ '    </style>\n'
+ '</head>\n'
+ '<body>\n'
+ '    <script>window.location.replace(\'' + SITE_URL + '/#/post/' + post.slug + '\');</script>\n'
+ '\n'
+ '    <article>\n'
+ '        <h1>' + escapedTitle + '</h1>\n'
+ '        <div class="meta">' + formatDate(post.date) + '</div>\n'
+ '        ' + renderedHtml + '\n'
+ '    </article>\n'
+ '\n'
+ '    <p><a href="' + SITE_URL + '">\u2190 Back to ' + SITE_NAME + '</a></p>\n'
+ '\n'
+ '    <script>window.goatcounter={no_onload:true};</script>\n'
+ '    <script data-goatcounter="https://mxcoppell.goatcounter.com/count"\n'
+ '            async src="//gc.zgo.at/count.js"></script>\n'
+ '</body>\n'
+ '</html>';
}

// ─── Generate sitemap.xml ──────────────────────────────
function generateSitemap(posts) {
    const today = new Date().toISOString().split('T')[0];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += '  <url>\n    <loc>' + SITE_URL + '/</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n';

    // Posts
    for (const post of posts) {
        xml += '  <url>\n    <loc>' + SITE_URL + '/posts/' + post.slug + '/</loc>\n    <lastmod>' + post.date + '</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n';
    }

    xml += '</urlset>\n';
    return xml;
}

// ─── Generate llms.txt ─────────────────────────────────
function generateLlmsTxt(posts) {
    let txt = '# ' + SITE_NAME + '\n\n';
    txt += '> ' + SITE_DESCRIPTION + '\n\n';
    txt += 'This blog covers AI-assisted software development, MCP (Model Context Protocol) tools, developer productivity, and agentic workflows.\n\n';
    txt += '## Posts\n\n';

    // Sort by date descending
    const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const post of sorted) {
        txt += '- [' + post.title + '](' + SITE_URL + '/posts/' + post.slug + '/): ' + post.excerpt + '\n';
    }

    txt += '\n## Links\n\n';
    txt += '- Homepage: ' + SITE_URL + '\n';
    txt += '- Sitemap: ' + SITE_URL + '/sitemap.xml\n';

    return txt;
}

// ─── Helpers ───────────────────────────────────────────
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Main ──────────────────────────────────────────────
function main() {
    const posts = parsePosts();
    console.log('Found ' + posts.length + ' posts');

    let generated = 0;
    for (const post of posts) {
        const mdPath = path.join(__dirname, 'posts', post.slug, post.file || 'blog.md');
        if (!fs.existsSync(mdPath)) {
            console.warn('  Warning: Skipping ' + post.slug + ': ' + mdPath + ' not found');
            continue;
        }

        const md = fs.readFileSync(mdPath, 'utf-8');
        const renderedHtml = renderMarkdown(md);

        const outDir = path.join(__dirname, 'posts', post.slug);
        const outPath = path.join(outDir, 'index.html');
        fs.writeFileSync(outPath, generatePostPage(post, renderedHtml));
        console.log('  + posts/' + post.slug + '/index.html');
        generated++;
    }

    // Sitemap
    const sitemap = generateSitemap(posts);
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
    console.log('  + sitemap.xml (' + (posts.length + 1) + ' URLs)');

    // llms.txt
    const llmsTxt = generateLlmsTxt(posts);
    fs.writeFileSync(path.join(__dirname, 'llms.txt'), llmsTxt);
    console.log('  + llms.txt');

    console.log('\nDone: ' + generated + ' post pages, sitemap.xml, llms.txt');
}

main();
