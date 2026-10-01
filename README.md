# Naval Command warship selection

A responsive, framework-free warship selection screen with individual fleet-record views.

## Run locally

From this directory, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Add warship images

Image areas are intentionally placeholders. When images are ready, add them to an `images/` directory, add an `image` path to each ship in `data.js`, and replace the placeholder markup in `app.js` and `character.js` with an `<img>` element. The recommended source aspect ratios are:

- Selection card: 3:4
- Detail image: 4:5

Ship names, historical summaries, placeholder capabilities, colors, and links are all managed in `data.js`.
