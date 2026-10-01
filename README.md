# Wayfinder character selection

A responsive, framework-free character selection screen with individual character detail views.

## Run locally

From this directory, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Add character portraits

Portrait areas are intentionally placeholders. When images are ready, add them to an `images/` directory, add an `image` path to each character in `data.js`, and replace the placeholder markup in `app.js` and `character.js` with an `<img>` element. The recommended source aspect ratios are:

- Selection card: 3:4
- Detail portrait: 4:5

Character names, biographies, abilities, colors, and links are all managed in `data.js`.
