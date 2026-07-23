        import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

        const PREFS_KEY = 'koboforge.prefs.v3';
        const LEGACY_PREFS_KEY = 'koboforge.prefs.v2';

        const dropzone = document.getElementById('dropzone');
        const dropzoneIdle = document.getElementById('dropzoneIdle');
        const dropzoneReady = document.getElementById('dropzoneReady');
        const dropzoneFileName = document.getElementById('dropzoneFileName');
        const dropzoneFileMeta = document.getElementById('dropzoneFileMeta');
        const fileInput = document.getElementById('fileInput');
        const pickFileBtn = document.getElementById('pickFileBtn');
        const replaceFileBtn = document.getElementById('replaceFileBtn');
        const cancelFileBtn = document.getElementById('cancelFileBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const clearBtn = document.getElementById('clearBtn');
        const showDiffBtn = document.getElementById('showDiffBtn');
        const exportEditHint = document.getElementById('exportEditHint');
        const statusEl = document.getElementById('status');
        const previewEl = document.getElementById('preview');
        const previewWrap = document.getElementById('previewWrap');
        const bodyHtmlSource = document.getElementById('bodyHtmlSource');
        const htmlToolbar = document.getElementById('htmlToolbar');
        const editToolbar = document.getElementById('editToolbar');
        const applyHtmlBtn = document.getElementById('applyHtmlBtn');
        const cancelHtmlBtn = document.getElementById('cancelHtmlBtn');
        const diffPanel = document.getElementById('diffPanel');
        const diffBody = document.getElementById('diffBody');
        const diffSummary = document.getElementById('diffSummary');
        const diffRefreshBtn = document.getElementById('diffRefreshBtn');
        const statsEl = document.getElementById('stats');
        const diagnosticsEl = document.getElementById('diagnostics');
        const pageChips = document.getElementById('pageChips');
        const pageChipsInner = document.getElementById('pageChipsInner');
        const chapterOutlineWrap = document.getElementById('chapterOutlineWrap');
        const chapterOutline = document.getElementById('chapterOutline');
        const chapterOutlineHint = document.getElementById('chapterOutlineHint');
        const editedBadge = document.getElementById('editedBadge');
        const statFormat = document.getElementById('statFormat');
        const statParagraphs = document.getElementById('statParagraphs');
        const statWords = document.getElementById('statWords');
        const statStructure = document.getElementById('statStructure');
        const statTables = document.getElementById('statTables');
        const statChapters = document.getElementById('statChapters');
        const bookTitleInput = document.getElementById('bookTitle');
        const bookAuthorInput = document.getElementById('bookAuthor');
        const bookLangInput = document.getElementById('bookLang');
        const preserveTablesEl = document.getElementById('preserveTables');
        const splitChaptersEl = document.getElementById('splitChapters');
        const progressWrap = document.getElementById('progressWrap');
        const progressBar = document.getElementById('progressBar');
        const progressPct = document.getElementById('progressPct');
        const progressLabel = document.getElementById('progressLabel');
        const modeButtons = document.querySelectorAll('.mode-btn');
        const devicePreview = document.getElementById('devicePreview');
        const deviceSelect = document.getElementById('deviceSelect');
        const deviceOrientation = document.getElementById('deviceOrientation');
        const deviceFontSize = document.getElementById('deviceFontSize');
        const deviceFontValue = document.getElementById('deviceFontValue');
        const deviceMargin = document.getElementById('deviceMargin');
        const deviceMarginValue = document.getElementById('deviceMarginValue');
        const deviceChrome = document.getElementById('deviceChrome');
        const deviceSpec = document.getElementById('deviceSpec');
        const devicePhysicalSpec = document.getElementById('devicePhysicalSpec');
        const deviceFrame = document.getElementById('deviceFrame');
        const deviceScreen = document.getElementById('deviceScreen');
        const deviceReaderHeader = document.getElementById('deviceReaderHeader');
        const deviceReaderFooter = document.getElementById('deviceReaderFooter');
        const deviceBookViewport = document.getElementById('deviceBookViewport');
        const deviceBookContent = document.getElementById('deviceBookContent');
        const devicePagePrev = document.getElementById('devicePagePrev');
        const devicePageNext = document.getElementById('devicePageNext');
        const devicePageStatus = document.getElementById('devicePageStatus');
        const deviceButtonOne = document.getElementById('deviceButtonOne');
        const deviceButtonTwo = document.getElementById('deviceButtonTwo');
        const devicePreviewTarget = document.getElementById('devicePreviewTarget');

        const imageDropzone = document.getElementById('imageDropzone');
        const imageFileInput = document.getElementById('imageFileInput');
        const imagePickBtn = document.getElementById('imagePickBtn');
        const imageFileStatus = document.getElementById('imageFileStatus');
        const imageDeviceSelect = document.getElementById('imageDeviceSelect');
        const imageOrientation = document.getElementById('imageOrientation');
        const imageFit = document.getElementById('imageFit');
        const imageTone = document.getElementById('imageTone');
        const imageFormat = document.getElementById('imageFormat');
        const imageContrast = document.getElementById('imageContrast');
        const imageContrastValue = document.getElementById('imageContrastValue');
        const imageBackground = document.getElementById('imageBackground');
        const imageOutputMeta = document.getElementById('imageOutputMeta');
        const imageDownloadBtn = document.getElementById('imageDownloadBtn');
        const imagePreviewEmpty = document.getElementById('imagePreviewEmpty');
        const imageOutputCanvas = document.getElementById('imageOutputCanvas');

        /*
         * Portrait screen pixel sizes, PPI, and body dimensions below are from
         * Rakuten Kobo's published technical specifications (linked on-page).
         * screenLeftMm is the only estimated value: Kobo does not publish bezel offsets.
         */
        const KOBO_DEVICE_PROFILES = Object.freeze({
            'clara-bw': Object.freeze({
                name: 'Kobo Clara BW',
                diagonal: 6,
                screenWidth: 1072,
                screenHeight: 1448,
                ppi: 300,
                bodyWidth: 112,
                bodyHeight: 160,
                depth: 9.2,
                isColour: false,
                hasGrip: false
            }),
            'clara-colour': Object.freeze({
                name: 'Kobo Clara Colour',
                diagonal: 6,
                screenWidth: 1072,
                screenHeight: 1448,
                ppi: 300,
                colourPpi: 150,
                bodyWidth: 112,
                bodyHeight: 160,
                depth: 9.2,
                isColour: true,
                hasGrip: false
            }),
            'libra-colour': Object.freeze({
                name: 'Kobo Libra Colour',
                diagonal: 7,
                screenWidth: 1264,
                screenHeight: 1680,
                ppi: 300,
                colourPpi: 150,
                bodyWidth: 144.6,
                bodyHeight: 161,
                depth: 8.3,
                isColour: true,
                hasGrip: true,
                screenLeftMm: 8.5
            }),
            sage: Object.freeze({
                name: 'Kobo Sage',
                diagonal: 8,
                screenWidth: 1440,
                screenHeight: 1920,
                ppi: 300,
                bodyWidth: 160.5,
                bodyHeight: 181.4,
                depth: 7.6,
                isColour: false,
                hasGrip: true,
                screenLeftMm: 8.5
            }),
            'elipsa-2e': Object.freeze({
                name: 'Kobo Elipsa 2E',
                diagonal: 10.3,
                screenWidth: 1404,
                screenHeight: 1872,
                ppi: 227,
                bodyWidth: 193,
                bodyHeight: 227,
                depth: 7.5,
                isColour: false,
                hasGrip: true,
                screenLeftMm: 8.5
            })
        });

        let currentOutput = null;
        let currentFile = null;
        let bodyEdited = false;
        let editMode = 'edit'; // view | edit | diff | html — spot-check defaults to Edit
        let commitTimer = null;
        let diffOpen = false;
        let devicePageIndex = 0;
        let devicePageCount = 1;
        let deviceLayoutTimer = null;
        let currentImage = null;
        let currentImageFile = null;
        let imageRenderFrame = null;

        // —— Preferences ——
        function loadPrefs() {
            try {
                const currentRaw = localStorage.getItem(PREFS_KEY);
                const raw = currentRaw || localStorage.getItem(LEGACY_PREFS_KEY);
                if (!raw) return;
                const p = JSON.parse(raw);
                const fromLegacy = !currentRaw;
                if (typeof p.preserveTables === 'boolean' && preserveTablesEl) preserveTablesEl.checked = p.preserveTables;
                if (typeof p.splitChapters === 'boolean' && splitChaptersEl) splitChaptersEl.checked = p.splitChapters;
                if (p.author && bookAuthorInput && !bookAuthorInput.value) bookAuthorInput.value = p.author;
                if (p.lang && bookLangInput) bookLangInput.value = p.lang;
                // v2 defaulted to Clara; reset legacy users to the new Libra Colour default.
                if (!fromLegacy && p.device && KOBO_DEVICE_PROFILES[p.device] && deviceSelect) deviceSelect.value = p.device;
                if (p.deviceOrientation && deviceOrientation) deviceOrientation.value = p.deviceOrientation;
                if (Number.isFinite(Number(p.deviceFontSize)) && deviceFontSize) deviceFontSize.value = p.deviceFontSize;
                if (Number.isFinite(Number(p.deviceMargin)) && deviceMargin) deviceMargin.value = p.deviceMargin;
                if (typeof p.deviceChrome === 'boolean' && deviceChrome) deviceChrome.checked = p.deviceChrome;
                if (!fromLegacy && p.imageDevice && KOBO_DEVICE_PROFILES[p.imageDevice] && imageDeviceSelect) imageDeviceSelect.value = p.imageDevice;
            } catch (_) { /* ignore */ }
        }

        function savePrefs() {
            try {
                localStorage.setItem(PREFS_KEY, JSON.stringify({
                    preserveTables: !!preserveTablesEl?.checked,
                    splitChapters: !!splitChaptersEl?.checked,
                    author: bookAuthorInput?.value?.trim() || '',
                    lang: bookLangInput?.value?.trim() || 'en',
                    device: deviceSelect?.value || 'libra-colour',
                    deviceOrientation: deviceOrientation?.value || 'portrait',
                    deviceFontSize: Number(deviceFontSize?.value || 3.6),
                    deviceMargin: Number(deviceMargin?.value || 8),
                    deviceChrome: !!deviceChrome?.checked,
                    imageDevice: imageDeviceSelect?.value || 'libra-colour'
                }));
            } catch (_) { /* ignore */ }
        }

        loadPrefs();

        bookAuthorInput?.addEventListener('change', savePrefs);
        bookLangInput?.addEventListener('change', savePrefs);

        preserveTablesEl?.addEventListener('change', () => {
            savePrefs();
            if (!currentFile) return;
            if (bodyEdited) {
                const ok = confirm('Re-extracting will discard your body edits. Continue?');
                if (!ok) {
                    preserveTablesEl.checked = !preserveTablesEl.checked;
                    return;
                }
            }
            processFile(currentFile);
        });

        splitChaptersEl?.addEventListener('change', () => {
            savePrefs();
            if (currentOutput) {
                syncBodyFromUi();
                refreshOutlineAndStats();
                paintPreview({ force: true });
                statusEl.textContent = currentOutput.status + (splitChaptersEl.checked
                    ? ' · Chapters split on H1 only.'
                    : ' · Single-chapter export (continuous).');
            }
        });

        // —— Preview modes ——
        modeButtons.forEach((btn) => {
            btn.addEventListener('click', () => setEditMode(btn.dataset.mode));
        });

        function setEditMode(mode) {
            if (!currentOutput && mode !== 'view' && mode !== 'edit') {
                statusEl.textContent = 'Load a document first.';
                return;
            }
            if (!currentOutput && (mode === 'edit' || mode === 'html' || mode === 'diff')) {
                statusEl.textContent = 'Load a document first.';
                return;
            }
            // Always flush UI → model before leaving a surface that can hold edits
            if (editMode === 'edit' || editMode === 'html' || editMode === 'diff') {
                syncBodyFromUi();
            }

            editMode = mode;
            modeButtons.forEach((b) => {
                const active = b.dataset.mode === mode;
                b.classList.toggle('active', active);
                b.classList.toggle('text-slate-300', active);
                b.classList.toggle('text-slate-400', !active);
            });

            previewWrap?.classList.remove('mode-view', 'mode-edit', 'mode-html', 'mode-diff');
            previewWrap?.classList.add(`mode-${mode}`);

            const isHtml = mode === 'html';
            const isEdit = mode === 'edit';
            const isDiff = mode === 'diff';
            const isView = mode === 'view';
            // Edit + Diff are both contenteditable surfaces
            const canType = isEdit || isDiff;

            previewEl.classList.toggle('hidden', isHtml || isView);
            devicePreview?.classList.toggle('hidden', !isView);
            bodyHtmlSource.classList.toggle('hidden', !isHtml);
            htmlToolbar?.classList.toggle('hidden', !isHtml);
            // Heading toolbar works in Edit and Diff
            editToolbar?.classList.toggle('hidden', !canType);
            if (isDiff) {
                diffPanel?.classList.remove('hidden');
                diffOpen = true;
            } else {
                // Keep panel only in Diff mode so the main flow stays clean
                diffPanel?.classList.add('hidden');
                diffOpen = false;
            }

            previewEl.contentEditable = canType ? 'true' : 'false';
            previewEl.classList.toggle('kf-editing', canType);
            if (isEdit) {
                previewEl.setAttribute('aria-label', 'Editable document body (Kobo-like surface)');
                previewEl.focus();
            } else if (mode === 'view') {
                previewEl.removeAttribute('aria-label');
            } else if (mode === 'diff') {
                previewEl.setAttribute('aria-label', 'Editable track-changes view — red removed, green added; type to edit');
                previewEl.focus();
            } else {
                previewEl.removeAttribute('aria-label');
            }

            if (isHtml && currentOutput) {
                bodyHtmlSource.value = prettyPrintHtml(currentOutput.bodyHtml);
            }
            if (isView) {
                devicePageIndex = 0;
                renderDevicePreview({ resetPage: true });
            } else if (!isHtml) {
                paintPreview({ force: true });
            }
            if (isDiff) renderDiffPanel();
            if (showDiffBtn) showDiffBtn.textContent = isDiff ? 'Diff open' : 'Open Diff';
            updateEditChrome();
        }

        function selectedDeviceProfile(selectEl = deviceSelect) {
            return KOBO_DEVICE_PROFILES[selectEl?.value] || KOBO_DEVICE_PROFILES['libra-colour'];
        }

        function deviceGeometry(profile, orientation = 'portrait') {
            const portraitScreenWidthMm = (profile.screenWidth / profile.ppi) * 25.4;
            const portraitScreenHeightMm = (profile.screenHeight / profile.ppi) * 25.4;
            const portraitLeftMm = Number.isFinite(profile.screenLeftMm)
                ? profile.screenLeftMm
                : (profile.bodyWidth - portraitScreenWidthMm) / 2;
            const portraitTopMm = (profile.bodyHeight - portraitScreenHeightMm) / 2;

            if (orientation === 'landscape') {
                return {
                    bodyWidthMm: profile.bodyHeight,
                    bodyHeightMm: profile.bodyWidth,
                    screenWidthMm: portraitScreenHeightMm,
                    screenHeightMm: portraitScreenWidthMm,
                    // Physical clockwise rotation of the published portrait body.
                    screenLeftMm: profile.bodyHeight - portraitTopMm - portraitScreenHeightMm,
                    screenTopMm: portraitLeftMm,
                    screenWidthPx: profile.screenHeight,
                    screenHeightPx: profile.screenWidth
                };
            }
            return {
                bodyWidthMm: profile.bodyWidth,
                bodyHeightMm: profile.bodyHeight,
                screenWidthMm: portraitScreenWidthMm,
                screenHeightMm: portraitScreenHeightMm,
                screenLeftMm: portraitLeftMm,
                screenTopMm: portraitTopMm,
                screenWidthPx: profile.screenWidth,
                screenHeightPx: profile.screenHeight
            };
        }

        function applyDeviceGeometry() {
            if (!deviceFrame || !deviceScreen) return null;
            const profile = selectedDeviceProfile();
            const orientation = deviceOrientation?.value || 'portrait';
            const geometry = deviceGeometry(profile, orientation);
            const bodyW = geometry.bodyWidthMm;
            const bodyH = geometry.bodyHeightMm;
            const cssPxPerMm = 3.2;

            deviceFrame.style.aspectRatio = `${bodyW} / ${bodyH}`;
            deviceFrame.style.setProperty('--device-css-width', `${bodyW * cssPxPerMm}px`);
            deviceFrame.style.setProperty('--device-radius', `${Math.max(8, bodyW * 0.065)}px`);
            deviceFrame.classList.toggle('has-grip', profile.hasGrip);
            deviceFrame.classList.toggle('is-colour', profile.isColour);
            deviceFrame.classList.toggle('orientation-landscape', orientation === 'landscape');

            deviceScreen.style.left = `${(geometry.screenLeftMm / bodyW) * 100}%`;
            deviceScreen.style.top = `${(geometry.screenTopMm / bodyH) * 100}%`;
            deviceScreen.style.width = `${(geometry.screenWidthMm / bodyW) * 100}%`;
            deviceScreen.style.height = `${(geometry.screenHeightMm / bodyH) * 100}%`;

            const showButtons = !!profile.hasGrip;
            [deviceButtonOne, deviceButtonTwo].forEach((button) => {
                button?.classList.toggle('hidden', !showButtons);
            });
            if (showButtons) {
                if (orientation === 'landscape') {
                    Object.assign(deviceButtonOne.style, {
                        width: '11%', height: '3.5%', left: '35%', top: 'auto', right: 'auto', bottom: '4%'
                    });
                    Object.assign(deviceButtonTwo.style, {
                        width: '11%', height: '3.5%', left: '53%', top: 'auto', right: 'auto', bottom: '4%'
                    });
                } else {
                    Object.assign(deviceButtonOne.style, {
                        width: '3.5%', height: '11%', left: 'auto', top: '35%', right: '7%', bottom: 'auto'
                    });
                    Object.assign(deviceButtonTwo.style, {
                        width: '3.5%', height: '11%', left: 'auto', top: '53%', right: '7%', bottom: 'auto'
                    });
                }
            }

            const colourBit = profile.isColour
                ? ` · ${profile.colourPpi} ppi colour`
                : ' · B&W';
            if (deviceSpec) {
                deviceSpec.textContent = `${profile.diagonal}″ · ${geometry.screenWidthPx}×${geometry.screenHeightPx} · ${profile.ppi} ppi${colourBit}`;
            }
            if (devicePhysicalSpec) {
                devicePhysicalSpec.textContent = `${bodyW.toFixed(bodyW % 1 ? 1 : 0)}×${bodyH.toFixed(bodyH % 1 ? 1 : 0)} mm body · ${orientation}`;
            }
            if (devicePreviewTarget) {
                devicePreviewTarget.textContent = profile.name;
            }
            deviceFrame.setAttribute(
                'aria-label',
                `${profile.name}, ${orientation}, ${geometry.screenWidthPx} by ${geometry.screenHeightPx} screen`
            );
            return { profile, geometry };
        }

        function updateDeviceControlLabels() {
            const fontMm = Number(deviceFontSize?.value || 3.6);
            const marginMm = Number(deviceMargin?.value || 8);
            if (deviceFontValue) deviceFontValue.textContent = `${(fontMm * 2.83465).toFixed(0)} pt`;
            if (deviceMarginValue) deviceMarginValue.textContent = `${marginMm.toFixed(0)} mm`;
        }

        function renderDevicePreview({ resetPage = false } = {}) {
            if (!devicePreview || !deviceBookContent) return;
            if (resetPage) devicePageIndex = 0;
            updateDeviceControlLabels();
            const applied = applyDeviceGeometry();
            if (!applied) return;

            const title = bookTitleInput?.value?.trim() || currentOutput?.title || 'KoboForge preview';
            const lang = bookLangInput?.value?.trim() || 'en';
            const exportBody = currentOutput
                ? prepareHtmlForEpub(canonicalizeBody(currentOutput.bodyHtml, { forExport: true }))
                : '<h1>KoboForge</h1><p>Load a document to preview its converted EPUB body on this device.</p>';
            deviceReaderHeader.textContent = title;
            deviceBookContent.lang = lang;
            deviceBookContent.innerHTML = exportBody || '<p>(Empty document)</p>';
            deviceBookContent.querySelectorAll('img').forEach((img) => {
                if (!img.complete) img.addEventListener('load', () => scheduleDevicePagination(), { once: true });
            });
            scheduleDevicePagination();
            savePrefs();
        }

        function scheduleDevicePagination() {
            clearTimeout(deviceLayoutTimer);
            deviceLayoutTimer = setTimeout(layoutDevicePages, 30);
        }

        function layoutDevicePages() {
            if (!deviceBookViewport || !deviceBookContent || !deviceScreen) return;
            if (devicePreview?.classList.contains('hidden')) return;
            const applied = applyDeviceGeometry();
            if (!applied) return;

            const screenWidth = deviceScreen.clientWidth;
            const geometry = applied.geometry;
            if (!screenWidth || !geometry.screenWidthMm) {
                scheduleDevicePagination();
                return;
            }
            const cssPxPerMm = screenWidth / geometry.screenWidthMm;
            const fontMm = Number(deviceFontSize?.value || 3.6);
            const marginMm = Number(deviceMargin?.value || 8);
            const showChrome = !!deviceChrome?.checked;
            const contentEdgeMm = showChrome ? 7 : 3.5;
            const chromeOffsetMm = 2.5;

            deviceScreen.style.setProperty('--reader-margin', `${marginMm * cssPxPerMm}px`);
            deviceScreen.style.setProperty('--reader-content-top', `${contentEdgeMm * cssPxPerMm}px`);
            deviceScreen.style.setProperty('--reader-content-bottom', `${contentEdgeMm * cssPxPerMm}px`);
            deviceScreen.style.setProperty('--reader-chrome-offset', `${chromeOffsetMm * cssPxPerMm}px`);
            deviceScreen.style.setProperty('--reader-chrome-size', `${1.9 * cssPxPerMm}px`);
            deviceReaderHeader.classList.toggle('hidden', !showChrome);
            deviceReaderFooter.classList.toggle('hidden', !showChrome);
            deviceBookContent.style.fontSize = `${fontMm * cssPxPerMm}px`;
            deviceBookContent.style.setProperty('--reader-line-height', '1.52');

            // Let the absolute insets settle before reading the content viewport.
            requestAnimationFrame(() => {
                const pageWidth = Math.max(1, Math.floor(deviceBookViewport.clientWidth));
                const pageHeight = Math.max(1, Math.floor(deviceBookViewport.clientHeight));
                deviceBookContent.style.transition = 'none';
                deviceBookContent.style.transform = 'translate3d(0,0,0)';
                deviceBookContent.style.width = `${pageWidth}px`;
                deviceBookContent.style.height = `${pageHeight}px`;
                deviceBookContent.style.columnWidth = `${pageWidth}px`;
                deviceBookContent.style.columnGap = '0px';

                requestAnimationFrame(() => {
                    const fullWidth = Math.max(pageWidth, deviceBookContent.scrollWidth);
                    devicePageCount = Math.max(1, Math.ceil((fullWidth - 0.5) / pageWidth));
                    devicePageIndex = Math.max(0, Math.min(devicePageIndex, devicePageCount - 1));
                    deviceBookContent.dataset.pageWidth = String(pageWidth);
                    deviceBookContent.style.transition = '';
                    updateDevicePage();
                });
            });
        }

        function updateDevicePage() {
            const pageWidth = Number(deviceBookContent?.dataset.pageWidth || 0);
            devicePageIndex = Math.max(0, Math.min(devicePageIndex, Math.max(0, devicePageCount - 1)));
            if (deviceBookContent && pageWidth) {
                deviceBookContent.style.transform = `translate3d(${-devicePageIndex * pageWidth}px,0,0)`;
            }
            const label = `Page ${devicePageIndex + 1} of ${devicePageCount}`;
            if (devicePageStatus) devicePageStatus.textContent = label;
            if (deviceReaderFooter) deviceReaderFooter.textContent = label;
            if (devicePagePrev) devicePagePrev.disabled = devicePageIndex <= 0;
            if (devicePageNext) devicePageNext.disabled = devicePageIndex >= devicePageCount - 1;
        }

        [deviceSelect, deviceOrientation, deviceChrome].forEach((control) => {
            control?.addEventListener('change', () => {
                savePrefs();
                if (currentOutput) {
                    statusEl.textContent = `${currentOutput.status} · Previewing on the ${selectedDeviceProfile().name}.`;
                }
                if (currentOutput && editMode !== 'view') {
                    setEditMode('view');
                    return;
                }
                renderDevicePreview({ resetPage: true });
            });
        });
        [deviceFontSize, deviceMargin].forEach((control) => {
            control?.addEventListener('input', () => {
                updateDeviceControlLabels();
                devicePageIndex = 0;
                if (currentOutput && editMode !== 'view') {
                    setEditMode('view');
                    return;
                }
                scheduleDevicePagination();
                savePrefs();
            });
        });
        devicePagePrev?.addEventListener('click', () => {
            devicePageIndex -= 1;
            updateDevicePage();
        });
        devicePageNext?.addEventListener('click', () => {
            devicePageIndex += 1;
            updateDevicePage();
        });
        devicePreview?.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
                event.preventDefault();
                devicePageIndex -= 1;
                updateDevicePage();
            } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
                event.preventDefault();
                devicePageIndex += 1;
                updateDevicePage();
            }
        });
        window.addEventListener('resize', () => {
            if (editMode === 'view') scheduleDevicePagination();
        });
        updateDeviceControlLabels();
        applyDeviceGeometry();

        function canFormatNow() {
            return (editMode === 'edit' || editMode === 'diff') && !!currentOutput && previewEl?.isContentEditable;
        }

        function afterFormat() {
            markEdited();
            updateToolbarActiveState();
            clearTimeout(commitTimer);
            commitTimer = setTimeout(() => {
                if (editMode === 'diff') refreshDiffLive();
                else syncBodyFromUi();
            }, 80);
        }

        /** Inline style: bold / italic / underline / strike / lists (Kobo-safe HTML). */
        function runFormatCommand(cmd) {
            if (!canFormatNow() || !cmd) return;
            previewEl.focus();
            try {
                document.execCommand(cmd, false, null);
            } catch (_) { /* ignore */ }
            // Prefer semantic tags browsers often emit as b/i
            if (cmd === 'bold' || cmd === 'italic') {
                normalizeInlineTags(previewEl);
            }
            afterFormat();
        }

        function normalizeInlineTags(root) {
            if (!root) return;
            root.querySelectorAll('b').forEach((el) => {
                const s = document.createElement('strong');
                s.innerHTML = el.innerHTML;
                el.replaceWith(s);
            });
            root.querySelectorAll('i').forEach((el) => {
                const e = document.createElement('em');
                e.innerHTML = el.innerHTML;
                el.replaceWith(e);
            });
        }

        /** Promote selection / current block to p|h1|h2|h3|blockquote. */
        function formatBlockTag(tag) {
            if (!canFormatNow()) return;
            const allowed = { p: true, h1: true, h2: true, h3: true, blockquote: true };
            if (!allowed[tag]) return;
            previewEl.focus();
            try {
                document.execCommand('formatBlock', false, tag === 'blockquote' ? 'blockquote' : tag);
            } catch (_) { /* ignore */ }
            // If execCommand left a div, force wrap
            const sel = window.getSelection();
            if (sel && sel.rangeCount) {
                let node = sel.anchorNode;
                if (node && node.nodeType === 3) node = node.parentElement;
                const block = node?.closest?.('p, h1, h2, h3, h4, div, li, blockquote');
                if (block && block !== previewEl && previewEl.contains(block)) {
                    if (block.tagName.toLowerCase() !== tag && block.tagName.toLowerCase() !== 'li') {
                        const next = document.createElement(tag);
                        next.innerHTML = block.innerHTML;
                        if (tag === 'p' && block.classList?.contains('preserve-structure')) {
                            next.className = 'preserve-structure';
                        }
                        block.replaceWith(next);
                        const range = document.createRange();
                        range.selectNodeContents(next);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
            }
            afterFormat();
        }

        function updateToolbarActiveState() {
            if (!editToolbar || !canFormatNow()) {
                editToolbar?.querySelectorAll('.tb-btn[data-cmd]').forEach((b) => b.classList.remove('is-active'));
                return;
            }
            const cmdMap = {
                bold: 'bold',
                italic: 'italic',
                underline: 'underline',
                strikeThrough: 'strikeThrough',
                insertUnorderedList: 'insertUnorderedList',
                insertOrderedList: 'insertOrderedList'
            };
            editToolbar.querySelectorAll('.tb-btn[data-cmd]').forEach((btn) => {
                const cmd = btn.dataset.cmd;
                if (!cmd || cmd === 'removeFormat') {
                    btn.classList.remove('is-active');
                    return;
                }
                let on = false;
                try {
                    on = document.queryCommandState(cmdMap[cmd] || cmd);
                } catch (_) { /* ignore */ }
                btn.classList.toggle('is-active', !!on);
            });
        }

        editToolbar?.querySelectorAll('.tb-btn, .block-fmt-btn').forEach((btn) => {
            btn.addEventListener('mousedown', (e) => {
                // Prevent blur losing selection before click (critical on mobile)
                e.preventDefault();
            });
            btn.addEventListener('click', () => {
                if (btn.dataset.cmd) runFormatCommand(btn.dataset.cmd);
                else if (btn.dataset.block) formatBlockTag(btn.dataset.block);
            });
        });

        document.addEventListener('selectionchange', () => {
            if (editMode === 'edit' || editMode === 'diff') updateToolbarActiveState();
        });

        previewEl.addEventListener('input', () => {
            if ((editMode !== 'edit' && editMode !== 'diff') || !currentOutput) return;
            markEdited();
            clearTimeout(commitTimer);
            // Diff: live track-changes re-paint (short debounce + caret restore)
            // Edit: sync model only
            commitTimer = setTimeout(() => {
                if (editMode === 'diff') refreshDiffLive();
                else syncBodyFromUi();
            }, 60);
        });

        previewEl.addEventListener('blur', () => {
            if (editMode === 'edit' || editMode === 'diff') {
                clearTimeout(commitTimer);
                if (editMode === 'diff') {
                    refreshDiffLive();
                } else {
                    syncBodyFromUi();
                }
            }
        });

        applyHtmlBtn?.addEventListener('click', () => {
            if (!currentOutput) return;
            const cleaned = canonicalizeBody(bodyHtmlSource.value);
            currentOutput.bodyHtml = cleaned;
            markEdited();
            refreshOutlineAndStats();
            setEditMode('edit');
            statusEl.textContent = 'HTML applied and saved to the body that Download will use.';
            if (diffOpen) renderDiffPanel();
        });

        cancelHtmlBtn?.addEventListener('click', () => setEditMode(currentOutput ? 'edit' : 'view'));

        function markEdited() {
            bodyEdited = true;
            editedBadge?.classList.remove('hidden');
            updateEditChrome();
        }

        function clearEditedFlag() {
            bodyEdited = false;
            editedBadge?.classList.add('hidden');
            updateEditChrome();
            hideDiffPanel();
        }

        function updateEditChrome() {
            const hasDoc = !!currentOutput;
            if (showDiffBtn) showDiffBtn.disabled = !hasDoc;
            if (!exportEditHint) return;
            if (!hasDoc) {
                exportEditHint.classList.add('hidden');
                exportEditHint.textContent = '';
                return;
            }
            syncBodyFromUi();
            const stats = diffStats(
                htmlToDiffLines(currentOutput.originalBodyHtml || ''),
                htmlToDiffLines(currentOutput.bodyHtml || '')
            );
            const changed = stats.added + stats.removed > 0;
            bodyEdited = changed || bodyEdited;
            if (changed) {
                editedBadge?.classList.remove('hidden');
                exportEditHint.classList.remove('hidden');
                const headBit = stats.headingChanges
                    ? ` · ${stats.headingChanges} heading change${stats.headingChanges === 1 ? '' : 's'}`
                    : '';
                exportEditHint.textContent = `Edits will be included in Download: +${stats.added} / −${stats.removed} words${headBit} vs original import.`;
            } else if (bodyEdited) {
                exportEditHint.classList.remove('hidden');
                exportEditHint.textContent = 'Body marked edited (structure/HTML). Download will use the current body.';
            } else {
                exportEditHint.classList.add('hidden');
                exportEditHint.textContent = '';
            }
        }

        /** @deprecated alias */
        function htmlToPlainLines(html) {
            return htmlToDiffLines(html);
        }

        function isHeadingDiffLine(line) {
            return /^#{1,6}\s/.test(line || '');
        }

        function parseHeadingDiffLine(line) {
            const m = /^(#{1,6})\s+(.*)$/.exec(line || '');
            if (!m) return null;
            return { level: m[1].length, text: m[2], hashes: m[1] };
        }

        /**
         * Serialize body HTML for diffing.
         * Headings become "# Title" / "## Title" so H1↔H2 promotions and new headers
         * show up even when the plain text is unchanged.
         */
        function htmlToDiffLines(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html || '';
            tmp.querySelectorAll('.kf-page-break, .kf-page-label, .kf-chapter-marker').forEach((el) => el.remove());

            const lines = [];

            function pushTextBlock(raw) {
                String(raw || '')
                    .replace(/\r\n/g, '\n')
                    .split('\n')
                    .map((s) => s.replace(/\s+/g, ' ').trim())
                    .filter(Boolean)
                    .forEach((s) => lines.push(s));
            }

            function walk(node) {
                if (!node) return;
                if (node.nodeType === 3) return;
                if (node.nodeType !== 1) return;
                const tag = node.tagName.toLowerCase();
                if (tag === 'script' || tag === 'style') return;

                if (/^h[1-6]$/.test(tag)) {
                    const level = Number(tag.charAt(1)) || 1;
                    const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
                    if (text) lines.push(`${'#'.repeat(level)} ${text}`);
                    return;
                }

                if (tag === 'p' || tag === 'li' || tag === 'blockquote') {
                    const clone = node.cloneNode(true);
                    clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
                    pushTextBlock(clone.textContent || '');
                    return;
                }

                if (tag === 'tr') {
                    const cells = Array.from(node.children)
                        .filter((c) => /^(th|td)$/i.test(c.tagName))
                        .map((c) => (c.textContent || '').replace(/\s+/g, ' ').trim())
                        .filter(Boolean);
                    if (cells.length) lines.push(cells.join(' | '));
                    return;
                }

                if (tag === 'table') {
                    Array.from(node.querySelectorAll('tr')).forEach(walk);
                    return;
                }

                Array.from(node.childNodes).forEach(walk);
            }

            Array.from(tmp.childNodes).forEach(walk);
            return lines;
        }

        /** LCS sequence diff (words or lines). */
        function sequenceDiff(aItems, bItems) {
            const n = aItems.length;
            const m = bItems.length;
            // Guard huge inputs: fall back to whole-block replace
            if (n * m > 250000) {
                const ops = [];
                aItems.forEach((t) => ops.push({ type: 'del', text: t }));
                bItems.forEach((t) => ops.push({ type: 'add', text: t }));
                return ops;
            }
            const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
            for (let i = n - 1; i >= 0; i -= 1) {
                for (let j = m - 1; j >= 0; j -= 1) {
                    if (aItems[i] === bItems[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
                    else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
                }
            }
            const ops = [];
            let i = 0;
            let j = 0;
            while (i < n && j < m) {
                if (aItems[i] === bItems[j]) {
                    ops.push({ type: 'same', text: aItems[i] });
                    i += 1;
                    j += 1;
                } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                    ops.push({ type: 'del', text: aItems[i] });
                    i += 1;
                } else {
                    ops.push({ type: 'add', text: bItems[j] });
                    j += 1;
                }
            }
            while (i < n) {
                ops.push({ type: 'del', text: aItems[i] });
                i += 1;
            }
            while (j < m) {
                ops.push({ type: 'add', text: bItems[j] });
                j += 1;
            }
            return ops;
        }

        function lineDiff(aLines, bLines) {
            return sequenceDiff(aLines, bLines);
        }

        function tokenizeWords(text) {
            // Keep words/punctuation as tokens; headings keep leading # markers as one token each
            const s = String(text || '').trim();
            if (!s) return [];
            const heading = parseHeadingDiffLine(s);
            if (heading) {
                return [`H${heading.level}:`, ...tokenizeWords(heading.text)];
            }
            return s.match(/\S+/g) || [];
        }

        /**
         * Word-level ops for a changed span. Collapses long same-runs to "…" so only
         * changed words (plus a little context) are shown — not the whole paragraph.
         */
        function wordDiffOps(aText, bText) {
            const aW = tokenizeWords(aText);
            const bW = tokenizeWords(bText);
            return sequenceDiff(aW, bW);
        }

        function compressWordOps(ops, contextWords = 2) {
            // Mark indices near changes
            const keep = new Array(ops.length).fill(false);
            ops.forEach((op, idx) => {
                if (op.type === 'same') return;
                for (let k = Math.max(0, idx - contextWords); k <= Math.min(ops.length - 1, idx + contextWords); k += 1) {
                    keep[k] = true;
                }
            });
            const out = [];
            let i = 0;
            while (i < ops.length) {
                if (keep[i]) {
                    out.push(ops[i]);
                    i += 1;
                    continue;
                }
                // skip run of non-kept same tokens → single ellipsis
                let j = i;
                while (j < ops.length && !keep[j]) j += 1;
                if (j > i) out.push({ type: 'ellipsis', text: '…' });
                i = j;
            }
            return out;
        }

        function countWordChanges(wordOps) {
            let added = 0;
            let removed = 0;
            wordOps.forEach((op) => {
                if (op.type === 'add') added += 1;
                if (op.type === 'del') removed += 1;
            });
            return { added, removed };
        }

        function isHeadingToken(tok) {
            return /^H[1-6]:$/.test(tok || '');
        }

        function countHeadingChangesFromWordOps(wordOps) {
            let changes = 0;
            for (let i = 0; i < wordOps.length; i += 1) {
                const op = wordOps[i];
                if (op.type !== 'add' && op.type !== 'del') continue;
                if (isHeadingToken(op.text)) changes += 1;
            }
            // Level change H2: → H1: on same following words: counted as 2 tokens; prefer 1
            for (let i = 0; i < wordOps.length - 1; i += 1) {
                if (wordOps[i].type === 'del' && wordOps[i + 1].type === 'add'
                    && isHeadingToken(wordOps[i].text) && isHeadingToken(wordOps[i + 1].text)) {
                    changes -= 1; // pair as one change
                }
            }
            return Math.max(0, changes);
        }

        /**
         * Align lines, then expand changed pairs into word-level diffs.
         * Returns flat list of display hunks (each hunk is word ops with context).
         */
        function buildWordLevelDiff(aLines, bLines) {
            const lineOps = lineDiff(aLines, bLines);
            const hunks = [];
            let wordAdded = 0;
            let wordRemoved = 0;
            let headingChanges = 0;
            let i = 0;

            while (i < lineOps.length) {
                const op = lineOps[i];
                if (op.type === 'same') {
                    i += 1;
                    continue;
                }

                // Collect consecutive del block then add block (classic replace region)
                const dels = [];
                const adds = [];
                while (i < lineOps.length && lineOps[i].type === 'del') {
                    dels.push(lineOps[i].text);
                    i += 1;
                }
                while (i < lineOps.length && lineOps[i].type === 'add') {
                    adds.push(lineOps[i].text);
                    i += 1;
                }

                // Pair line-by-line where possible for tighter word diffs
                const maxPair = Math.max(dels.length, adds.length);
                if (maxPair === 0) continue;

                // If both sides have content, word-diff joined sides as one span when
                // lengths differ a lot; else pair 1:1 for cleaner local hunks
                if (dels.length === adds.length) {
                    for (let k = 0; k < dels.length; k += 1) {
                        const wOps = compressWordOps(wordDiffOps(dels[k], adds[k]), 2);
                        const c = countWordChanges(wOps);
                        wordAdded += c.added;
                        wordRemoved += c.removed;
                        headingChanges += countHeadingChangesFromWordOps(wOps);
                        if (c.added + c.removed > 0) hunks.push(wOps);
                    }
                } else if (dels.length === 0) {
                    // pure insert of line(s) — still word-level tokens (all adds)
                    const wOps = compressWordOps(wordDiffOps('', adds.join(' ')), 2);
                    const c = countWordChanges(wOps);
                    wordAdded += c.added;
                    wordRemoved += c.removed;
                    headingChanges += countHeadingChangesFromWordOps(wOps);
                    if (c.added + c.removed > 0) hunks.push(wOps);
                } else if (adds.length === 0) {
                    const wOps = compressWordOps(wordDiffOps(dels.join(' '), ''), 2);
                    const c = countWordChanges(wOps);
                    wordAdded += c.added;
                    wordRemoved += c.removed;
                    headingChanges += countHeadingChangesFromWordOps(wOps);
                    if (c.added + c.removed > 0) hunks.push(wOps);
                } else {
                    // unequal multi-line replace → one word-level span
                    const wOps = compressWordOps(wordDiffOps(dels.join(' '), adds.join(' ')), 2);
                    const c = countWordChanges(wOps);
                    wordAdded += c.added;
                    wordRemoved += c.removed;
                    headingChanges += countHeadingChangesFromWordOps(wOps);
                    if (c.added + c.removed > 0) hunks.push(wOps);
                }
            }

            return { hunks, added: wordAdded, removed: wordRemoved, headingChanges };
        }

        function diffStats(aLines, bLines) {
            const result = buildWordLevelDiff(aLines, bLines);
            return {
                added: result.added,
                removed: result.removed,
                headingChanges: result.headingChanges,
                hunks: result.hunks
            };
        }

        function formatWordOpsHtml(wordOps) {
            return wordOps.map((op) => {
                if (op.type === 'ellipsis') {
                    return `<span class="diff-w-sep">${escapeHtml('…')}</span>`;
                }
                if (op.type === 'same') {
                    if (isHeadingToken(op.text)) {
                        const level = op.text.replace(/[^\d]/g, '');
                        return `<span class="diff-h-tag">H${escapeHtml(level)}</span>`;
                    }
                    return `<span class="diff-w-ctx">${escapeHtml(op.text)}</span>`;
                }
                if (op.type === 'add') {
                    if (isHeadingToken(op.text)) {
                        const level = op.text.replace(/[^\d]/g, '');
                        return `<span class="diff-w-add"><span class="diff-h-tag">H${escapeHtml(level)}</span></span>`;
                    }
                    return `<span class="diff-w-add">${escapeHtml('+' + op.text)}</span>`;
                }
                if (op.type === 'del') {
                    if (isHeadingToken(op.text)) {
                        const level = op.text.replace(/[^\d]/g, '');
                        return `<span class="diff-w-del"><span class="diff-h-tag">H${escapeHtml(level)}</span></span>`;
                    }
                    return `<span class="diff-w-del">${escapeHtml('−' + op.text)}</span>`;
                }
                return '';
            }).join(' ');
        }

        function jumpToChange(changeId) {
            if (editMode !== 'diff') setEditMode('diff');
            // Wait a tick so paint can run
            requestAnimationFrame(() => {
                const el = document.getElementById(`kf-change-${changeId}`);
                if (!el) return;
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('is-flash');
                setTimeout(() => el.classList.remove('is-flash'), 1200);
                diffBody?.querySelectorAll('.diff-hunk').forEach((btn) => {
                    btn.classList.toggle('is-active', btn.dataset.changeId === String(changeId));
                });
            });
        }

        function isNodeInTrackDel(node, root) {
            let n = node;
            if (n && n.nodeType === 3) n = n.parentElement;
            while (n && n !== root) {
                if (n.tagName === 'DEL' || n.classList?.contains('kf-tc-del')) return true;
                n = n.parentElement;
            }
            return false;
        }

        /** Caret offset in “accepted” text only (ignores red deleted regions). */
        function getAcceptedCaretOffset(root) {
            const sel = window.getSelection();
            if (!sel || !sel.rangeCount || !root) return null;
            const anchorNode = sel.anchorNode;
            const anchorOffset = sel.anchorOffset;
            if (!anchorNode || !root.contains(anchorNode)) return null;

            // If caret is inside a deleted span, treat as just after that span in accepted text
            if (isNodeInTrackDel(anchorNode, root)) {
                let count = 0;
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
                while (walker.nextNode()) {
                    const node = walker.currentNode;
                    if (isNodeInTrackDel(node, root)) continue;
                    // stop when we pass the del's position in document order
                    if (
                        anchorNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
                        || (node === anchorNode)
                    ) {
                        break;
                    }
                    count += (node.nodeValue || '').length;
                }
                return count;
            }

            let count = 0;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const node = walker.currentNode;
                if (isNodeInTrackDel(node, root)) continue;
                if (node === anchorNode) {
                    return count + Math.min(anchorOffset, (node.nodeValue || '').length);
                }
                count += (node.nodeValue || '').length;
            }
            return count;
        }

        function setAcceptedCaretOffset(root, offset) {
            if (offset == null || !root) return;
            const sel = window.getSelection();
            if (!sel) return;
            let count = 0;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) {
                const node = walker.currentNode;
                if (isNodeInTrackDel(node, root)) continue;
                const len = (node.nodeValue || '').length;
                if (count + len >= offset) {
                    const range = document.createRange();
                    const pos = Math.max(0, Math.min(offset - count, len));
                    range.setStart(node, pos);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    return;
                }
                count += len;
            }
            // Place at end of last accepted text node
            const endWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            let last = null;
            while (endWalker.nextNode()) {
                if (!isNodeInTrackDel(endWalker.currentNode, root)) last = endWalker.currentNode;
            }
            if (last) {
                const range = document.createRange();
                range.setStart(last, last.nodeValue.length);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }

        /**
         * Real-time Diff refresh: sync body ← DOM, recompute red/green markup + jump list,
         * restore caret so typing stays continuous.
         */
        function refreshDiffLive() {
            if (editMode !== 'diff' || !currentOutput || !previewEl) return;
            const caret = getAcceptedCaretOffset(previewEl);
            const scrollTop = previewEl.scrollTop;
            syncBodyFromUi();
            const tc = buildTrackChangesDocument(
                currentOutput.originalBodyHtml || '',
                currentOutput.bodyHtml || ''
            );
            previewEl.innerHTML = tc.html || '<p class="kf-tc-empty">No content.</p>';
            previewEl.contentEditable = 'true';
            previewEl.classList.add('kf-editing');
            previewEl.scrollTop = scrollTop;
            currentOutput._diffNav = tc.navItems;
            paintDiffNavList(tc);
            // Restore caret after layout
            requestAnimationFrame(() => {
                setAcceptedCaretOffset(previewEl, caret);
            });
            updateEditChrome();
        }

        function paintDiffNavList(tc) {
            if (!diffBody) return;
            if (diffSummary) {
                if (tc.added + tc.removed === 0) {
                    diffSummary.textContent = 'No word or heading differences vs the original import. You can still type in the document above.';
                } else {
                    const headBit = tc.headingChanges
                        ? ` · ${tc.headingChanges} heading change${tc.headingChanges === 1 ? '' : 's'}`
                        : '';
                    diffSummary.textContent = `+${tc.added} words · −${tc.removed} words${headBit} — live · click a row to jump`;
                }
            }
            const rows = [];
            if (!tc.navItems.length) {
                rows.push('<div class="diff-meta">No changes yet. Type in the Diff view above, or edit then return here.</div>');
            } else {
                tc.navItems.forEach((item, idx) => {
                    const label = item.summary
                        ? escapeHtml(item.summary.slice(0, 72)) + (item.summary.length > 72 ? '…' : '')
                        : `Change ${idx + 1}`;
                    rows.push(
                        `<button type="button" class="diff-hunk" data-change-id="${item.id}" title="Jump to this change">`
                        + `<span class="diff-w-ctx">#${idx + 1}</span> `
                        + formatWordOpsHtml(item.wordOps)
                        + `<div class="diff-meta" style="padding-left:0;padding-top:0.25rem">${label}</div>`
                        + `</button>`
                    );
                });
            }
            diffBody.innerHTML = rows.join('');
            diffBody.querySelectorAll('.diff-hunk[data-change-id]').forEach((btn) => {
                btn.addEventListener('click', () => jumpToChange(btn.dataset.changeId));
            });
        }

        function renderDiffPanel() {
            if (!currentOutput || !diffBody) return;
            syncBodyFromUi();
            // Rebuild track-changes doc so anchors match the jump list
            const tc = buildTrackChangesDocument(
                currentOutput.originalBodyHtml || '',
                currentOutput.bodyHtml || ''
            );
            if (editMode === 'diff') {
                previewEl.innerHTML = tc.html || '<p class="kf-tc-empty">No content.</p>';
                // Stay editable after re-paint
                previewEl.contentEditable = 'true';
                previewEl.classList.add('kf-editing');
            }
            currentOutput._diffNav = tc.navItems;
            paintDiffNavList(tc);
            if (editMode === 'diff') {
                diffPanel?.classList.remove('hidden');
                diffOpen = true;
            }
            updateEditChrome();
        }

        function hideDiffPanel() {
            if (editMode === 'diff') return; // owned by Diff mode
            diffPanel?.classList.add('hidden');
            diffOpen = false;
            if (diffBody) diffBody.innerHTML = '';
        }

        showDiffBtn?.addEventListener('click', () => {
            if (!currentOutput) return;
            if (editMode === 'diff') {
                setEditMode('edit');
            } else {
                setEditMode('diff');
                diffPanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
        diffRefreshBtn?.addEventListener('click', () => {
            if (editMode !== 'diff') setEditMode('diff');
            else {
                syncBodyFromUi();
                paintPreview({ force: true });
                renderDiffPanel();
            }
        });

        /**
         * Canonical body for storage/export:
         * - tables: class="kobo-table" only
         * - PDF page anchors kept as <div class="kf-page-break" data-page="N"></div>
         * - chapter markers stripped (preview-only)
         * - page labels converted back to page-break anchors
         */
        function canonicalizeBody(html, { forExport = false } = {}) {
            const doc = new DOMParser().parseFromString(
                `<div id="root">${html || ''}</div>`,
                'text/html'
            );
            const root = doc.getElementById('root');
            if (!root) return '';

            // Chapter chrome is never stored
            root.querySelectorAll('.kf-chapter-marker').forEach((el) => el.remove());

            // Convert visible page labels back to stable anchors (survives edit cycles)
            root.querySelectorAll('.kf-page-label').forEach((el) => {
                const page = el.getAttribute('data-page')
                    || (el.id && el.id.replace(/^kf-page-/, ''))
                    || (el.textContent || '').replace(/\D+/g, '');
                const anchor = doc.createElement('div');
                anchor.className = 'kf-page-break';
                if (page) anchor.setAttribute('data-page', page);
                el.replaceWith(anchor);
            });

            if (forExport) {
                // EPUB should not include page chrome
                root.querySelectorAll('.kf-page-break').forEach((el) => el.remove());
            } else {
                // Normalize page-break nodes
                root.querySelectorAll('.kf-page-break').forEach((el) => {
                    const page = el.getAttribute('data-page') || '';
                    el.removeAttribute('id');
                    el.className = 'kf-page-break';
                    if (page) el.setAttribute('data-page', page);
                    el.innerHTML = '';
                });
            }

            root.querySelectorAll('table').forEach((table) => {
                table.setAttribute('class', 'kobo-table');
                table.querySelectorAll('th, td').forEach((cell) => {
                    cell.removeAttribute('class');
                });
            });

            // Normalize common formatting for Kobo/XHTML
            root.querySelectorAll('b').forEach((el) => {
                const s = doc.createElement('strong');
                s.innerHTML = el.innerHTML;
                el.replaceWith(s);
            });
            root.querySelectorAll('i').forEach((el) => {
                const e = doc.createElement('em');
                e.innerHTML = el.innerHTML;
                el.replaceWith(e);
            });
            // Drop editor chrome / empty style spans browsers inject
            root.querySelectorAll('span[style]').forEach((span) => {
                const style = (span.getAttribute('style') || '').toLowerCase();
                // Promote simple style spans into semantic tags when possible
                if (/font-weight:\s*(bold|[6-9]00)/.test(style) && !span.querySelector('strong,b')) {
                    const s = doc.createElement('strong');
                    s.innerHTML = span.innerHTML;
                    span.replaceWith(s);
                    return;
                }
                if (/font-style:\s*italic/.test(style) && !span.querySelector('em,i')) {
                    const e = doc.createElement('em');
                    e.innerHTML = span.innerHTML;
                    span.replaceWith(e);
                    return;
                }
                if (/text-decoration:\s*underline/.test(style) && !span.querySelector('u')) {
                    const u = doc.createElement('u');
                    u.innerHTML = span.innerHTML;
                    span.replaceWith(u);
                    return;
                }
                // Strip leftover style attribute but keep children
                span.removeAttribute('style');
            });

            return root.innerHTML.trim();
        }

        /** Preview paint: markers + light class decoration for dark UI. */
        function decorateForPreview(bodyHtml, { chapters = [], pageCount = 0 } = {}) {
            let html = bodyHtml || '';
            // Ensure tables have class for CSS
            html = html
                .replace(/<table(?![^>]*class=)/gi, '<table class="kobo-table"')
                .replace(/<table class="kobo-table"/gi, '<table class="kobo-table"');

            // Chapter markers (preview only) — align IDs with outline list (0..n-1)
            if (chapters.length > 1 && splitChaptersEl?.checked) {
                const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
                const root = doc.getElementById('root');
                let chIdx = 0;
                if (chapters[0] && chapters[0].title === 'Front matter') {
                    const marker = doc.createElement('div');
                    marker.className = 'kf-chapter-marker';
                    marker.id = 'kf-ch-0';
                    marker.textContent = 'Chapter 1: Front matter';
                    root.insertBefore(marker, root.firstChild);
                    chIdx = 1;
                }
                for (const node of Array.from(root.childNodes)) {
                    if (node.nodeType !== 1) continue;
                    const tag = node.tagName.toLowerCase();
                    if (tag === 'h1' || tag === 'h2') {
                        if (chIdx >= chapters.length) break;
                        const marker = doc.createElement('div');
                        marker.className = 'kf-chapter-marker';
                        marker.id = `kf-ch-${chIdx}`;
                        const label = chapters[chIdx]?.title || (node.textContent || '').trim();
                        marker.textContent = `Chapter ${chIdx + 1}: ${String(label).slice(0, 60)}`;
                        root.insertBefore(marker, node);
                        chIdx += 1;
                    }
                }
                html = root.innerHTML;
            }

            // PDF page anchors → visible labels (DOM walk; attribute order safe)
            {
                const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
                const root = doc.getElementById('root');
                root.querySelectorAll('.kf-page-break').forEach((el) => {
                    const page = el.getAttribute('data-page') || '';
                    if (!page) {
                        el.remove();
                        return;
                    }
                    const label = doc.createElement('div');
                    label.className = 'kf-page-label';
                    label.id = `kf-page-${page}`;
                    label.setAttribute('data-page', page);
                    label.textContent = `PDF page ${page}`;
                    el.replaceWith(label);
                });
                html = root.innerHTML;
            }

            return html;
        }

        /**
         * Accept track-changes markup into a clean body:
         * - <del> / .kf-tc-del removed (not in final document)
         * - <ins> / .kf-tc-ins unwrapped (kept as normal text)
         * - plain text kept
         */
        function trackChangesDomToBodyHtml(rootEl) {
            const clone = rootEl.cloneNode(true);
            clone.querySelectorAll('.kf-chapter-marker, .kf-page-label').forEach((el) => el.remove());
            // Drop deleted regions entirely
            clone.querySelectorAll('del, .kf-tc-del').forEach((el) => el.remove());
            // Keep inserted text as normal content
            clone.querySelectorAll('ins, .kf-tc-ins').forEach((el) => {
                const parent = el.parentNode;
                if (!parent) return;
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
            });
            clone.querySelectorAll('[id^="kf-change-"]').forEach((el) => {
                el.removeAttribute('id');
                el.classList.remove('kf-tc-block', 'is-flash');
            });
            clone.querySelectorAll('[data-diff]').forEach((el) => el.removeAttribute('data-diff'));
            return canonicalizeBody(clone.innerHTML);
        }

        /**
         * Flush Edit / Diff (contenteditable) or HTML textarea into currentOutput.bodyHtml.
         * Download and mode switches always call this so edits cannot be left only in the DOM.
         */
        function syncBodyFromUi() {
            if (!currentOutput) return '';
            if (editMode === 'html' && bodyHtmlSource && !bodyHtmlSource.classList.contains('hidden')) {
                currentOutput.bodyHtml = canonicalizeBody(bodyHtmlSource.value);
            } else if (
                editMode === 'diff'
                && previewEl
                && !previewEl.classList.contains('hidden')
                && previewEl.isContentEditable
            ) {
                currentOutput.bodyHtml = trackChangesDomToBodyHtml(previewEl);
            } else if (
                editMode === 'edit'
                && previewEl
                && !previewEl.classList.contains('hidden')
                && previewEl.isContentEditable
            ) {
                const clone = previewEl.cloneNode(true);
                // Keep .kf-page-label → page-break anchors; strip pure chrome
                clone.querySelectorAll('.kf-chapter-marker').forEach((el) => el.remove());
                currentOutput.bodyHtml = canonicalizeBody(clone.innerHTML);
            }
            // view mode: body already lives in currentOutput from last sync
            return currentOutput.bodyHtml || '';
        }

        function paintPreview({ force = false } = {}) {
            if (!currentOutput) {
                previewEl.innerHTML = '<p class="kf-empty-hint">Load a document to edit structure, then switch to Device for a paginated Kobo preview.</p>';
                return;
            }
            // Never wipe the contenteditable surface while the user is mid-edit unless forced
            // (mode switch / import). Forced paths must sync first.
            if (
                !force
                && (editMode === 'edit' || editMode === 'diff')
                && previewEl.isContentEditable
                && bodyEdited
            ) {
                return;
            }
            if (force && (editMode === 'edit' || editMode === 'html' || editMode === 'diff')) {
                // Caller should have synced; belt-and-braces for HTML textarea
                if (editMode === 'html') syncBodyFromUi();
            }

            const title = bookTitleInput.value.trim() || currentOutput.title;

            // Diff: full document track-changes (Google Docs style)
            if (editMode === 'diff') {
                const tc = buildTrackChangesDocument(
                    currentOutput.originalBodyHtml || '',
                    currentOutput.bodyHtml || ''
                );
                previewEl.innerHTML = tc.html || '<p class="kf-tc-empty">No content.</p>';
                currentOutput._diffNav = tc.navItems;
                return;
            }

            // View: export-faithful body only (what the device sees — no page/chapter chrome)
            if (editMode === 'view') {
                renderDevicePreview();
                return;
            }
            // Edit: full body + soft markers for jumping PDF pages / chapters
            const chapters = splitChaptersEl?.checked
                ? splitBodyIntoChapters(currentOutput.bodyHtml, title)
                : [{ id: 'ch1', title, html: currentOutput.bodyHtml }];
            previewEl.innerHTML = decorateForPreview(currentOutput.bodyHtml, {
                chapters,
                pageCount: currentOutput.pageCount || 0
            });
        }

        function lineToTag(line) {
            const h = parseHeadingDiffLine(line);
            if (h) return `h${h.level}`;
            return 'p';
        }

        function plainFromDiffLine(line) {
            const h = parseHeadingDiffLine(line);
            return h ? h.text : String(line || '');
        }

        function wordOpsToTrackHtml(ops, changeId) {
            const parts = [];
            ops.forEach((op) => {
                if (op.type === 'ellipsis') return; // full doc never uses ellipsis
                if (isHeadingToken(op.text)) {
                    // Level lives on the block tag; still mark level swaps inline
                    if (op.type === 'del') {
                        parts.push(`<del class="kf-tc-del" data-diff="${changeId}"><span class="diff-h-tag">${escapeHtml(op.text.replace(':', ''))}</span></del> `);
                    } else if (op.type === 'add') {
                        parts.push(`<ins class="kf-tc-ins" data-diff="${changeId}"><span class="diff-h-tag">${escapeHtml(op.text.replace(':', ''))}</span></ins> `);
                    }
                    return;
                }
                if (op.type === 'same') {
                    parts.push(escapeHtml(op.text));
                    parts.push(' ');
                } else if (op.type === 'del') {
                    parts.push(`<del class="kf-tc-del" data-diff="${changeId}">${escapeHtml(op.text)}</del> `);
                } else if (op.type === 'add') {
                    parts.push(`<ins class="kf-tc-ins" data-diff="${changeId}">${escapeHtml(op.text)}</ins> `);
                }
            });
            return parts.join('').replace(/\s+$/, '');
        }

        function wrapBlock(tag, innerHtml, changeId, hasChange) {
            const idAttr = hasChange ? ` id="kf-change-${changeId}"` : '';
            const cls = hasChange ? ' class="kf-tc-block"' : '';
            const t = /^h[1-6]$/.test(tag) ? tag : 'p';
            return `<${t}${idAttr}${cls}>${innerHtml || '&#160;'}</${t}>`;
        }

        /**
         * Full-document track changes (like Google Docs):
         * - removed words: red strikeout
         * - added words: green highlight
         * - unchanged blocks rendered normally
         * Each change region gets id="kf-change-N" for jump-from-index.
         */
        function buildTrackChangesDocument(originalHtml, currentHtml) {
            const aLines = htmlToDiffLines(originalHtml);
            const bLines = htmlToDiffLines(currentHtml);
            const lineOps = lineDiff(aLines, bLines);
            const parts = [];
            const navItems = [];
            let changeId = 0;
            let wordAdded = 0;
            let wordRemoved = 0;
            let headingChanges = 0;
            let i = 0;

            function pushNav(id, wordOps, summary) {
                navItems.push({
                    id,
                    summary: summary || '',
                    wordOps: compressWordOps(wordOps, 2)
                });
            }

            while (i < lineOps.length) {
                const op = lineOps[i];
                if (op.type === 'same') {
                    const tag = lineToTag(op.text);
                    const text = plainFromDiffLine(op.text);
                    const h = parseHeadingDiffLine(op.text);
                    const inner = h
                        ? escapeHtml(text)
                        : escapeHtml(text);
                    parts.push(wrapBlock(tag, inner, 0, false));
                    i += 1;
                    continue;
                }

                const dels = [];
                const adds = [];
                while (i < lineOps.length && lineOps[i].type === 'del') {
                    dels.push(lineOps[i].text);
                    i += 1;
                }
                while (i < lineOps.length && lineOps[i].type === 'add') {
                    adds.push(lineOps[i].text);
                    i += 1;
                }

                if (dels.length === adds.length) {
                    for (let k = 0; k < dels.length; k += 1) {
                        const id = changeId;
                        changeId += 1;
                        const tag = lineToTag(adds[k]) || lineToTag(dels[k]);
                        const wOps = wordDiffOps(dels[k], adds[k]);
                        const c = countWordChanges(wOps);
                        wordAdded += c.added;
                        wordRemoved += c.removed;
                        headingChanges += countHeadingChangesFromWordOps(wOps);
                        const inner = wordOpsToTrackHtml(wOps, id);
                        parts.push(wrapBlock(tag, inner, id, true));
                        pushNav(id, wOps, plainFromDiffLine(adds[k]) || plainFromDiffLine(dels[k]));
                    }
                } else if (dels.length === 0) {
                    adds.forEach((line) => {
                        const id = changeId;
                        changeId += 1;
                        const tag = lineToTag(line);
                        const text = plainFromDiffLine(line);
                        const wOps = wordDiffOps('', line);
                        const c = countWordChanges(wOps);
                        wordAdded += c.added;
                        wordRemoved += c.removed;
                        headingChanges += countHeadingChangesFromWordOps(wOps);
                        parts.push(wrapBlock(
                            tag,
                            `<ins class="kf-tc-ins" data-diff="${id}">${escapeHtml(text)}</ins>`,
                            id,
                            true
                        ));
                        pushNav(id, wOps, text);
                    });
                } else if (adds.length === 0) {
                    dels.forEach((line) => {
                        const id = changeId;
                        changeId += 1;
                        const tag = lineToTag(line);
                        const text = plainFromDiffLine(line);
                        const wOps = wordDiffOps(line, '');
                        const c = countWordChanges(wOps);
                        wordAdded += c.added;
                        wordRemoved += c.removed;
                        headingChanges += countHeadingChangesFromWordOps(wOps);
                        parts.push(wrapBlock(
                            tag,
                            `<del class="kf-tc-del" data-diff="${id}">${escapeHtml(text)}</del>`,
                            id,
                            true
                        ));
                        pushNav(id, wOps, text);
                    });
                } else {
                    // Unequal multi-line replace → one continuous track-changes block
                    const id = changeId;
                    changeId += 1;
                    const left = dels.join(' ');
                    const right = adds.join(' ');
                    const wOps = wordDiffOps(left, right);
                    const c = countWordChanges(wOps);
                    wordAdded += c.added;
                    wordRemoved += c.removed;
                    headingChanges += countHeadingChangesFromWordOps(wOps);
                    const tag = lineToTag(adds[0] || dels[0]);
                    parts.push(wrapBlock(tag, wordOpsToTrackHtml(wOps, id), id, true));
                    pushNav(id, wOps, plainFromDiffLine(adds[0] || dels[0]));
                }
            }

            return {
                html: parts.join('\n') || '<p class="kf-tc-empty">No content.</p>',
                navItems,
                added: wordAdded,
                removed: wordRemoved,
                headingChanges
            };
        }

        /** @deprecated use syncBodyFromUi — kept as alias for any residual call sites */
        function commitPreviewFromDom() {
            syncBodyFromUi();
            refreshOutlineAndStats();
        }

        function bodyHtmlForExport() {
            clearTimeout(commitTimer);
            // Hard guarantee: whatever is on screen in Edit/HTML is what the EPUB gets
            syncBodyFromUi();
            refreshOutlineAndStats();
            updateEditChrome();
            return canonicalizeBody(currentOutput?.bodyHtml || '', { forExport: true });
        }

        function prettyPrintHtml(html) {
            // Lightweight pretty print for edit comfort
            return (html || '')
                .replace(/></g, '>\n<')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        }

        function setProgress(pct, label) {
            if (!progressWrap) return;
            const p = Math.max(0, Math.min(100, Math.round(pct)));
            progressWrap.classList.toggle('hidden', p <= 0 && !label);
            if (progressBar) progressBar.style.width = `${p}%`;
            if (progressPct) progressPct.textContent = `${p}%`;
            if (progressLabel && label) progressLabel.textContent = label;
            if (p >= 100) {
                setTimeout(() => progressWrap.classList.add('hidden'), 600);
            }
        }

        function countWords(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
            if (!text) return 0;
            return text.split(/\s+/).filter(Boolean).length;
        }

        function countTables(html) {
            return (html.match(/<table\b/gi) || []).length;
        }

        function countHeadings(html) {
            return (html.match(/<h[12]\b/gi) || []).length;
        }

        function formatFileSize(bytes) {
            const n = Number(bytes) || 0;
            if (n < 1024) return `${n} B`;
            if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
            return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
        }

        function setDropzoneIdle() {
            dropzone?.classList.remove('has-file');
            dropzone?.setAttribute('data-state', 'idle');
            dropzoneIdle?.classList.remove('hidden');
            dropzoneReady?.classList.add('hidden');
            if (dropzoneFileName) dropzoneFileName.textContent = '—';
            if (dropzoneFileMeta) dropzoneFileMeta.textContent = '—';
        }

        function setDropzoneReady(file) {
            if (!file) {
                setDropzoneIdle();
                return;
            }
            const ext = (file.name.split('.').pop() || '').toUpperCase() || 'FILE';
            dropzone?.classList.add('has-file');
            dropzone?.setAttribute('data-state', 'ready');
            dropzoneIdle?.classList.add('hidden');
            dropzoneReady?.classList.remove('hidden');
            if (dropzoneFileName) dropzoneFileName.textContent = file.name;
            if (dropzoneFileMeta) {
                dropzoneFileMeta.textContent = `${ext} · ${formatFileSize(file.size)} · ready in this browser`;
            }
        }

        function clearWorkspace() {
            currentFile = null;
            currentOutput = null;
            clearEditedFlag();
            editMode = 'edit';
            previewWrap?.classList.remove('mode-view', 'mode-edit', 'mode-html', 'mode-diff');
            previewWrap?.classList.add('mode-edit');
            modeButtons.forEach((b) => {
                const active = b.dataset.mode === 'edit';
                b.classList.toggle('active', active);
                b.classList.toggle('text-slate-300', active);
                b.classList.toggle('text-slate-400', !active);
            });
            downloadBtn.disabled = true;
            if (clearBtn) clearBtn.disabled = true;
            if (showDiffBtn) {
                showDiffBtn.disabled = true;
                showDiffBtn.textContent = 'Show edits';
            }
            hideDiffPanel();
            statsEl.classList.add('hidden');
            diagnosticsEl.classList.add('hidden');
            diagnosticsEl.innerHTML = '';
            pageChips.classList.add('hidden');
            pageChipsInner.innerHTML = '';
            chapterOutlineWrap.classList.add('hidden');
            chapterOutline.innerHTML = '';
            previewEl.innerHTML = '<p class="kf-empty-hint">Load a document to edit structure, then switch to Device for a paginated Kobo preview.</p>';
            previewEl.contentEditable = 'false';
            previewEl.classList.remove('kf-editing', 'hidden');
            devicePreview?.classList.add('hidden');
            devicePageIndex = 0;
            devicePageCount = 1;
            updateDevicePage();
            bodyHtmlSource.classList.add('hidden');
            htmlToolbar.classList.add('hidden');
            editToolbar?.classList.add('hidden');
            statusEl.textContent = 'Waiting for a document.';
            bookTitleInput.value = '';
            if (fileInput) fileInput.value = '';
            setProgress(0);
            setDropzoneIdle();
            if (exportEditHint) {
                exportEditHint.classList.add('hidden');
                exportEditHint.textContent = '';
            }
        }

        clearBtn?.addEventListener('click', clearWorkspace);
        cancelFileBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (bodyEdited && currentOutput) {
                const ok = confirm('Cancel will discard the loaded file and any body edits. Continue?');
                if (!ok) return;
            }
            clearWorkspace();
        });

        function waitForGlobal(name, timeoutMs = 12000) {
            if (window[name]) return Promise.resolve(window[name]);
            return new Promise((resolve, reject) => {
                const start = Date.now();
                const id = setInterval(() => {
                    if (window[name]) {
                        clearInterval(id);
                        resolve(window[name]);
                    } else if (Date.now() - start > timeoutMs) {
                        clearInterval(id);
                        reject(new Error(`${name} failed to load`));
                    }
                }, 40);
            });
        }

        function openFilePicker() {
            if (fileInput) fileInput.click();
        }

        pickFileBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openFilePicker();
        });
        replaceFileBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openFilePicker();
        });
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (file) processFile(file);
        });

        ['dragenter', 'dragover'].forEach((eventName) => {
            dropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropzone.classList.add('dropzone-active');
            });
        });

        ['dragleave', 'drop'].forEach((eventName) => {
            dropzone.addEventListener(eventName, (event) => {
                event.preventDefault();
                dropzone.classList.remove('dropzone-active');
            });
        });

        dropzone.addEventListener('drop', (event) => {
            const file = event.dataTransfer?.files?.[0];
            if (file) processFile(file);
        });

        downloadBtn.addEventListener('click', async () => {
            if (!currentOutput) return;
            try {
                const title = bookTitleInput.value.trim() || currentOutput.title;
                const author = bookAuthorInput.value.trim() || currentOutput.author || 'Unknown';
                const lang = (bookLangInput?.value || 'en').trim() || 'en';
                statusEl.textContent = 'Syncing edits into EPUB body…';
                setProgress(8, 'Syncing edits');
                // Force flush Edit/HTML → model before packaging
                const bodyHtml = bodyHtmlForExport();
                const stats = diffStats(
                    htmlToDiffLines(currentOutput.originalBodyHtml || ''),
                    htmlToDiffLines(bodyHtml)
                );
                const headBit = stats.headingChanges
                    ? `, ${stats.headingChanges} heading`
                    : '';
                statusEl.textContent = stats.added + stats.removed
                    ? `Building EPUB with your edits (+${stats.added}/−${stats.removed}${headBit})…`
                    : 'Building EPUB locally…';
                setProgress(20, 'Building EPUB');
                const split = !!(splitChaptersEl && splitChaptersEl.checked);
                const blob = await buildEpubBlob({
                    title,
                    author,
                    lang,
                    bodyHtml,
                    splitChapters: split
                });
                setProgress(90, 'Preparing download');
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const base = currentFile?.name?.replace(/\.[^.]+$/, '') || title;
                link.download = `${slugify(title || base) || 'koboforge-output'}.epub`;
                link.click();
                URL.revokeObjectURL(url);
                setProgress(100, 'Done');
                savePrefs();
                statusEl.textContent = stats.added + stats.removed
                    ? `EPUB downloaded with your edits (+${stats.added}/−${stats.removed}${headBit} vs import). Nothing left your browser.`
                    : 'EPUB ready. Nothing left your browser.';
                if (diffOpen) renderDiffPanel();
            } catch (error) {
                console.error('[KoboForge]', error);
                statusEl.textContent = error.message || 'EPUB build failed.';
                setProgress(0);
            }
        });

        async function processFile(file) {
            if (bodyEdited && currentOutput) {
                const ok = confirm('Loading a new file will discard your body edits. Continue?');
                if (!ok) {
                    if (fileInput) fileInput.value = '';
                    return;
                }
            }
            currentFile = file;
            currentOutput = null;
            clearEditedFlag();
            setDropzoneReady(file);
            downloadBtn.disabled = true;
            if (clearBtn) clearBtn.disabled = false;
            statsEl.classList.add('hidden');
            diagnosticsEl.classList.add('hidden');
            pageChips.classList.add('hidden');
            chapterOutlineWrap.classList.add('hidden');
            previewEl.innerHTML = '<p class="kf-empty-hint">Processing…</p>';
            statusEl.textContent = `Reading ${file.name} locally…`;
            if (!bookTitleInput.value.trim()) {
                bookTitleInput.value = file.name.replace(/\.[^.]+$/, '');
            }
            setProgress(5, 'Reading file');

            try {
                const ext = file.name.split('.').pop().toLowerCase();
                let output;
                if (ext === 'docx') {
                    setProgress(30, 'Parsing DOCX');
                    output = await parseDocx(file);
                } else if (ext === 'pdf') {
                    output = await parsePdf(file);
                } else if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
                    setProgress(40, 'Parsing text');
                    output = await parsePlainText(file, ext);
                } else {
                    throw new Error('Unsupported file type. Use DOCX, PDF, TXT, or Markdown.');
                }

                setProgress(90, 'Rendering preview');
                currentOutput = output;
                const canonical = canonicalizeBody(output.bodyHtml);
                // Snapshot for git-like diff; export always uses bodyHtml after sync
                currentOutput.originalBodyHtml = canonical;
                currentOutput.bodyHtml = canonical;
                clearEditedFlag();
                refreshOutlineAndStats();
                // Open the converted document on the Kobo chosen beneath the uploader.
                setEditMode('view');
                const targetName = selectedDeviceProfile().name;
                statusEl.textContent = `${output.status} · Previewing on the ${targetName}.`;
                downloadBtn.disabled = false;
                if (showDiffBtn) showDiffBtn.disabled = false;
                if (showDiffBtn) showDiffBtn.textContent = 'Show edits';
                updateEditChrome();
                setProgress(100, 'Ready');
            } catch (error) {
                console.error('[KoboForge]', error);
                statusEl.textContent = error.message || 'Failed to process file.';
                previewEl.innerHTML = '<p class="kf-empty-hint">Processing failed. Try DOCX for the cleanest result, or a simpler PDF. Scanned PDFs need OCR first.</p>';
                setProgress(0);
            }
        }

        function refreshOutlineAndStats() {
            if (!currentOutput) return;
            const html = currentOutput.bodyHtml;
            const title = bookTitleInput.value.trim() || currentOutput.title;
            const split = !!splitChaptersEl?.checked;
            const chapters = split
                ? splitBodyIntoChapters(html, title)
                : [{ id: 'ch1', title, html }];

            currentOutput.chapters = chapters;
            const tableCount = countTables(html);
            const headingCount = countHeadings(html);
            const words = countWords(html);
            const paraCount = currentOutput.paragraphCount
                || (html.match(/<p\b/gi) || []).length
                || 1;

            statFormat.textContent = currentOutput.formatLabel;
            statParagraphs.textContent = String(paraCount);
            if (statWords) statWords.textContent = String(words).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            if (statTables) statTables.textContent = String(tableCount);
            if (statChapters) statChapters.textContent = String(chapters.length);
            statStructure.textContent = currentOutput.structureNote;
            statsEl.classList.remove('hidden');

            // Outline
            chapterOutline.innerHTML = '';
            if (chapters.length) {
                chapterOutlineWrap.classList.remove('hidden');
                chapters.forEach((ch, i) => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-white/25';
                    btn.textContent = `${i + 1}. ${ch.title}`;
                    btn.addEventListener('click', () => {
                        // Chapter markers live in Edit; View is export-body only
                        if (editMode !== 'edit') setEditMode('edit');
                        let el = document.getElementById(`kf-ch-${i}`);
                        if (!el) {
                            const heads = previewEl.querySelectorAll('h1, h2');
                            // Account for front-matter chapter without a heading
                            const offset = (chapters[0]?.title === 'Front matter') ? 1 : 0;
                            if (i === 0 && chapters[0]?.title === 'Front matter') {
                                el = previewEl.firstElementChild;
                            } else {
                                el = heads[i - offset] || heads[Math.min(i, heads.length - 1)];
                            }
                        }
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                            previewEl.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        chapterOutline.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                    chapterOutline.appendChild(btn);
                });
                if (split && chapters.length === 1 && headingCount === 0) {
                    chapterOutlineHint.textContent = 'No H1/H2 — single spine item. Add headings in Edit.';
                } else if (!split) {
                    chapterOutlineHint.textContent = 'Chapter split off — one file in EPUB.';
                } else {
                    chapterOutlineHint.textContent = `${chapters.length} spine item${chapters.length === 1 ? '' : 's'}`;
                }
            } else {
                chapterOutlineWrap.classList.add('hidden');
            }

            // Page chips
            const pages = currentOutput.pageCount || 0;
            if (pages > 0) {
                pageChips.classList.remove('hidden');
                pageChipsInner.innerHTML = '';
                for (let p = 1; p <= pages; p += 1) {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = 'rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:border-[#C9A227]/40';
                    chip.textContent = String(p);
                    chip.title = `Jump to PDF page ${p}`;
                    chip.addEventListener('click', () => {
                        // Page labels only render in Edit (View is export-body only)
                        if (editMode !== 'edit') setEditMode('edit');
                        document.getElementById(`kf-page-${p}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    });
                    pageChipsInner.appendChild(chip);
                }
            } else {
                pageChips.classList.add('hidden');
            }

            renderDiagnostics({
                ...currentOutput,
                tableCount,
                headingCount,
                words,
                chapterCount: chapters.length,
                split
            });
        }

        function renderDiagnostics(out) {
            const items = [];
            const warnings = out.warnings || [];
            warnings.forEach((w) => items.push({ level: 'warn', text: w }));

            if (out.formatLabel === 'PDF' && out.headingCount === 0 && out.split) {
                items.push({
                    level: 'warn',
                    text: 'No H1 headings detected. Chapter split stays one spine item. Promote a real chapter title to Heading 1 in Edit if you want TOC entries.'
                });
            }
            if (out.split && out.chapterCount > 6) {
                items.push({
                    level: 'warn',
                    text: `${out.chapterCount} spine chapters — if Kobo stops after the first section, turn off “Split into chapters” and re-export for one continuous book.`
                });
            }
            if (out.formatLabel === 'PDF' && out.emptyPages?.length) {
                const allEmpty = out.pageCount && out.emptyPages.length === out.pageCount;
                items.push({
                    level: 'warn',
                    text: allEmpty
                        ? `No extractable text on any page — likely fully scanned. Run OCR, re-export as text PDF/DOCX, or paste text in Edit.`
                        : `No extractable text on page(s) ${out.emptyPages.join(', ')} (other pages still loaded). Those pages are likely image/scan — OCR them or paste text in Edit.`
                });
            }
            if (out.formatLabel === 'PDF' && out.tableCount > 0) {
                items.push({
                    level: 'info',
                    text: `${out.tableCount} table region(s) detected. Multi-column layouts can false-positive as tables — uncheck “Preserve tables” or edit/flatten in HTML mode.`
                });
            }
            if (out.words > 0 && out.words < 40 && (currentFile?.size || 0) > 80000) {
                items.push({
                    level: 'warn',
                    text: 'Very little text extracted from a large file — possible scanned PDF or protected content.'
                });
            }
            if (out.formatLabel === 'DOCX' && out.mammothMessages?.length) {
                out.mammothMessages.slice(0, 6).forEach((m) => {
                    items.push({ level: 'info', text: `DOCX: ${m}` });
                });
            }
            if (bodyEdited) {
                items.push({
                    level: 'ok',
                    text: 'Body has manual edits — Download syncs them into the EPUB. Use “Show edits” for a line diff vs the original import.'
                });
            }
            if (!items.length) {
                items.push({ level: 'ok', text: 'No issues flagged. Use Device to page through the selected Kobo profile, then download.' });
            }

            diagnosticsEl.innerHTML = items.map((item) => {
                const cls = item.level === 'warn' ? 'diag-warn' : item.level === 'ok' ? 'diag-ok' : 'diag-info';
                return `<div class="${cls} rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs leading-5 text-slate-300">${escapeHtml(item.text)}</div>`;
            }).join('');
            diagnosticsEl.classList.remove('hidden');
        }

        async function parseDocx(file) {
            const arrayBuffer = await file.arrayBuffer();
            const mammoth = await waitForGlobal('mammoth');
            const warnings = [];
            let skippedImages = 0;
            // Cap inline images so multi‑MB Word art does not freeze the preview or
            // produce Kobo-breaking megabyte data-URI chapters after "page 1".
            // base64 expands ~4/3; cap decoded size ~450KB so preview + Kobo stay snappy
            const MAX_INLINE_IMAGE_B64 = Math.floor(450000 * 1.37);
            const convertOpts = { arrayBuffer };
            if (mammoth.images?.imgElement) {
                convertOpts.convertImage = mammoth.images.imgElement((image) =>
                    image.read('base64').then((b64) => {
                        if (!b64 || b64.length > MAX_INLINE_IMAGE_B64) {
                            skippedImages += 1;
                            return {
                                src: '',
                                alt: image.altText || 'Image omitted (too large for e-ink EPUB)'
                            };
                        }
                        return { src: `data:${image.contentType};base64,${b64}` };
                    }).catch(() => {
                        skippedImages += 1;
                        return { src: '', alt: 'Image could not be read' };
                    })
                );
            }
            const result = await mammoth.convertToHtml(convertOpts);
            const doc = new DOMParser().parseFromString(
                stripInvalidXmlChars(result.value || ''),
                'text/html'
            );
            // Drop empty/broken img tags from oversized images so EPUB XHTML stays valid
            doc.body.querySelectorAll('img').forEach((img) => {
                const src = img.getAttribute('src') || '';
                if (!src || src === 'about:blank') {
                    const note = doc.createElement('p');
                    note.className = 'preserve-structure';
                    note.innerHTML = `<em>[${escapeHtml(img.getAttribute('alt') || 'Image omitted')}]</em>`;
                    img.replaceWith(note);
                }
            });
            const paragraphCount = doc.body.querySelectorAll('p, li, blockquote').length || 1;
            const messages = (result.messages || [])
                .map((m) => m.message || String(m))
                .filter(Boolean);
            if (!doc.body.querySelector('h1, h2, h3')) {
                warnings.push('DOCX has no headings — consider adding them in Word, or insert <h2> in HTML edit for a Kobo TOC.');
            }
            if (skippedImages > 0) {
                warnings.push(
                    `Skipped ${skippedImages} large or unreadable image(s) so the EPUB stays Kobo-friendly. Re-export images smaller in Word if you need them.`
                );
            }
            const imgCount = (doc.body.innerHTML.match(/<img\b/gi) || []).length;
            return {
                title: file.name.replace(/\.[^.]+$/, ''),
                author: '',
                bodyHtml: doc.body.innerHTML,
                paragraphCount,
                formatLabel: 'DOCX',
                structureNote: imgCount
                    ? `Native paragraphs + ${imgCount} image(s)`
                    : 'Native paragraphs preserved',
                status: 'DOCX parsed locally. Paragraph and heading structure preserved from the source document.',
                warnings,
                mammothMessages: messages,
                pageCount: 0
            };
        }

        function preserveTablesEnabled() {
            const el = document.getElementById('preserveTables');
            return !el || el.checked;
        }

        async function parsePlainText(file, ext) {
            const text = await file.text();
            const html = ext === 'txt'
                ? plainTextToStructuredHtml(text)
                : markdownLikeToHtml(text);
            const paragraphCount = (html.match(/<p/g) || []).length || 1;
            const tableCount = (html.match(/<table/gi) || []).length;
            return {
                title: file.name.replace(/\.[^.]+$/, ''),
                author: '',
                bodyHtml: html,
                paragraphCount,
                formatLabel: ext === 'txt' ? 'TXT' : 'Markdown',
                structureNote: tableCount
                    ? `${tableCount} table${tableCount === 1 ? '' : 's'} + paragraphs`
                    : 'Blank lines and indentation preserved',
                status: tableCount
                    ? `${ext.toUpperCase()} parsed locally. ${tableCount} Markdown table${tableCount === 1 ? '' : 's'} converted to HTML for Kobo.`
                    : `${ext.toUpperCase()} parsed locally with paragraph breaks and indentation preserved.`,
                warnings: [],
                pageCount: 0
            };
        }

        async function parsePdf(file) {
            const arrayBuffer = await file.arrayBuffer();
            setProgress(12, 'Opening PDF');
            // Copy into a fresh Uint8Array. PDF.js may transfer the buffer to the
            // worker; a detached ArrayBuffer after page 1 is a common multipage hang.
            const data = new Uint8Array(arrayBuffer.slice(0));
            let pdf;
            try {
                pdf = await pdfjsLib.getDocument({
                    data,
                    useSystemFonts: true,
                    isEvalSupported: false
                }).promise;
            } catch (openErr) {
                console.error('[KoboForge] PDF open failed', openErr);
                throw new Error(
                    openErr?.message
                        ? `Could not open PDF: ${openErr.message}`
                        : 'Could not open PDF. Try re-exporting or use DOCX.'
                );
            }

            const parts = [];
            let tableCount = 0;
            let headingCount = 0;
            const emptyPages = [];
            const failedPages = [];
            const total = pdf.numPages || 1;
            const warnings = [];

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
                parts.push(`<div class="kf-page-break" data-page="${pageNumber}"></div>`);
                try {
                    const page = await pdf.getPage(pageNumber);
                    const textContent = await page.getTextContent();
                    const pageBlocks = extractPdfBlocks(textContent.items || [], {
                        preserveTables: preserveTablesEnabled()
                    });

                    if (!pageBlocks.length) {
                        emptyPages.push(pageNumber);
                        parts.push('<p class="preserve-structure"><em>(No extractable text on this page — likely image/scan. OCR first or paste text in Edit.)</em></p>');
                    } else {
                        for (const block of pageBlocks) {
                            if (block.type === 'table') {
                                tableCount += 1;
                                parts.push(block.html);
                            } else if (block.type === 'heading') {
                                headingCount += 1;
                                const tag = block.level === 1 ? 'h1' : 'h2';
                                parts.push(`<${tag}>${escapeHtml(block.text)}</${tag}>`);
                            } else {
                                parts.push(`<p class="preserve-structure">${escapeHtml(block.text)}</p>`);
                            }
                        }
                    }
                } catch (pageErr) {
                    // Isolate per-page failures so page 2+ never aborts the whole convert
                    console.error(`[KoboForge] PDF page ${pageNumber}`, pageErr);
                    failedPages.push(pageNumber);
                    emptyPages.push(pageNumber);
                    parts.push(
                        `<p class="preserve-structure"><em>(Failed to extract page ${pageNumber}: ${escapeHtml(pageErr?.message || 'unknown error')})</em></p>`
                    );
                }
                setProgress(12 + (pageNumber / total) * 70, `PDF page ${pageNumber}/${total}`);
                // Yield so progress UI paints between pages (avoids "stuck on page 1")
                await new Promise((r) => setTimeout(r, 0));
            }

            try {
                pdf.destroy?.();
            } catch (_) { /* ignore */ }

            const html = parts.length
                ? parts.join('')
                : '<p class="preserve-structure">No extractable text found.</p>';

            const paragraphCount = (html.match(/<p\b/gi) || []).length || 1;
            const structureNote = tableCount
                ? `${tableCount} table${tableCount === 1 ? '' : 's'} + line/indent reconstruction`
                : 'Heuristic line + indent reconstruction';

            if (emptyPages.length === total) {
                warnings.push('Entire PDF had no extractable text — likely scanned. Run OCR before converting.');
            }
            if (failedPages.length) {
                warnings.push(
                    `PDF.js failed on page(s) ${failedPages.join(', ')} (continued with remaining pages). Try re-exporting the PDF or use DOCX.`
                );
            }

            return {
                title: file.name.replace(/\.[^.]+$/, ''),
                author: '',
                bodyHtml: html,
                paragraphCount,
                formatLabel: 'PDF',
                structureNote,
                status: tableCount
                    ? `PDF parsed locally (${total} page${total === 1 ? '' : 's'}). Detected ${tableCount} table${tableCount === 1 ? '' : 's'}; reconstructed spaces, paragraphs, indentation${headingCount ? `, and ${headingCount} heading guess(es)` : ''}.`
                    : `PDF parsed locally (${total} page${total === 1 ? '' : 's'}). Reconstructed spaces, paragraph boundaries, and indentation from page coordinates${headingCount ? `; ${headingCount} heading guess(es)` : ''}.`,
                warnings,
                emptyPages,
                pageCount: total
            };
        }

        /**
         * Normalize PDF.js text items and group into visual lines (top→bottom).
         */
        function buildPdfLines(items) {
            const normalized = (items || [])
                .filter((item) => item && item.str && String(item.str).trim() !== '')
                .map((item) => {
                    // Some PDF.js items lack transform (marked content / odd fonts).
                    // Skipping them used to throw mid-document after page 1.
                    const tr = item.transform;
                    if (!tr || tr.length < 6) return null;
                    const text = stripInvalidXmlChars(String(item.str));
                    if (!text.trim()) return null;
                    const chars = Math.max(text.length, 1);
                    const width = Number(item.width) || 0;
                    const avgCharWidth = Math.max(width / chars, 2);
                    const height = Number(item.height) || Math.abs(tr[3]) || Math.abs(tr[0]) || 10;
                    return {
                        text,
                        x: Number(tr[4]) || 0,
                        y: Number(tr[5]) || 0,
                        width,
                        height: height || 10,
                        avgCharWidth
                    };
                })
                .filter(Boolean)
                .sort((a, b) => {
                    if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
                    return a.x - b.x;
                });

            const lines = [];
            for (const item of normalized) {
                const currentLine = lines[lines.length - 1];
                if (!currentLine || Math.abs(currentLine.y - item.y) > Math.max(2.5, item.height * 0.45)) {
                    lines.push({
                        y: item.y,
                        xStart: item.x,
                        avgCharWidth: item.avgCharWidth,
                        maxHeight: item.height,
                        items: [item]
                    });
                } else {
                    currentLine.items.push(item);
                    currentLine.xStart = Math.min(currentLine.xStart, item.x);
                    currentLine.avgCharWidth = Math.min(currentLine.avgCharWidth, item.avgCharWidth);
                    currentLine.maxHeight = Math.max(currentLine.maxHeight || 0, item.height);
                }
            }

            const minX = lines.reduce((value, line) => Math.min(value, line.xStart), Number.POSITIVE_INFINITY);
            const heights = lines.map((l) => l.maxHeight || 10);
            const medianHeight = median(heights) || 10;

            return lines.map((line) => {
                const sorted = line.items.sort((a, b) => a.x - b.x);
                let text = '';
                let previousEnd = null;
                let avgSpace = line.avgCharWidth || 4;
                for (const part of sorted) {
                    if (previousEnd !== null) {
                        const gap = part.x - previousEnd;
                        if (gap > avgSpace * 0.55) {
                            text += ' '.repeat(Math.max(1, Math.min(8, Math.round(gap / avgSpace))));
                        }
                    }
                    text += part.text;
                    previousEnd = part.x + part.width;
                    avgSpace = (avgSpace + part.avgCharWidth) / 2;
                }
                const indentSpaces = Math.max(0, Math.round((line.xStart - minX) / Math.max(avgSpace, 4)));
                const lineHeight = Math.max(...sorted.map((part) => part.height || 10), 10);
                return {
                    y: line.y,
                    xStart: line.xStart,
                    rawText: `${' '.repeat(Math.min(indentSpaces, 12))}${text.trimEnd()}`,
                    plainText: text.trim(),
                    indentSpaces,
                    lineHeight,
                    maxHeight: line.maxHeight || lineHeight,
                    medianHeight,
                    avgCharWidth: avgSpace,
                    cells: sorted.map((part) => ({
                        text: part.text,
                        x: part.x,
                        width: part.width,
                        end: part.x + part.width
                    }))
                };
            });
        }

        function median(arr) {
            if (!arr.length) return 0;
            const s = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(s.length / 2);
            return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
        }

        function clusterColumnXs(xs, tolerance) {
            if (!xs.length) return [];
            const sorted = [...xs].sort((a, b) => a - b);
            const clusters = [[sorted[0]]];
            for (let i = 1; i < sorted.length; i += 1) {
                const last = clusters[clusters.length - 1];
                const center = last.reduce((s, v) => s + v, 0) / last.length;
                if (Math.abs(sorted[i] - center) <= tolerance) {
                    last.push(sorted[i]);
                } else {
                    clusters.push([sorted[i]]);
                }
            }
            return clusters.map((c) => c.reduce((s, v) => s + v, 0) / c.length);
        }

        function lineToRow(line, colCenters, colTolerance) {
            const row = colCenters.map(() => '');
            for (const cell of line.cells) {
                let bestIdx = 0;
                let bestDist = Infinity;
                for (let i = 0; i < colCenters.length; i += 1) {
                    const dist = Math.abs(cell.x - colCenters[i]);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestIdx = i;
                    }
                }
                if (bestDist > colTolerance * 2.5) continue;
                row[bestIdx] = row[bestIdx] ? `${row[bestIdx]} ${cell.text}`.trim() : cell.text.trim();
            }
            return row;
        }

        function lineLooksTabular(line) {
            // Require clear multi-column geometry. Verse numbers + prose often look
            // like 2 cells with one gap and must NOT become a <table> (Kobo truncates).
            if (!line.cells || line.cells.length < 3) return false;
            let bigGaps = 0;
            for (let i = 1; i < line.cells.length; i += 1) {
                const gap = line.cells[i].x - line.cells[i - 1].end;
                if (gap > Math.max(line.avgCharWidth * 3.5, 18)) bigGaps += 1;
            }
            return bigGaps >= 2;
        }

        /**
         * Heading heuristic (conservative): false H2s used to split the EPUB spine
         * mid-document (e.g. “Offerings at the Tabernacle's Consecration”), so Kobo
         * looked stuck after that title while the rest lived in later spine items.
         */
        function lineLooksLikeHeading(line) {
            const t = (line.plainText || '').trim();
            if (!t || t.length > 80 || t.length < 3) return false;
            if (t.endsWith('.') && t.length > 30) return false;
            if (lineLooksTabular(line)) return false;
            // Long prose / verses starting with a number are not outline headings
            if (/^\d+\s+[“"A-Za-z]/.test(t) && t.length > 45) return false;
            // Bare bible refs stay body text unless massively oversized
            if (/^(numbers|genesis|exodus|leviticus|deuteronomy|matthew|mark|luke|john)\b/i.test(t)
                && t.length < 40
                && !/^\d+\./.test(t)) {
                const r0 = (line.maxHeight || line.lineHeight) / (line.medianHeight || 10);
                if (r0 < 1.5) return false;
            }
            const ratio = (line.maxHeight || line.lineHeight) / (line.medianHeight || 10);
            const isChapter = /^(chapter|part|section|appendix)\b/i.test(t);
            // Outline only: "1. God goes with his people" — not "1 On the day when Moses"
            const isNumberedOutline = /^\d{1,2}[\.\)]\s+\S/.test(t) && t.length <= 70 && !/^\d+\s+[A-Z]/.test(t);
            const isAllCaps = t.length <= 50
                && t === t.toUpperCase()
                && /[A-Z]/.test(t)
                && t.split(/\s+/).length <= 10;
            if (isChapter || (isAllCaps && ratio >= 1.4)) return { level: 1 };
            if (isNumberedOutline) return { level: 2 };
            if (isAllCaps && ratio >= 1.22) return { level: 2 };
            // Size-only promotion needs a strong signal (avoids section subtitles)
            if (ratio >= 1.55) return { level: 2 };
            return null;
        }

        function buildTableHtml(rows, { headerRow = true } = {}) {
            if (!rows.length) return '';
            const colCount = Math.max(...rows.map((r) => r.length));
            const normalized = rows.map((r) => {
                const copy = r.slice();
                while (copy.length < colCount) copy.push('');
                return copy;
            });
            const usedCols = [];
            for (let c = 0; c < colCount; c += 1) {
                if (normalized.some((r) => (r[c] || '').trim())) usedCols.push(c);
            }
            if (usedCols.length < 2) return '';

            const slim = normalized.map((r) => usedCols.map((c) => (r[c] || '').trim()));
            const nonEmptyRows = slim.filter((r) => r.some((cell) => cell));
            if (nonEmptyRows.length < 2) return '';

            let html = '<table class="kobo-table">';
            nonEmptyRows.forEach((row, idx) => {
                const tag = headerRow && idx === 0 ? 'th' : 'td';
                html += '<tr>';
                row.forEach((cell) => {
                    html += `<${tag}>${escapeHtml(cell || ' ')}</${tag}>`;
                });
                html += '</tr>';
            });
            html += '</table>';
            return html;
        }

        function tryBuildTableFromLines(lines) {
            if (lines.length < 2) return null;
            const tabularCount = lines.filter(lineLooksTabular).length;
            if (tabularCount < 2) return null;
            if (tabularCount < Math.ceil(lines.length * 0.5)) return null;

            const allXs = [];
            let avgChar = 4;
            for (const line of lines) {
                avgChar = (avgChar + (line.avgCharWidth || 4)) / 2;
                for (const cell of line.cells) allXs.push(cell.x);
            }
            const colTolerance = Math.max(avgChar * 1.8, 8);
            const colCenters = clusterColumnXs(allXs, colTolerance);
            if (colCenters.length < 2) return null;

            const rows = lines.map((line) => lineToRow(line, colCenters, colTolerance));
            const tableHtml = buildTableHtml(rows, { headerRow: true });
            return tableHtml || null;
        }

        function extractPdfBlocks(items, { preserveTables = true } = {}) {
            const builtLines = buildPdfLines(items);
            if (!builtLines.length) return [];

            if (!preserveTables) {
                return linesToParagraphBlocks(builtLines);
            }

            const flags = builtLines.map(lineLooksTabular);
            const blocks = [];
            let proseBuf = [];
            const flushProse = () => {
                if (!proseBuf.length) return;
                linesToParagraphBlocks(proseBuf).forEach((b) => blocks.push(b));
                proseBuf = [];
            };

            let i = 0;
            while (i < builtLines.length) {
                if (!flags[i]) {
                    proseBuf.push(builtLines[i]);
                    i += 1;
                    continue;
                }

                let j = i;
                const region = [];
                while (j < builtLines.length) {
                    const line = builtLines[j];
                    if (region.length) {
                        const prev = region[region.length - 1];
                        const gap = prev.y - line.y;
                        if (gap > prev.lineHeight * 2.4) break;
                    }
                    if (flags[j]) {
                        region.push(line);
                        j += 1;
                        continue;
                    }
                    break;
                }

                if (region.length >= 2) {
                    const tableHtml = tryBuildTableFromLines(region);
                    if (tableHtml) {
                        flushProse();
                        blocks.push({ type: 'table', html: tableHtml });
                        i = j;
                        continue;
                    }
                }

                proseBuf.push(builtLines[i]);
                i += 1;
            }

            flushProse();
            return blocks;
        }

        function linesToParagraphBlocks(builtLines) {
            // Soft-hyphen join across line breaks
            const joined = [];
            for (let i = 0; i < builtLines.length; i += 1) {
                const line = { ...builtLines[i] };
                if (
                    joined.length
                    && /[A-Za-z]-$/.test(joined[joined.length - 1].plainText)
                    && /^[a-z]/.test(line.plainText)
                ) {
                    const prev = joined[joined.length - 1];
                    const mergedText = prev.plainText.replace(/-$/, '') + line.plainText;
                    prev.plainText = mergedText;
                    prev.rawText = prev.rawText.replace(/-\s*$/, '') + line.plainText;
                    prev.y = line.y;
                    continue;
                }
                joined.push(line);
            }

            const blocks = [];
            let current = [];
            let previousLine = null;

            const flushPara = () => {
                if (!current.length) return;
                const text = current.join('\n');
                // Single-line heading?
                if (current.length === 1 && previousLine) {
                    // handled when we only have one line in current — check first line meta
                }
                blocks.push({ type: 'paragraph', text });
                current = [];
            };

            for (const line of joined) {
                const heading = lineLooksLikeHeading(line);
                // Only promote isolated lines: paragraph break above (or start) and not mid-run
                const isolatedAbove = !previousLine
                    || !current.length
                    || (previousLine.y - line.y) > previousLine.lineHeight * 1.35;
                if (heading && isolatedAbove && !current.length) {
                    blocks.push({ type: 'heading', level: heading.level, text: line.plainText });
                    previousLine = line;
                    continue;
                }
                if (heading && isolatedAbove && current.length) {
                    // Flush prose, then heading
                    blocks.push({ type: 'paragraph', text: current.join('\n') });
                    current = [];
                    blocks.push({ type: 'heading', level: heading.level, text: line.plainText });
                    previousLine = line;
                    continue;
                }

                if (!previousLine) {
                    current.push(line.rawText);
                    previousLine = line;
                    continue;
                }

                const verticalGap = previousLine.y - line.y;
                const paragraphBreak =
                    verticalGap > previousLine.lineHeight * 1.45 ||
                    Math.abs(line.indentSpaces - previousLine.indentSpaces) >= 6;

                if (paragraphBreak) {
                    if (current.length) {
                        blocks.push({ type: 'paragraph', text: current.join('\n') });
                    }
                    current = [line.rawText];
                } else {
                    current.push(line.rawText);
                }
                previousLine = line;
            }

            if (current.length) {
                blocks.push({ type: 'paragraph', text: current.join('\n') });
            }

            return blocks.filter((b) => b.text || b.type === 'heading');
        }

        function plainTextToStructuredHtml(text) {
            return text
                .replace(/\r\n/g, '\n')
                .split(/\n{2,}/)
                .map((paragraph) => paragraph.trimEnd())
                .filter(Boolean)
                .map((paragraph) => `<p class="preserve-structure">${escapeHtml(paragraph)}</p>`)
                .join('');
        }

        function isMarkdownTableBlock(block) {
            const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
            if (lines.length < 2) return false;
            if (!lines.every((l) => l.includes('|'))) return false;
            const sep = lines[1].replace(/\s/g, '');
            return /^\|?[:\-]+(\|[:\-]+)+\|?$/.test(sep);
        }

        function markdownTableToHtml(block) {
            const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
            const parseRow = (line) => {
                let s = line.trim();
                if (s.startsWith('|')) s = s.slice(1);
                if (s.endsWith('|')) s = s.slice(0, -1);
                return s.split('|').map((c) => c.trim());
            };
            const header = parseRow(lines[0]);
            const body = lines.slice(2).map(parseRow);
            let html = '<table class="kobo-table"><tr>';
            header.forEach((cell) => { html += `<th>${escapeHtml(cell)}</th>`; });
            html += '</tr>';
            body.forEach((row) => {
                html += '<tr>';
                for (let i = 0; i < header.length; i += 1) {
                    html += `<td>${escapeHtml(row[i] || '')}</td>`;
                }
                html += '</tr>';
            });
            html += '</table>';
            return html;
        }

        function isListBlock(block) {
            const lines = block.trim().split('\n').filter((l) => l.trim());
            if (!lines.length) return false;
            return lines.every((l) => /^\s*([-*+]|\d+\.)\s+/.test(l));
        }

        function listBlockToHtml(block) {
            const lines = block.trim().split('\n').filter((l) => l.trim());
            const ordered = /^\s*\d+\./.test(lines[0]);
            const tag = ordered ? 'ol' : 'ul';
            const items = lines.map((l) => {
                const text = l.replace(/^\s*([-*+]|\d+\.)\s+/, '');
                return `<li>${inlineMarkdown(text)}</li>`;
            }).join('');
            return `<${tag}>${items}</${tag}>`;
        }

        function inlineMarkdown(text) {
            let s = escapeHtml(text);
            s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
            s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
            return s;
        }

        function markdownLikeToHtml(text) {
            const preserve = preserveTablesEnabled();
            const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).filter(Boolean);
            return blocks.map((block) => {
                const trimmed = block.trimEnd();
                if (preserve && isMarkdownTableBlock(trimmed)) {
                    return markdownTableToHtml(trimmed);
                }
                if (isListBlock(trimmed)) return listBlockToHtml(trimmed);
                if (trimmed.startsWith('### ')) return `<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`;
                if (trimmed.startsWith('## ')) return `<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`;
                if (trimmed.startsWith('# ')) return `<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`;
                return `<p class="preserve-structure">${inlineMarkdown(trimmed)}</p>`;
            }).join('');
        }

        /**
         * Split body HTML into chapters on H1 only (H2 stays in-flow).
         * First prose before any H1 becomes "Front matter" when other chapters exist.
         */
        function splitBodyIntoChapters(bodyHtml, bookTitle) {
            const doc = new DOMParser().parseFromString(
                `<div id="root">${bodyHtml}</div>`,
                'text/html'
            );
            const root = doc.getElementById('root');
            if (!root) {
                return [{ id: 'ch1', title: bookTitle, html: bodyHtml }];
            }

            // Flatten contenteditable wrappers: unwrap bare <div> that only hold a heading/block
            root.querySelectorAll('div').forEach((div) => {
                if (div.classList?.contains('kf-page-break') || div.classList?.contains('kf-page-label')
                    || div.classList?.contains('kf-chapter-marker')) return;
                const onlyHeading = div.children.length === 1
                    && /^(H1|H2)$/.test(div.children[0].tagName)
                    && !(div.textContent || '').replace(div.children[0].textContent || '', '').trim();
                if (onlyHeading) {
                    div.replaceWith(div.children[0]);
                }
            });

            const chapters = [];
            let buf = [];
            let title = bookTitle;
            let started = false;

            const flush = () => {
                const html = buf.join('').trim();
                if (!html && !started) return;
                chapters.push({
                    id: `ch${chapters.length + 1}`,
                    title: title || `Chapter ${chapters.length + 1}`,
                    html: html || '<p></p>'
                });
                buf = [];
            };

            const walk = (parent) => {
                for (const node of Array.from(parent.childNodes)) {
                    if (node.nodeType === 1) {
                        const tag = node.tagName.toLowerCase();
                        if (tag === 'div' && (
                            node.classList?.contains('kf-page-label')
                            || node.classList?.contains('kf-chapter-marker')
                            || node.classList?.contains('kf-page-break')
                        )) {
                            if (node.classList.contains('kf-page-break')) {
                                buf.push(node.outerHTML);
                            }
                            continue;
                        }
                        // Spine splits on H1 only — H2 section titles stay continuous
                        if (tag === 'h1') {
                            if (started || buf.length) flush();
                            title = (node.textContent || '').trim() || `Chapter ${chapters.length + 1}`;
                            started = true;
                            buf.push(node.outerHTML);
                            continue;
                        }
                        // Contenteditable often wraps blocks in div — recurse if no direct semantic
                        if (tag === 'div' && !node.classList?.contains('kobo-table')) {
                            const hasBlockChild = node.querySelector('h1, h2, h3, p, table, ul, ol');
                            if (hasBlockChild && node.children.length) {
                                walk(node);
                                continue;
                            }
                        }
                        buf.push(node.outerHTML);
                    } else if (node.nodeType === 3 && node.textContent.trim()) {
                        buf.push(`<p>${escapeHtml(node.textContent)}</p>`);
                    }
                }
            };
            walk(root);
            flush();

            if (!chapters.length) {
                return [{ id: 'ch1', title: bookTitle, html: bodyHtml || '<p></p>' }];
            }
            if (chapters[0] && chapters[0].title === bookTitle && chapters.length > 1) {
                const first = chapters[0].html.replace(/<[^>]+>/g, ' ').trim();
                if (!first) chapters.shift();
                else chapters[0].title = 'Front matter';
            }
            return chapters;
        }

        function stripInvalidXmlChars(text) {
            // XML 1.0 disallows most C0 controls; they crash Kobo/ADE after the first
            // well-formed page/chapter when they appear later in the spine.
            return String(text || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
        }

        /**
         * EPUB/Kobo-safe body prep:
         * - Drop pre-wrap (Kobo often freezes page-turn on pre-wrap blocks)
         * - Turn soft newlines into <br/> so line structure survives without pre-wrap
         * - Allow table page breaks (page-break-inside:avoid on a large false table traps page 1)
         * - Flatten empty anchors / chrome that survived export
         */
        function prepareHtmlForEpub(html) {
            const doc = new DOMParser().parseFromString(
                `<div id="root">${html || ''}</div>`,
                'text/html'
            );
            const root = doc.getElementById('root');
            if (!root) return html || '';

            root.querySelectorAll('.kf-page-break, .kf-page-label, .kf-chapter-marker').forEach((el) => el.remove());

            // convert preserve-structure paragraphs → normal flow + <br/>
            root.querySelectorAll('p.preserve-structure, pre').forEach((el) => {
                const tag = el.tagName.toLowerCase();
                if (tag === 'pre') {
                    const p = doc.createElement('p');
                    const text = el.textContent || '';
                    text.split(/\n/).forEach((line, i, arr) => {
                        p.appendChild(doc.createTextNode(line));
                        if (i < arr.length - 1) p.appendChild(doc.createElement('br'));
                    });
                    el.replaceWith(p);
                    return;
                }
                el.removeAttribute('class');
                // Walk text nodes and inject br for newlines (keep nested elements)
                const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                const textNodes = [];
                while (walker.nextNode()) textNodes.push(walker.currentNode);
                textNodes.forEach((tn) => {
                    const value = tn.nodeValue || '';
                    if (!value.includes('\n')) return;
                    const parts = value.split('\n');
                    const frag = doc.createDocumentFragment();
                    parts.forEach((part, i) => {
                        frag.appendChild(doc.createTextNode(part));
                        if (i < parts.length - 1) frag.appendChild(doc.createElement('br'));
                    });
                    tn.parentNode.replaceChild(frag, tn);
                });
            });

            // Large tables must be allowed to break across pages on Kobo
            root.querySelectorAll('table').forEach((table) => {
                table.setAttribute('class', 'kobo-table');
                table.removeAttribute('style');
            });

            // Drop empty paragraphs that only waste spine
            root.querySelectorAll('p').forEach((p) => {
                if (!(p.textContent || '').trim() && !p.querySelector('img, br, table')) {
                    p.remove();
                }
            });

            // Remove empty images
            root.querySelectorAll('img').forEach((img) => {
                const src = img.getAttribute('src') || '';
                if (!src) img.remove();
            });

            return root.innerHTML;
        }

        function xhtmlBodyFragment(html) {
            // Ensure void-ish hygiene for common tags; JSZip string body is XHTML.
            // Invalid XML mid-book is a classic "first page works, rest won't open" on Kobo.
            let out = stripInvalidXmlChars(prepareHtmlForEpub(html || ''));
            // Self-close void tags that are not already closed
            const voidTag = (tag) => {
                const re = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
                out = out.replace(re, (match, attrs) => {
                    if (/\//.test(match.slice(0, -1))) return match; // already <tag .../>
                    return `<${tag}${attrs || ''}/>`;
                });
            };
            ['br', 'hr', 'img', 'col', 'source', 'meta', 'link', 'input', 'area', 'base', 'embed', 'wbr'].forEach(voidTag);
            out = out
                .replace(/\u00a0/g, '&#160;')
                // Bare ampersands that are not already entities break XHTML parse
                .replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, '&amp;');
            // Unescaped < in rare text residues (not tags)
            // Do not touch real tags — only lone < followed by space or digit
            out = out.replace(/<(?![a-zA-Z\/!])/g, '&lt;');
            return out;
        }

        /**
         * If chapter already opens with H1/H2, keep it (no duplicate title).
         * Otherwise prepend a single H1 for the spine title.
         */
        function ensureChapterTitle(html, title) {
            const trimmed = (html || '').trim();
            if (/^<h[12][\s>]/i.test(trimmed)) return trimmed;
            // Also skip if first element (after optional whitespace/comments) is heading
            const doc = new DOMParser().parseFromString(`<div id="root">${trimmed}</div>`, 'text/html');
            const root = doc.getElementById('root');
            const first = root?.querySelector?.('h1, h2, h3, p, table, ul, ol, blockquote, div');
            if (first) {
                const tag = first.tagName.toLowerCase();
                if (tag === 'h1' || tag === 'h2') return trimmed;
            }
            return `<h1>${escapeXml(title)}</h1>${trimmed}`;
        }

        async function buildEpubBlob({ title, author, lang = 'en', bodyHtml, splitChapters = true }) {
            const JSZipCtor = await waitForGlobal('JSZip');
            const zip = new JSZipCtor();
            zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
            zip.folder('META-INF').file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

            const oebps = zip.folder('OEBPS');
            // Kobo-friendly CSS — critical pagination rules:
            // - no white-space:pre-wrap (blocks page-turn on many firmwares)
            // - no page-break-inside:avoid on full tables (traps reader on page 1)
            // - height:auto so content can reflow across pages
            oebps.file('styles.css', [
                'html,body{height:auto !important;max-height:none !important;overflow:visible !important;}',
                'body{font-family:Georgia,"Times New Roman",serif;line-height:1.55;margin:3% 4%;color:#111;-webkit-hyphens:auto;hyphens:auto;orphans:2;widows:2;}',
                /* Do NOT use page-break-after:avoid — some Kobo builds refuse to paginate past a heading */
                'h1,h2,h3{margin:1.25em 0 .55em;line-height:1.25;font-family:Georgia,serif;page-break-after:auto;page-break-inside:auto;}',
                'h1{font-size:1.45em;}h2{font-size:1.22em;}h3{font-size:1.08em;}',
                'p{margin:0 0 0.85em;text-align:justify;page-break-inside:auto;page-break-before:auto;page-break-after:auto;}',
                'strong,b{font-weight:700;}',
                'em,i{font-style:italic;}',
                'u{text-decoration:underline;}',
                's,strike,del{text-decoration:line-through;}',
                'blockquote{border-left:.25em solid #888;padding-left:1em;margin:0 0 1em;color:#333;}',
                'ul,ol{margin:0 0 1em 1.2em;padding-left:0.4em;}li{margin:0.25em 0;}',
                'table,table.kobo-table{width:100%;border-collapse:collapse;margin:1em 0;font-size:0.88em;page-break-inside:auto !important;}',
                'thead,tbody,tr,th,td{page-break-inside:auto !important;}',
                'th,td{border:1px solid #555;padding:5px 7px;text-align:left;vertical-align:top;}',
                'th{font-weight:700;background:#eee;}',
                'code{font-family:monospace;font-size:0.92em;}',
                'img{max-width:100%;height:auto;}',
                'br{line-height:1.55;}'
            ].join(''));

            // bodyHtml should already be export-clean; strip any residual chrome
            const cleanBody = canonicalizeBody(bodyHtml, { forExport: true });
            // Default path: ONE continuous spine item so Kobo page-turn works end-to-end.
            // Optional H1-only split when the user opts in.
            let chapters = splitChapters
                ? splitBodyIntoChapters(cleanBody, title)
                : [{ id: 'ch1', title, html: cleanBody }];

            // Drop empty spine items (blank chapters freeze some Kobo builds on next-page)
            chapters = chapters.filter((ch) => {
                const text = String(ch.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                return text.length > 0;
            });
            if (!chapters.length) {
                chapters = [{ id: 'ch1', title, html: cleanBody || '<p>(Empty document)</p>' }];
            }

            // Safety: too many tiny spine items ≈ stuck after first section on Kobo
            if (chapters.length > 12) {
                chapters = [{ id: 'ch1', title, html: cleanBody }];
            }

            if (!splitChapters || chapters.length === 1) {
                // Single continuous chapter: ensure one H1 book title if none
                if (!/<h1[\s>]/i.test(chapters[0].html)) {
                    chapters[0].html = `<h1>${escapeXml(title)}</h1>${chapters[0].html}`;
                }
            }

            const tocItems = chapters.map((ch, i) =>
                `<li><a href="chapter-${i + 1}.xhtml">${escapeXml(ch.title)}</a></li>`
            ).join('\n    ');

            oebps.file('nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(lang)}">
<head><title>Navigation</title><link rel="stylesheet" type="text/css" href="styles.css"/></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
    ${tocItems}
    </ol>
  </nav>
</body>
</html>`);

            const bookId = crypto.randomUUID();
            const bookUrn = `urn:uuid:${bookId}`;

            // NCX for older Kobo / Adobe-path firmware (uid must match OPF identifier)
            const ncxNavPoints = chapters.map((ch, i) => `    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
      <content src="chapter-${i + 1}.xhtml"/>
    </navPoint>`).join('\n');
            oebps.file('toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(bookUrn)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
${ncxNavPoints}
  </navMap>
</ncx>`);

            chapters.forEach((ch, i) => {
                const n = i + 1;
                // Avoid double titles when chapter already starts with H1 or H2
                const body = ensureChapterTitle(ch.html, ch.title);
                const safeBody = xhtmlBodyFragment(body);
                oebps.file(`chapter-${n}.xhtml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${escapeXml(lang)}" lang="${escapeXml(lang)}">
<head>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
${safeBody}
</body>
</html>`);
            });

            const manifestItems = chapters.map((ch, i) =>
                `    <item id="ch${i + 1}" href="chapter-${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
            ).join('\n');
            const spineItems = chapters.map((ch, i) =>
                `    <itemref idref="ch${i + 1}"/>`
            ).join('\n');

            oebps.file('content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="bookid" xmlns="http://www.idpf.org/2007/opf" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${escapeXml(bookUrn)}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>${escapeXml(lang)}</dc:language>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifestItems}
    <item id="css" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine toc="ncx">
${spineItems}
  </spine>
</package>`);

            return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
        }

        function imageTargetDimensions() {
            const profile = selectedDeviceProfile(imageDeviceSelect);
            const landscape = imageOrientation?.value === 'landscape';
            return {
                profile,
                width: landscape ? profile.screenHeight : profile.screenWidth,
                height: landscape ? profile.screenWidth : profile.screenHeight,
                orientation: landscape ? 'landscape' : 'portrait'
            };
        }

        function calculateImagePlacement(sourceWidth, sourceHeight, targetWidth, targetHeight, fit = 'contain') {
            const safeSourceWidth = Math.max(1, Number(sourceWidth) || 1);
            const safeSourceHeight = Math.max(1, Number(sourceHeight) || 1);
            const scale = fit === 'cover'
                ? Math.max(targetWidth / safeSourceWidth, targetHeight / safeSourceHeight)
                : Math.min(targetWidth / safeSourceWidth, targetHeight / safeSourceHeight);
            const width = safeSourceWidth * scale;
            const height = safeSourceHeight * scale;
            return {
                x: (targetWidth - width) / 2,
                y: (targetHeight - height) / 2,
                width,
                height
            };
        }

        function resolvedImageTone(profile) {
            const selected = imageTone?.value || 'auto';
            if (selected !== 'auto') return selected;
            return profile.isColour ? 'colour' : 'dither';
        }

        function contrastChannel(value, contrast) {
            return Math.max(0, Math.min(255, (value - 128) * contrast + 128));
        }

        function applyEinkTreatment(context, width, height, tone, contrastPercent) {
            if (tone === 'colour' && Number(contrastPercent) === 100) return;
            const imageData = context.getImageData(0, 0, width, height);
            const pixels = imageData.data;
            const contrast = Math.max(0.2, Number(contrastPercent || 100) / 100);

            if (tone === 'colour') {
                for (let i = 0; i < pixels.length; i += 4) {
                    pixels[i] = contrastChannel(pixels[i], contrast);
                    pixels[i + 1] = contrastChannel(pixels[i + 1], contrast);
                    pixels[i + 2] = contrastChannel(pixels[i + 2], contrast);
                }
                context.putImageData(imageData, 0, 0);
                return;
            }

            if (tone === 'grayscale') {
                for (let i = 0; i < pixels.length; i += 4) {
                    const luminance = contrastChannel(
                        (pixels[i] * 0.2126) + (pixels[i + 1] * 0.7152) + (pixels[i + 2] * 0.0722),
                        contrast
                    );
                    // E Ink-friendly 16-level quantization.
                    const gray = Math.round(luminance / 17) * 17;
                    pixels[i] = gray;
                    pixels[i + 1] = gray;
                    pixels[i + 2] = gray;
                }
                context.putImageData(imageData, 0, 0);
                return;
            }

            // Floyd–Steinberg error diffusion at the device's native pixel grid.
            const luminance = new Float32Array(width * height);
            for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
                luminance[p] = contrastChannel(
                    (pixels[i] * 0.2126) + (pixels[i + 1] * 0.7152) + (pixels[i + 2] * 0.0722),
                    contrast
                );
            }
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    const p = (y * width) + x;
                    const oldValue = luminance[p];
                    const newValue = oldValue < 128 ? 0 : 255;
                    const error = oldValue - newValue;
                    luminance[p] = newValue;
                    if (x + 1 < width) luminance[p + 1] += error * (7 / 16);
                    if (y + 1 < height) {
                        if (x > 0) luminance[p + width - 1] += error * (3 / 16);
                        luminance[p + width] += error * (5 / 16);
                        if (x + 1 < width) luminance[p + width + 1] += error * (1 / 16);
                    }
                }
            }
            for (let p = 0, i = 0; p < luminance.length; p += 1, i += 4) {
                const gray = luminance[p] < 128 ? 0 : 255;
                pixels[i] = gray;
                pixels[i + 1] = gray;
                pixels[i + 2] = gray;
            }
            context.putImageData(imageData, 0, 0);
        }

        function scheduleImageConversion() {
            if (imageRenderFrame) cancelAnimationFrame(imageRenderFrame);
            imageRenderFrame = requestAnimationFrame(() => {
                imageRenderFrame = null;
                renderImageConversion();
            });
        }

        function renderImageConversion() {
            const target = imageTargetDimensions();
            const contrast = Number(imageContrast?.value || 110);
            if (imageContrastValue) imageContrastValue.textContent = `${contrast}%`;
            savePrefs();

            if (!currentImage || !imageOutputCanvas) {
                if (imageOutputMeta) {
                    imageOutputMeta.textContent = `${target.profile.name}: ${target.width}×${target.height}px ${target.orientation}. Choose an image to convert.`;
                }
                return;
            }

            imageOutputCanvas.width = target.width;
            imageOutputCanvas.height = target.height;
            const context = imageOutputCanvas.getContext('2d', { willReadFrequently: true });
            if (!context) {
                imageOutputMeta.textContent = 'Canvas is unavailable in this browser.';
                return;
            }
            context.save();
            context.fillStyle = imageBackground?.value || '#f4f1e8';
            context.fillRect(0, 0, target.width, target.height);
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            const placement = calculateImagePlacement(
                currentImage.naturalWidth,
                currentImage.naturalHeight,
                target.width,
                target.height,
                imageFit?.value || 'contain'
            );
            context.drawImage(currentImage, placement.x, placement.y, placement.width, placement.height);
            context.restore();

            const tone = resolvedImageTone(target.profile);
            applyEinkTreatment(context, target.width, target.height, tone, contrast);
            imageOutputCanvas.classList.remove('hidden');
            imageOutputCanvas.classList.toggle('is-dithered', tone === 'dither');
            imagePreviewEmpty?.classList.add('hidden');
            imageDownloadBtn.disabled = false;

            const toneLabel = tone === 'dither'
                ? '1-bit dither'
                : tone === 'grayscale'
                    ? '16-level grayscale'
                    : 'colour';
            const formatLabel = imageFormat?.value === 'image/jpeg' ? 'JPEG' : 'PNG';
            const fitLabel = imageFit?.value === 'cover' ? 'cover / cropped' : 'contain / uncropped';
            imageOutputMeta.textContent = `${target.profile.name} · ${target.width}×${target.height}px · ${toneLabel} · ${fitLabel} · ${formatLabel}`;
        }

        function loadImageFile(file) {
            if (!file || !file.type.startsWith('image/')) {
                if (imageFileStatus) imageFileStatus.textContent = 'That file is not a browser-supported image.';
                return;
            }
            const url = URL.createObjectURL(file);
            const image = new Image();
            image.onload = () => {
                URL.revokeObjectURL(url);
                currentImage = image;
                currentImageFile = file;
                imageDropzone?.classList.add('has-image');
                if (imageFileStatus) {
                    imageFileStatus.textContent = `${file.name} · ${image.naturalWidth}×${image.naturalHeight}px · ${formatFileSize(file.size)}`;
                }
                scheduleImageConversion();
            };
            image.onerror = () => {
                URL.revokeObjectURL(url);
                if (imageFileStatus) imageFileStatus.textContent = 'This browser could not decode that image.';
            };
            image.src = url;
        }

        imagePickBtn?.addEventListener('click', () => imageFileInput?.click());
        imageFileInput?.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (file) loadImageFile(file);
        });
        ['dragenter', 'dragover'].forEach((eventName) => {
            imageDropzone?.addEventListener(eventName, (event) => {
                event.preventDefault();
                imageDropzone.classList.add('is-active');
            });
        });
        ['dragleave', 'drop'].forEach((eventName) => {
            imageDropzone?.addEventListener(eventName, (event) => {
                event.preventDefault();
                imageDropzone.classList.remove('is-active');
            });
        });
        imageDropzone?.addEventListener('drop', (event) => {
            const file = event.dataTransfer?.files?.[0];
            if (file) loadImageFile(file);
        });

        [imageDeviceSelect, imageOrientation, imageFit, imageTone, imageFormat, imageBackground]
            .forEach((control) => control?.addEventListener('change', scheduleImageConversion));
        imageContrast?.addEventListener('input', scheduleImageConversion);

        imageDownloadBtn?.addEventListener('click', () => {
            if (!currentImage || !imageOutputCanvas) return;
            const target = imageTargetDimensions();
            const mimeType = imageFormat?.value === 'image/jpeg' ? 'image/jpeg' : 'image/png';
            const extension = mimeType === 'image/jpeg' ? 'jpg' : 'png';
            imageOutputCanvas.toBlob((blob) => {
                if (!blob) {
                    imageOutputMeta.textContent = 'Could not encode the converted image.';
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const sourceName = currentImageFile?.name?.replace(/\.[^.]+$/, '') || 'image';
                link.href = url;
                link.download = `${slugify(sourceName) || 'image'}-${slugify(target.profile.name)}-${target.width}x${target.height}.${extension}`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 0);
                imageOutputMeta.textContent = `${target.profile.name} · ${target.width}×${target.height}px · ${formatFileSize(blob.size)} ${extension.toUpperCase()} downloaded`;
            }, mimeType, mimeType === 'image/jpeg' ? 0.9 : undefined);
        });

        renderImageConversion();

        function slugify(input) {
            return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }

        function escapeHtml(text) {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function escapeXml(text) {
            return escapeHtml(text).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
        }

        // Keep outline in sync when title changes
        bookTitleInput?.addEventListener('change', () => {
            if (currentOutput) {
                refreshOutlineAndStats();
                if (editMode === 'view') renderDevicePreview();
            }
        });
