# Naval Command warship selection

A responsive, framework-free warship selection screen with individual fleet-record views.

## Run locally

From this directory, run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Add warship images

The current transparent character artwork is stored in `images/warships/` and mapped to each ship through the `image` field in `data.js`. Both image frames use the artwork's native 3:4 ratio and `object-fit: contain`, so the supplied PNGs are never cropped.

- Selection card: 3:4
- Detail image: 3:4

Ship names, historical summaries, placeholder capabilities, colors, and links are all managed in `data.js`.
