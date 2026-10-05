(function () {
    "use strict";

    var FIGURES = {
        "opening thought": {
            src: "../assets/thoughts/lamp.jpg",
            alt: "An open notebook and a brass lamp on a dark wooden desk",
            caption: "“with utmost love in the hope of unity”"
        },
        "why i feel convicted to explore beyond lcoc": {
            src: "../assets/thoughts/doorway.jpg",
            alt: "Morning light coming through an open wooden door",
            caption: "“Not as I will, but as He wills.”"
        },
        "theology of baptism": {
            src: "../assets/thoughts/water.jpg",
            alt: "A stone basin of still water beside a folded white cloth",
            caption: "“not due to the COC’s understanding of baptism”"
        },
        "a little dive": {
            src: "../assets/thoughts/scripture.jpg",
            alt: "An open book in a single shaft of warm light",
            caption: "“helpful principles to understand Scripture”"
        }
    };

    var letter = document.getElementById("letter");
    var meta = document.getElementById("meta");
    var path = document.getElementById("path");
    var outline = document.getElementById("outline");
    var outlineMobile = document.getElementById("outline-mobile");
    var progress = document.querySelector(".read-bar__progress span");
    var searchInput = document.getElementById("search-input");
    var searchCount = document.getElementById("search-count");
    var noteBackdrop = document.getElementById("note-backdrop");
    var noteTitle = document.getElementById("note-title");
    var noteBody = document.getElementById("note-body");
    var outlineDialog = document.getElementById("outline-dialog");
    var headings = [];
    var matches = [];
    var matchIndex = 0;
    var noteOpener = null;
    var footnotes = {};
    var outlineChoseHeading = false;

    function keyOf(text) {
        return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    }

    function plain(inlines) {
        return (inlines || []).map(function (part) { return part.text || ""; }).join("").trim();
    }

    function whollyItalic(inlines) {
        var parts = (inlines || []).filter(function (part) { return part.text && part.text.trim(); });
        return parts.length > 0 && parts.every(function (part) { return part.italic; });
    }

    function lensOf(text) {
        if (/^COC Understanding\b/i.test(text)) return "coc";
        if (/^Sola Fide Understanding\b/i.test(text)) return "fide";
        return "";
    }

    function el(tag, className) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        return node;
    }

    function appendLinkified(parent, text) {
        var pattern = /https?:\/\/[^\s<>"]+/g;
        var last = 0;
        var match;
        while ((match = pattern.exec(text))) {
            parent.appendChild(document.createTextNode(text.slice(last, match.index)));
            var link = document.createElement("a");
            link.href = match[0];
            link.textContent = match[0];
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            parent.appendChild(link);
            last = match.index + match[0].length;
        }
        parent.appendChild(document.createTextNode(text.slice(last)));
    }

    function renderInlines(parent, inlines) {
        (inlines || []).forEach(function (part) {
            if (part.footnote) {
                var button = el("button", "footnote");
                button.type = "button";
                button.textContent = part.footnote;
                button.setAttribute("aria-label", "Show note " + part.footnote);
                button.addEventListener("click", function () { openNote(part.footnote, button); });
                parent.appendChild(button);
                return;
            }
            var node = parent;
            if (part.href) {
                node = document.createElement("a");
                node.href = part.href;
                if (/^https?:/i.test(part.href)) {
                    node.target = "_blank";
                    node.rel = "noopener noreferrer";
                }
                parent.appendChild(node);
            }
            var styled = node;
            var inHeading = /^H[1-6]$/.test(parent.tagName);
            if (part.bold) {
                styled = document.createElement("strong");
                node.appendChild(styled);
            }
            if (part.italic) {
                var italic = document.createElement("em");
                styled.appendChild(italic);
                styled = italic;
            } else if (!inHeading && part.size) {
                var sized = document.createElement("span");
                node.appendChild(sized);
                styled = sized;
            }
            if (!inHeading && part.size) styled.dataset.size = String(part.size);
            appendLinkified(styled, part.text || "");
        });
    }

    function renderList(list) {
        var node = document.createElement(list.ordered ? "ol" : "ul");
        (list.items || []).forEach(function (item) {
            var li = document.createElement("li");
            var text = plain(item.inlines);
            var lens = lensOf(text);
            if (lens) li.dataset.lens = lens;
            var body = el("div", "item-text");
            renderInlines(body, item.inlines);
            li.appendChild(body);
            (item.lists || []).forEach(function (child) { li.appendChild(renderList(child)); });
            node.appendChild(li);
        });
        return node;
    }

    function figureFor(title) {
        var key = keyOf(title);
        if (FIGURES[key]) return FIGURES[key];
        if (key.indexOf("a little dive") === 0) return FIGURES["a little dive"];
        return null;
    }

    function addFigure(title) {
        var figure = figureFor(title);
        if (!figure) return;
        var node = el("figure", "figure");
        var image = document.createElement("img");
        image.src = figure.src;
        image.alt = figure.alt;
        image.width = 1280;
        image.height = 720;
        var caption = document.createElement("figcaption");
        caption.textContent = figure.caption;
        node.appendChild(image);
        node.appendChild(caption);
        letter.appendChild(node);
    }

    function countWords(inlines) {
        var text = plain(inlines);
        return text ? text.split(/\s+/).length : 0;
    }

    function countList(list) {
        return (list.items || []).reduce(function (sum, item) {
            var nested = (item.lists || []).reduce(function (inner, child) {
                return inner + countList(child);
            }, 0);
            return sum + countWords(item.inlines) + nested;
        }, 0);
    }

    function addContinue(title, id) {
        var link = el("a", "continue");
        link.href = "#" + id;
        link.textContent = "Continue · " + title;
        letter.appendChild(link);
    }

    function renderDocument(doc) {
        letter.replaceChildren();
        path.replaceChildren();
        headings = [];
        footnotes = {};
        (doc.footnotes || []).forEach(function (note) { footnotes[note.id] = note; });
        var blocks = doc.blocks || [];
        var major = blocks.filter(function (block) {
            return block.type === "heading" && block.level === 1;
        });
        major.forEach(function (block, index) {
            var title = plain(block.inlines);
            var link = document.createElement("a");
            link.href = "#" + block.id;
            link.dataset.heading = block.id;
            var step = document.createElement("small");
            step.textContent = "Part " + (index + 1);
            link.appendChild(step);
            link.appendChild(document.createTextNode(title));
            path.appendChild(link);
        });

        var words = 0;
        blocks.forEach(function (block, index) {
            if (block.type === "heading") {
                var title = plain(block.inlines);
                var nextMajor = null;
                if (block.level === 1) {
                    for (var cursor = index + 1; cursor < blocks.length; cursor += 1) {
                        if (blocks[cursor].type === "heading" && blocks[cursor].level === 1) {
                            nextMajor = blocks[cursor];
                            break;
                        }
                    }
                }
                var tag = "h" + Math.min(6, block.level + 1);
                var heading = el(tag, "depth-" + block.level);
                heading.id = block.id;
                heading.tabIndex = -1;
                renderInlines(heading, block.inlines);
                letter.appendChild(heading);
                addFigure(title);
                headings.push({ id: block.id, level: block.level, title: title, node: heading });
                if (nextMajor && index > 0) {
                    /* The continue link belongs at the end of this part, added when the next part starts. */
                }
                words += countWords(block.inlines);
                return;
            }
            if (block.type === "paragraph") {
                var text = plain(block.inlines);
                var paragraph = document.createElement("p");
                if (/^(p(?:\.p)*\.s|p\^5\.s)\b/i.test(text)) paragraph.classList.add("aside");
                else if (!whollyItalic(block.inlines) && /^[“"]/.test(text) && text.length < 220) paragraph.classList.add("pull");
                var lens = lensOf(text);
                if (lens) paragraph.dataset.lens = lens;
                renderInlines(paragraph, block.inlines);
                letter.appendChild(paragraph);
                words += countWords(block.inlines);
                return;
            }
            if (block.type === "list") {
                letter.appendChild(renderList(block));
                words += countList(block);
                return;
            }
            if (block.type === "rule") letter.appendChild(document.createElement("hr"));
        });

        for (var i = 0; i < headings.length; i += 1) {
            if (headings[i].level !== 1) continue;
            var following = headings.slice(i + 1).find(function (item) { return item.level === 1; });
            if (!following) continue;
            var link = el("a", "continue");
            link.href = "#" + following.id;
            link.textContent = "Continue · " + following.title;
            following.node.parentNode.insertBefore(link, following.node);
        }

        var exported = doc.exportedAt ? new Date(doc.exportedAt) : null;
        var when = exported && !Number.isNaN(exported.getTime())
            ? exported.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Singapore" })
            : "the latest export";
        var minutes = Math.max(1, Math.round(words / 220));
        meta.textContent = minutes + " minute read · synced from the Google Doc on " + when;
        var source = document.getElementById("source-link");
        if (source && doc.sourceUrl) source.href = doc.sourceUrl;
        buildOutline(outline);
        buildOutline(outlineMobile);
        if (location.hash) {
            var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if (target) target.scrollIntoView();
        }
        markCurrent();
    }

    function buildOutline(nav) {
        nav.replaceChildren();
        headings.forEach(function (heading) {
            var link = document.createElement("a");
            link.href = "#" + heading.id;
            link.className = "depth-" + heading.level;
            link.dataset.heading = heading.id;
            link.textContent = heading.title;
            link.addEventListener("click", function () {
                if (!outlineDialog.open) return;
                outlineChoseHeading = true;
                outlineDialog.close();
                var target = document.getElementById(heading.id);
                if (target) target.focus({ preventScroll: true });
            });
            nav.appendChild(link);
        });
    }

    function markCurrent() {
        var line = window.scrollY + 120;
        var current = headings[0];
        headings.forEach(function (heading) {
            if (heading.node.offsetTop <= line) current = heading;
        });
        if (!current) return;
        document.querySelectorAll("[data-heading]").forEach(function (link) {
            var on = link.dataset.heading === current.id || (link.closest(".path") && headingIsInPart(current, link.dataset.heading));
            if (link.closest(".path")) on = link.dataset.heading === partId(current);
            link.setAttribute("aria-current", on ? "true" : "false");
        });
        var active = outline.querySelector("[aria-current='true']");
        if (!active) return;
        var box = outline.getBoundingClientRect();
        var linkBox = active.getBoundingClientRect();
        if (linkBox.top < box.top) outline.scrollTop -= box.top - linkBox.top;
        else if (linkBox.bottom > box.bottom) outline.scrollTop += linkBox.bottom - box.bottom;
    }

    function partId(heading) {
        var part = heading.id;
        headings.forEach(function (item) {
            if (item.level === 1 && item.node.offsetTop <= heading.node.offsetTop) part = item.id;
        });
        return part;
    }

    function headingIsInPart() { return false; }

    function openNote(id, opener) {
        var note = footnotes[id];
        if (!note) return;
        noteOpener = opener;
        noteTitle.textContent = "Note " + id;
        noteBody.replaceChildren();
        var paragraph = document.createElement("p");
        renderInlines(paragraph, note.inlines);
        noteBody.appendChild(paragraph);
        noteBackdrop.hidden = false;
        document.getElementById("note-close").focus();
    }

    function closeNote() {
        if (noteBackdrop.hidden) return;
        noteBackdrop.hidden = true;
        if (noteOpener) noteOpener.focus();
    }

    function clearMarks() {
        document.querySelectorAll("#letter mark").forEach(function (mark) {
            var text = document.createTextNode(mark.textContent);
            mark.replaceWith(text);
        });
        letter.normalize();
        matches = [];
        matchIndex = 0;
    }

    function search(term) {
        clearMarks();
        var query = term.trim();
        if (query.length < 2) {
            searchCount.textContent = "";
            return;
        }
        var flags = "gi";
        var safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        var pattern = new RegExp(safe, flags);
        var walker = document.createTreeWalker(letter, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                var parent = node.parentElement;
                if (!parent || parent.closest("mark, script, style")) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(function (node) {
            pattern.lastIndex = 0;
            if (!pattern.test(node.nodeValue)) return;
            pattern.lastIndex = 0;
            var fragment = document.createDocumentFragment();
            var cursor = 0;
            var found;
            var source = node.nodeValue;
            while ((found = pattern.exec(source))) {
                fragment.appendChild(document.createTextNode(source.slice(cursor, found.index)));
                var mark = document.createElement("mark");
                mark.textContent = found[0];
                fragment.appendChild(mark);
                matches.push(mark);
                cursor = found.index + found[0].length;
                if (found[0].length === 0) pattern.lastIndex += 1;
            }
            fragment.appendChild(document.createTextNode(source.slice(cursor)));
            node.parentNode.replaceChild(fragment, node);
        });
        var visible = matches.filter(function (mark) { return mark.offsetParent !== null; });
        searchCount.textContent = visible.length ? visible.length + " found" : "No matches";
        if (visible.length) showMatch(0);
    }

    function showMatch(index) {
        var visible = matches.filter(function (mark) { return mark.offsetParent !== null; });
        if (!visible.length) return;
        matchIndex = (index + visible.length) % visible.length;
        matches.forEach(function (mark) { mark.classList.remove("current"); });
        visible[matchIndex].classList.add("current");
        visible[matchIndex].scrollIntoView({ block: "center" });
        searchCount.textContent = (matchIndex + 1) + " of " + visible.length;
    }

    function setLens(name) {
        document.body.dataset.lens = name;
        document.querySelectorAll(".lens button").forEach(function (button) {
            button.setAttribute("aria-checked", button.dataset.lens === name ? "true" : "false");
        });
        try { sessionStorage.setItem("thoughts-lens", name); } catch (error) { /* private mode */ }
        if (searchInput.value.trim().length >= 2) search(searchInput.value);
    }

    document.querySelectorAll(".lens button").forEach(function (button) {
        button.addEventListener("click", function () { setLens(button.dataset.lens); });
    });
    document.querySelector(".lens").addEventListener("keydown", function (event) {
        var forward = event.key === "ArrowRight" || event.key === "ArrowDown";
        var backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
        if (!forward && !backward) return;
        var buttons = Array.prototype.slice.call(document.querySelectorAll(".lens button"));
        var current = buttons.findIndex(function (button) {
            return button.getAttribute("aria-checked") === "true";
        });
        var next = buttons[(current + (forward ? 1 : -1) + buttons.length) % buttons.length];
        event.preventDefault();
        next.focus();
        setLens(next.dataset.lens);
    });

    document.getElementById("outline-open").addEventListener("click", function () {
        outlineDialog.showModal();
    });
    document.getElementById("outline-close").addEventListener("click", function () {
        outlineDialog.close();
    });
    outlineDialog.addEventListener("close", function () {
        if (outlineChoseHeading) {
            outlineChoseHeading = false;
            return;
        }
        document.getElementById("outline-open").focus();
    });

    document.getElementById("note-close").addEventListener("click", closeNote);
    noteBackdrop.addEventListener("click", function (event) {
        if (event.target === noteBackdrop) closeNote();
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !noteBackdrop.hidden) {
            event.preventDefault();
            closeNote();
            return;
        }
        if (event.key === "/" && document.activeElement !== searchInput && noteBackdrop.hidden && !outlineDialog.open) {
            event.preventDefault();
            searchInput.focus();
        }
        if (!noteBackdrop.hidden && event.key === "Tab") {
            var items = [document.getElementById("note-close")];
            noteBody.querySelectorAll("a").forEach(function (link) { items.push(link); });
            var first = items[0];
            var last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    var searchTimer = 0;
    searchInput.addEventListener("input", function () {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(function () { search(searchInput.value); }, 160);
    });
    document.getElementById("search-next").addEventListener("click", function () { showMatch(matchIndex + 1); });
    document.getElementById("search-prev").addEventListener("click", function () { showMatch(matchIndex - 1); });

    function syncBarHeight() {
        var compact = window.matchMedia("(max-width: 860px)").matches;
        var bar = document.querySelector(compact ? ".read-bar__top" : ".read-bar");
        if (bar) document.documentElement.style.setProperty("--bar", bar.offsetHeight + "px");
    }
    syncBarHeight();
    window.addEventListener("resize", syncBarHeight);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncBarHeight);

    document.addEventListener("scroll", function () {
        var height = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = height > 0 ? Math.min(1, window.scrollY / height) : 0;
        progress.style.width = (ratio * 100) + "%";
        markCurrent();
    }, { passive: true });

    try {
        var saved = sessionStorage.getItem("thoughts-lens");
        if (saved === "coc" || saved === "fide" || saved === "both") setLens(saved);
    } catch (error) { /* keep both readings */ }

    fetch("../data/thoughts/alphaeus-thoughts.json")
        .then(function (response) {
            if (!response.ok) throw new Error("missing letter");
            return response.json();
        })
        .then(renderDocument)
        .catch(function () {
            letter.replaceChildren();
            var failure = document.createElement("p");
            failure.textContent = "This copy of the letter could not be loaded. ";
            var link = document.createElement("a");
            link.href = document.getElementById("source-link").href;
            link.textContent = "Open the Google Doc";
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            failure.appendChild(link);
            failure.appendChild(document.createTextNode("."));
            letter.appendChild(failure);
        });
})();
