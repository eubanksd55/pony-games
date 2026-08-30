# Pony Games

A small collection of letter and number games, hosted on GitHub Pages:
https://eubanksd55.github.io/pony-games/

Two skins of the same games: **Ponies** and **Dinos**. Switch on the hub.

## File layout

All files live at the repo root; there is no build step and no dependencies.

| File           | Purpose                                       |
| -------------- | --------------------------------------------- |
| `index.html`   | Hub: game list, skin switch, glyph picker     |
| `letters.html` | Game 1 - hear it, find it on the board        |
| `trace.html`   | Game 2 - write it with a finger               |
| `shared.css`   | Shared styles and both skin palettes          |
| `shared.js`    | Shared runtime, defines the global `PG`       |
| `proof.html`   | Bench tool, not linked from the games         |

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

## What she practises

The glyph picker covers `a-z` and `0-9`. The chosen set is stored per device
under `focus` and is shared by both games; a device that has never set one
starts on the "tricky nine" (`b d p q g j i y w`), not on the whole alphabet.

Two rules worth knowing before changing the games:

- **Distractor tiles are drawn from the whole alphabet, not just her set.**
  The board grows to nine tiles and a focus set may be much smaller than
  that. A board that cannot fill is a board she can finish by elimination.
- **A numeral has a name but no initial sound.** Sounds mode skips digits and
  asks by name instead; `PG.hasSound(g)` is the check.

## Letterforms

Every glyph is drawn from `STROKES` in `shared.js` rather than from a font,
so it looks identical whether she is reading it or writing it, and does not
change shape between devices. Each entry is an ordered list of pen strokes in
the order a child is taught to form it; the direction a path runs is the
direction her finger has to move.

They all sit on one ruling in a 100x100 box:

```
ascender top 26 | x-height top 46 | BASELINE 72 | descender 88
capital top 30  | digits sit cap height, 30 to 72
bowls are r=13 centred at y=59
```

**Open `proof.html` after touching any of them.** It renders all 62 glyphs
with a green dot where each stroke starts, an arrowhead where it ends, and
the stroke number, so order and direction can be checked by eye. Arc sweep
flags are very easy to get backwards and look plausible in the diff: `u` and
`U` both shipped through review as arches before this sheet caught them.

Only a glyph with strokes can be traced. One without them measures zero
length, which trips the short-stroke shortcut meant for the dots on `i` and
`j` and hands the letter over as an instant win, so `trace.html` filters on
`PG.traceable(g)` rather than trusting the set.

## Updating

Run `./deploy.sh "your message"` (or `sh deploy.sh`). Pages redeploys from
`main` in about a minute.

## iOS home-screen note

iOS caches home-screen web apps aggressively. After an update, if the icon
still opens the old version, delete the icon and re-add it from Safari
(Share > Add to Home Screen).
