# BOOTLOADER.LIVE

A cyberpunk-themed landing page with terminal aesthetics, matrix rain effects, and glitch animations.

## 🚀 Free Hosting Options (Long-term)

### Recommended: GitHub Pages
- **Cost**: Free forever for public repositories
- **Custom domain**: Full support
- **Bandwidth**: Generous limits
- **Setup**: Push to GitHub → Enable Pages
- **Longevity**: ⭐⭐⭐⭐⭐ (GitHub isn't going anywhere)

### Alternative Options

1. **Netlify**
   - 100GB bandwidth/month free
   - Excellent performance
   - Easy custom domain setup
   - Automatic HTTPS

2. **Vercel**
   - Great performance and CDN
   - Simple deployment from Git
   - Generous free tier

3. **Cloudflare Pages**
   - Unlimited bandwidth on free tier
   - Global CDN
   - Fast builds and deployments

## 📡 Domain Setup (Squarespace DNS)

Since you bought the domain through Squarespace:

1. **Option A - Keep DNS with Squarespace**:
   - Add CNAME record: `www` → `your-username.github.io`
   - Add A records for apex domain to GitHub's IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

2. **Option B - Transfer DNS** (Recommended):
   - Point nameservers to your hosting provider
   - Manage DNS through hosting platform

## 🛠 Quick Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Push this code:
   ```bash
   git add .
   git commit -m "Initial commit: BOOTLOADER.LIVE landing page"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/bootloader.live.git
   git push -u origin main
   ```
3. Go to repository Settings → Pages
4. Set source to "Deploy from a branch"
5. Select `main` branch and `/ (root)`
6. Add your custom domain: `bootloader.live`

## 🎨 Features

- **Matrix rain animation** - Falling green characters background
- **Glitch effects** - Random text shadow glitches on title
- **Terminal simulation** - Authentic bootloader sequence
- **Responsive design** - Mobile and desktop optimized
- **Zero dependencies** - Single HTML file, works anywhere
- **Fast loading** - Minimal external resources

## 🔧 Customization

The page is designed to be self-contained. To modify:

- **Colors**: Update CSS variables in the `<style>` section
- **Content**: Edit the terminal commands and ASCII art
- **Animations**: Adjust timing in CSS keyframes and JavaScript intervals

## 📱 Mobile Responsive

The design automatically adapts to smaller screens:
- Responsive typography using `clamp()`
- Touch-friendly interface
- Optimized ASCII art scaling

---

**Status**: SYSTEM READY • Uptime: ∞ 