from __future__ import annotations

import unittest

from tools.sync_gdoc import build_document, parse_html, plain_inlines

SAMPLE = """
<html><head><style>
.c2 { font-weight: 700; }
.c7 { font-style: italic; }
.c19 { font-size: 10pt; }
.c12 { font-size: 12pt; }
p { font-size: 11pt; }
</style></head><body>
<h1 id="h.opening">Opening thought</h1>
<p>Hello <span class="c7">friend</span> <span class="c19 c7">small note</span> <span class="c12 c7">kept line</span>
<a href="https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fnote&amp;sa=D">the note</a>
<sup><a href="#ftnt1" id="ftnt_ref1">[1]</a></sup></p>
<p class="empty"><span></span></p>
<ol class="lst-kix_demo-0 start" start="1"><li><span class="c2">One</span></li></ol>
<ol class="lst-kix_demo-1 start" start="1"><li>Nested</li></ol>
<ol class="lst-kix_demo-0" start="2"><li>Two</li></ol>
<p>Footnote bookmark</p>
<hr>
<div><p><a href="#ftnt_ref1" id="ftnt1">[1]</a> A softer way to say it.</p></div>
</body></html>
"""


class SyncGdocTests(unittest.TestCase):
    def test_reader_document_keeps_structure_and_unwraps_links(self) -> None:
        blocks, footnotes = parse_html(SAMPLE)

        self.assertEqual(plain_inlines(blocks[0]["inlines"]), "Opening thought")
        self.assertEqual(blocks[0]["id"], "h.opening")
        paragraph = blocks[1]
        self.assertEqual(paragraph["inlines"][1]["italic"], True)
        self.assertNotIn("size", paragraph["inlines"][1])
        self.assertEqual(paragraph["inlines"][2]["size"], 10)
        self.assertEqual(paragraph["inlines"][3]["size"], 12)
        self.assertEqual(paragraph["inlines"][4]["href"], "https://example.com/note")
        self.assertEqual(paragraph["inlines"][-1], {"footnote": "1"})
        listing = next(block for block in blocks if block["type"] == "list")
        self.assertEqual(plain_inlines(listing["items"][0]["inlines"]), "One")
        self.assertTrue(listing["items"][0]["inlines"][0]["bold"])
        self.assertEqual(plain_inlines(listing["items"][0]["lists"][0]["items"][0]["inlines"]), "Nested")
        self.assertEqual(plain_inlines(listing["items"][1]["inlines"]), "Two")
        self.assertEqual(footnotes[0]["id"], "1")
        self.assertIn("softer way", plain_inlines(footnotes[0]["inlines"]))
        self.assertNotIn("Footnote bookmark", " ".join(plain_inlines(block.get("inlines", [])) for block in blocks))

    def test_build_document_names_the_source(self) -> None:
        document = build_document(SAMPLE, title="Alphaeus' thoughts", source_url="https://docs.google.com/document/d/abc/edit")

        self.assertEqual(document["title"], "Alphaeus' thoughts")
        self.assertEqual(document["sourceUrl"], "https://docs.google.com/document/d/abc/edit")
        self.assertTrue(document["exportedAt"])


if __name__ == "__main__":
    unittest.main()
