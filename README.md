# architsingh5.github.io

Personal portfolio of **Archit Singh**, a software engineer at Goldman Sachs who builds high-throughput Java services and Kafka pipelines.

Live: https://architsingh5.github.io

## Stack
Plain HTML, CSS and vanilla JS, with no build step. GitHub Pages serves the `main` branch as it is.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.

## Structure
| File | Purpose |
|---|---|
| `index.html` | All content and sections |
| `styles.css` | Design tokens (dark and light), layout, responsive rules |
| `script.js` | Theme toggle, active-section nav, hero "event stream" canvas |
| `assets/` | Favicon, portrait, social preview image, `icons.svg` sprite (Simple Icons, CC0; Lucide, ISC) |
| `PLAN.md` | Content, design and deployment plan |

## Updating content
Edit the text in `index.html`, then commit and push to `main`. Pages redeploys automatically.
