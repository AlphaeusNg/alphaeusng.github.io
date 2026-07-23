# KoboForge tools

Client-side EPUB builder page:
https://alphaeusng.github.io/pages/kobo-forge.html

The entry point is `pages/kobo-forge.html`; route-specific presentation and
application logic live in `css/kobo-forge.css` and `js/kobo-forge.js`.

## Web converter

1. Drop DOCX / PDF / TXT / Markdown
2. Read **diagnostics** (empty pages, missing headings, table risks)
3. Choose your Kobo directly beneath the uploader (Kobo Libra Colour by default)
4. The converted document opens automatically in the paginated **Device** view
5. Adjust preview-only reader size, margin, orientation, and header/footer
6. Use **Contents** + **PDF page chips** to spot-check structure
7. **Edit** (contenteditable) or use **HTML** mode to fix the body
8. Download EPUB (NCX + nav TOC for Kobo)

Device profiles use Kobo’s published screen resolution, PPI, and physical body
dimensions for Clara BW/Colour, Libra Colour, Sage, and Elipsa 2E. The browser
simulates pagination from the export body; exact line breaks can still vary by
firmware, font, and settings.

## Image converter

The same page converts local PNG, JPEG, WebP, GIF, and BMP files to the selected
Kobo screen’s exact portrait or landscape pixel size. It supports contain/cover,
colour, 16-level grayscale, Floyd–Steinberg B&W dithering, contrast, PNG, and
JPEG output.

Nothing is uploaded. Preferences (author, language, table/chapter toggles, and
device choices) stick in `localStorage`.

## Tests

Lightweight regression checks for page contracts and pure helpers:

```bash
node tools/koboforge/test_logic.mjs
```

## License

Same as the main site. Use freely, improve, share.

Built because broken tables on Kobo are a personal insult.
