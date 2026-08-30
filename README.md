# Pony Games

A small collection of pony-themed learning games, hosted on GitHub Pages:
https://eubanksd55.github.io/pony-games/

## File layout

All files live at the repo root; there is no build step.

| File          | Purpose                                  |
| ------------- | ---------------------------------------- |
| `index.html`  | Hub / landing page linking to each game  |
| `letters.html`| Game 1 - letters                         |
| `trace.html`  | Game 2 - tracing                         |
| `shared.css`  | Shared styles used by every page         |
| `shared.js`   | Shared runtime used by every page        |

## Adding a new game

A new game is one HTML file at the repo root that links the shared files:

```html
<link rel="stylesheet" href="shared.css">
...
<script src="shared.js"></script>
```

Then add a link to it from `index.html` so it shows up on the hub.

Both `shared.css` and `shared.js` are required. If either fails to load, the
game renders unstyled and non-functional, so keep the paths relative and flat.

## Updating

Run `./deploy.sh "your message"` (or `sh deploy.sh`). Pages redeploys from
`main` in about a minute.

## iOS home-screen note

iOS caches home-screen web apps aggressively. After an update, if the icon
still opens the old version, delete the icon and re-add it from Safari
(Share > Add to Home Screen).
