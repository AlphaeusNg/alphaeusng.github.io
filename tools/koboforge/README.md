# KoboForge tools

Client-side EPUB builder page:
https://alphaeusng.github.io/pages/kobo-forge.html

## Web converter

1. Drop DOCX / PDF / TXT / Markdown
2. Read **diagnostics** (empty pages, missing headings, table risks)
3. Use **Contents** + **PDF page chips** to spot-check structure
4. **Edit** (contenteditable) or **HTML** mode to fix body before export
5. Toggle **E-ink** for paper-like contrast
6. Download EPUB (NCX + nav TOC for Kobo)

Nothing is uploaded. Preferences (author, language, table/chapter toggles, e-ink) stick in `localStorage`.

## Tests

Lightweight regression checks for page contracts and pure helpers:

```bash
node tools/koboforge/test_logic.mjs
```

## License

Same as the main site. Use freely, improve, share.

Built because broken tables on Kobo are a personal insult.
