// Rich Project Case Study Modal System
// Extracted and cleaned from monolithic index.html

const PROJECT_MODAL_DATA = {
  'seeking-biblical-truth': {
    slug: 'seeking-biblical-truth',
    title: 'Seeking Biblical Truth',
    badges: ['FAITH × CODE', 'LIVING • OPEN'],
    contextLine: '',
    introParagraph: 'This project started from a simple conviction: the habits that make engineering trustworthy also matter when Christians talk about doctrine. Define your terms, show your reasoning, and stay humble when you may be wrong.',
    sections: [
      {
        heading: 'The Question',
        content: 'How do you make serious Bible study easier to enter without oversimplifying it? And how do you do that in a world where quick opinions often crowd out careful reading?'
      },
      {
        heading: 'The Architecture',
        content: 'The core is a structured Obsidian vault: version-controlled, heavily linked, and organized around books of Scripture, doctrine, and historical Christian sources worth revisiting. Around that, I built Python tooling to parse notes, surface cross-links, and make those connections easier to explore. The web layer is where I test ways people can move through the material without getting lost.',
        techNote: 'Tech: Obsidian + Dataview, custom Python parsers, experimental Flask/React surfaces, plain-text-first on purpose.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'The biggest risk is turning living truth into a tidy system that flatters its builder. Scripture does not exist to make my diagrams feel intelligent. The other danger is subtler but real: building tools about truth can easily feed pride. Both problems require real community and regular repentance.'
    },
    currentState: {
      heading: 'Current State & Invitation',
      content: 'The vault keeps growing. The tooling works, but it is still early. I keep it public on purpose so people can explore it, critique it, or build on the parts that are useful.'
    },
    quote: {
      text: 'The one who states his case first seems right, until the other comes and examines him.',
      attribution: 'Proverbs 18:17'
    },
    visual: {
      type: 'd3-knowledge-graph',
      enabled: true
    },
    actions: {
      primary: {
        label: 'Visit repository',
        url: 'https://github.com/AlphaeusNg/Seeking-Biblical-Truth',
        icon: 'external-link'
      },
      secondary: {
        label: 'Open full-page vault browser →',
        url: 'pages/seeking-biblical-truth/'
      }
    }
  },

  'koboforge': {
    slug: 'koboforge',
    title: 'KoboForge',
    badges: ['AI TOOLING', 'LOCAL-FIRST'],
    contextLine: 'Private EPUB workflow for Kobo readers',
    introParagraph: 'KoboForge is a browser-based EPUB and image converter for Kobo readers. It keeps private files local, preserves document structure, and previews converted pages against published Kobo screen profiles.',
    sections: [
      {
        heading: 'The Problem',
        content: 'Many converters work reasonably well on clean, simple documents. Real files are usually less cooperative. Tables, scans, irregular layouts, inconsistent spacing, and formula-heavy pages are where many tools start to break down.'
      },
      {
        heading: 'The Approach',
        content: 'The public page runs fully client-side. DOCX, PDF, TXT, and Markdown go through the browser; you get diagnostics, editing, and paginated previews for Clara, Libra, Sage, and Elipsa screen profiles before EPUB export. A separate canvas workflow fits, crops, tone-maps, or dithers images to exact device pixels. PDF handling reconstructs spaces, paragraphs, tables, and heading guesses from page coordinates. EPUB ships with nav + NCX for Kobo TOC.',
        techNote: 'Tech: static HTML, JSZip, Mammoth, PDF.js, Canvas, contenteditable + HTML source edit, client-side EPUB3 packaging (nav + NCX).'
      }
    ],
    intersection: {
      content: 'Same instinct as the rest of the site: preserve meaning across format boundaries, be honest when a tool can fail, and keep private material private by default.'
    },
    challenges: {
      heading: 'Current Limitations',
      content: 'PDF extraction is still heuristic. DOCX remains the cleanest path because it carries real structure; PDFs often force you to infer intent from coordinates and spacing. That tradeoff does not go away just because the interface looks simpler.'
    },
    currentState: {
      heading: 'Current State',
      content: 'Fully client-side: import, diagnostics, preview/edit, device pagination, EPUB download, and exact-resolution image conversion — nothing leaves the browser.'
    },
    actions: {
      primary: {
        label: 'Open KoboForge page',
        url: 'https://alphaeusng.github.io/KoboForge/',
        icon: 'external-link'
      }
    }
  },

  'scene-text': {
    slug: 'scene-text',
    title: 'Scene Text Translator',
    badges: ['COMPUTER VISION + NLP', 'FINAL YEAR PROJECT'],
    contextLine: 'Nanyang Technological University',
    introParagraph: 'This NTU Final Year Project grew out of a simple frustration: good translations often arrive late, and I wanted to see whether early LLM tooling could help with text embedded in panels and natural images.',
    sections: [
      {
        heading: 'The Technical Challenge',
        content: 'Scene text is difficult in all the usual ways: bad lighting, stylized lettering, warped layouts, speech bubbles, signboards, and phrases that shift meaning with context. Off-the-shelf OCR reaches its limits quickly. The challenge was not just extracting words, but putting meaning back into the image while preserving readability.'
      },
      {
        heading: 'Architecture & Process',
        content: 'The pipeline used EasyOCR for localisation and recognition, an early GPT-4-class workflow for context-aware translation, then a rendering pass in PIL/OpenCV that removed the original text region, matched layout as closely as possible, and wrote the translated text back into the image. The full thing shipped as a Flask backend with a React SPA so users could upload an image and inspect the output right away.',
        techNote: 'Tech: PyTorch (CUDA), EasyOCR, OpenAI API, Flask, React, PIL/OpenCV. Evaluated on Manga109 and real-world photography back when CV + LLM capability was rising fast and reliability still needed hard guardrails.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'The hardest problems were edge cases: vertical text, logos that looked like language, curved surfaces, dense dialogue, and the surprisingly difficult question of what should not be translated. Early LLM tooling made those limits obvious quickly. Preserving intent and visual coherence mattered much more than pretending the pipeline was effortless.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The project is still open source and still useful as an exploration of the CV + LLM boundary. For me, it reinforced that careful data curation, translation judgment, and the final overlay step mattered more than model novelty alone.'
    },
    quote: {
      text: 'The point was never just extracting text, but preserving meaning without breaking the image.',
      attribution: 'Design constraint that shaped the project'
    },
    visual: {
      type: 'pipeline-diagram',
      enabled: true
    },
    actions: {
      primary: {
        label: 'View on GitHub',
        url: 'https://github.com/AlphaeusNg/FYP',
        icon: 'external-link'
      }
    }
  },

  'htx-threat': {
    slug: 'htx-threat',
    title: 'Threat Detection Systems',
    badges: ['APPLIED COMPUTER VISION', 'HTX CBRNE CENTRE'],
    contextLine: 'AI Developer Intern — Singapore Home Team Science & Technology Agency (2023)',
    introParagraph: "At HTX's CBRNE Centre of Expertise, I worked on production-grade computer vision systems for automated threat detection at Singapore's borders. It was real operational work, with real constraints and very little room for careless assumptions.",
    sections: [
      {
        heading: 'The Operational Reality',
        content: 'I spent time on the ground at Tuas Port, Woodlands Checkpoint, and Changi Airport collecting and staging real threat items in operational X-ray and imaging systems, then building the annotation, training, and automation pipelines that turned that data into deployable models. The sample X-ray image on the site gives a glimpse of the kind of imagery the models had to handle.'
      },
      {
        heading: 'Pipeline & Process',
        content: 'The work was end to end: on-ground data collection under security constraints, large-scale annotation and quality control, model training and evaluation, Python automation for repetitive workflows, and documentation for handoff. The public HTX write-up and LinkedIn video are the visible summary; the real work was the slower systems effort underneath.',
        techNote: 'Tech: YOLOv7, Detectron2, Python automation, real operational data from ICA checkpoints. 8.5/10 intern experience rating.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'Operational environments expose the limits of clean-dataset assumptions quickly. Lighting, artifacts, clutter, and adversarial concealment do not go away. When real security is involved, the right response is less ego and more rigor.'
    },
    currentState: {
      heading: 'Current State & Impact',
      content: "The models built during this period contributed to real deployed capability at Singapore's borders. On the site, the project sits alongside the HTX write-up, the LinkedIn video, and sample X-ray imagery so readers can see both the public-facing summary and the visual system behind it."
    },
    quote: {
      text: 'Rank is given, respect is earned.',
      attribution: 'Mentor principle at HTX CBRNE (Teo Soo Kng)'
    },
    visual: {
      type: 'pipeline-diagram',
      enabled: true
    },
    actions: {
      primary: {
        label: 'Read the HTX intern story',
        url: 'https://www.htx.gov.sg/join-us/our-stories/2023/htx-intern-stories--an-intern-s-gambit-into-the-world-of-ai',
        icon: 'external-link'
      },
      secondary: {
        label: 'Watch the LinkedIn video',
        url: 'https://www.linkedin.com/posts/alphaeus-ng_i-am-delighted-and-immensely-grateful-to-ugcPost-7087471136929705984-Di9x/'
      }
    }
  },

  'votafun': {
    slug: 'votafun',
    title: 'VotaFun',
    badges: ['MULTIPLAYER + AI', 'REAL-TIME COLLABORATION'],
    contextLine: 'NTU 3002-TEL1 Module Project',
    introParagraph: "VotaFun works best as a live demo. It is a real-time group decision-making app where the model helps surface preferences and shortlist options, while the final decision stays with the people in the room.",
    sections: [
      {
        heading: 'What The Demo Does',
        content: 'Users join a room, share what they want, watch the system cluster preferences into concrete options, and then vote together in real time. Many AI decision tools either hide the model entirely or let it dominate the process. VotaFun keeps the model visible and useful without giving it final authority.'
      },
      {
        heading: 'Architecture',
        content: 'Next.js, TypeScript, and Tailwind on the frontend; Flask and Python on the backend; Redis and Socket.IO for room state and live sync. The stack exists to keep the demo flow smooth: join a room, submit preferences, get ranked suggestions with explanations, and keep iterating without breaking the group dynamic.',
        techNote: 'Tech: Next.js, Flask, Socket.IO, Redis, OpenAI/ChatGPT, Docker Compose. ~158 commits. Live demo available.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'Getting the LLM to give useful, non-manipulative explanations is harder than getting it to rank options. Users can game the system, and there is always a temptation to introduce \"smart defaults\" that quietly steer the room. The architecture exists to keep that steering visible and optional.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The important thing is that it runs. The project is open source under the VetoFun organization, and the live deployment lets people test the interaction directly instead of reading about it in the abstract.'
    },
    quote: {
      text: 'They illuminate; they do not decide.',
      attribution: 'Core design principle of VotaFun'
    },
    visual: {
      type: 'none',
      enabled: false
    },
    actions: {
      primary: {
        label: 'Launch live demo',
        url: 'https://votafun.onrender.com/',
        icon: 'external-link'
      },
      secondary: {
        label: 'View on GitHub',
        url: 'https://github.com/VetoFun/3002-TEL1-VotaFun'
      }
    }
  },

  'aily': {
    slug: 'aily',
    title: 'AIly',
    badges: ['LOCAL-FIRST ALLY', 'PWA + NATIVE'],
    contextLine: 'Targets, usage, and self-directed blocks',
    introParagraph: 'AIly is a local-first companion for targets people choose for themselves. It turns those targets into capacity-honest plans, tracks progress on the device, and keeps accountability separate from surveillance.',
    sections: [
      {
        heading: 'The Product Question',
        content: 'Can a productivity tool help someone follow through without pretending every day has unlimited capacity? AIly starts from the user’s own targets, makes tradeoffs visible, and treats missed plans as information rather than failure.'
      },
      {
        heading: 'Architecture & Privacy',
        content: 'The same interface runs as a browser PWA, an Android package, and a Tauri-based Windows app. Storage is local-first. Installed usage sampling is consent-gated and limited to foreground process names while AIly is open; it does not collect window titles, paths, or browsing history.',
        techNote: 'Tech: Rust core, static PWA, Capacitor Android packaging, Tauri on Windows, device-local state.'
      }
    ],
    challenges: {
      heading: 'Honest Boundaries',
      content: 'The published Windows package is unsigned dogfood, and the current build does not provide OS-level hard blocks. Those limits are stated directly because accountability software becomes untrustworthy when its interface promises more control than the operating system actually grants.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The hosted PWA is the quickest demo, with a sample journey for trying the full flow. Windows and Android packages are also available for people who want an installed experience.'
    },
    actions: {
      primary: {
        label: 'Open AIly',
        url: 'https://alphaeusng.github.io/AIly/'
      },
      secondary: {
        label: 'View packages',
        url: 'https://github.com/AlphaeusNg/AIly/releases'
      }
    }
  },

  'christoday': {
    slug: 'christoday',
    title: 'ChristoDay',
    badges: ['FAITH × CODE', 'LOCAL-FIRST'],
    contextLine: 'Christ-centered weekday gospel reading',
    introParagraph: 'ChristoDay is a weekday reading plan built around a different measure of progress: not chapters completed, but Christ seen in the passage.',
    sections: [
      {
        heading: 'The Reading Rhythm',
        content: 'Each weekday maps to Matthew, Mark, Luke, Philippians, or Jude. Passages are divided into natural five-to-ten-minute segments, the schedule follows Asia/Singapore, and weekends are deliberately rest rather than overdue homework.'
      },
      {
        heading: 'The Experience',
        content: 'The app selects today’s passage, offers prompts focused on Jesus’ person and work, and supports optional live Scripture, reading streaks, and a private journal. Completion and journal entries stay on the device.',
        techNote: 'Tech: static HTML, CSS, and JavaScript; deterministic Singapore-calendar scheduling; localStorage journal and progress.'
      }
    ],
    challenges: {
      heading: 'Design Constraint',
      content: 'The plan has to encourage consistency without turning Scripture into a productivity score. Rest days, short natural segments, and private reflection are intentional safeguards against that pressure.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The live site is the complete demo: today’s weekday passage is already selected, and users can read or move through nearby days without creating an account.'
    },
    actions: {
      primary: {
        label: 'Open ChristoDay',
        url: 'https://alphaeusng.github.io/ChristoDay/'
      },
      secondary: {
        label: 'View source',
        url: 'https://github.com/AlphaeusNg/ChristoDay'
      }
    }
  },

  'cardfitsg': {
    slug: 'cardfitsg',
    title: 'CardFitSG',
    badges: ['SG PRACTICAL', 'CLIENT-SIDE'],
    contextLine: 'Fuss-free cashback card fit calculator',
    introParagraph: 'CardFitSG helps Singapore users compare straightforward cashback cards against a real spending scenario, especially when the usual miles-maximising advice is more complexity than they want.',
    sections: [
      {
        heading: 'The Decision Problem',
        content: 'A card that looks good in a headline may perform badly for a large one-off purchase, a modest monthly spend, an existing bank relationship, or a merchant that does not accept Amex. CardFitSG makes those assumptions explicit before ranking the options.'
      },
      {
        heading: 'Scoring & Transparency',
        content: 'Users enter one-off and recurring spend, choose a time horizon, mark cards they already hold, and review estimated cashback with a practical next-step plan. Shareable URLs preserve the scenario, while the last local scenario restores without an account or server.',
        techNote: 'Tech: static HTML, CSS, and JavaScript; dated card catalog; deterministic client-side scoring and share-state encoding.'
      }
    ],
    challenges: {
      heading: 'Freshness Matters',
      content: 'Issuer rates, exclusions, and acquisition offers change. The catalog is dated, official terms are linked beside recommendations, and the tool is explicit that its estimates are not financial advice.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The calculator is live and fully client-side. It is maintained as a practical shortlist, with dated catalog reviews rather than evergreen claims.'
    },
    actions: {
      primary: {
        label: 'Open CardFitSG',
        url: 'https://alphaeusng.github.io/CardFitSG/'
      },
      secondary: {
        label: 'View source',
        url: 'https://github.com/AlphaeusNg/CardFitSG'
      }
    }
  },

  'versekeep': {
    slug: 'versekeep',
    title: 'VerseKeep',
    badges: ['FAITH × CODE', 'SCRIPTURE MEMORY'],
    contextLine: 'Meditation first, then memory practice',
    introParagraph: 'VerseKeep is a browser-based Scripture memory companion designed to begin with attentive reading before moving into recall drills.',
    sections: [
      {
        heading: 'The Practice Loop',
        content: 'Verses are organized by theological and pastoral themes. A user can study the text first, then work through fill-the-blank, free recall, word ordering, or reference-matching modes without creating an account.'
      },
      {
        heading: 'Supporting the Habit',
        content: 'Mastery, streaks, and accuracy stay in local storage. Optional worship stations, live Bible text, keyboard controls, and daily desktop or phone wallpapers support different ways of returning to the passage.',
        techNote: 'Tech: static HTML, CSS, and JavaScript; bundled verse data; local progress; optional live translation sources.'
      }
    ],
    challenges: {
      heading: 'Design Constraint',
      content: 'A memory score is not the same as meditation. The interface keeps Study available as the starting point and treats drills as servants of understanding rather than the purpose of the text.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The live app includes seventeen themes, five practice modes, worship stations, and a growing wallpaper library. Core practice continues to work from bundled data.'
    },
    actions: {
      primary: {
        label: 'Open VerseKeep',
        url: 'https://alphaeusng.github.io/VerseKeep/'
      },
      secondary: {
        label: 'View source',
        url: 'https://github.com/AlphaeusNg/VerseKeep'
      }
    }
  },

  'alparcade': {
    slug: 'alparcade',
    title: 'AlpArcade',
    badges: ['PLAY', 'BROWSER ARCADE'],
    contextLine: 'Mini-games with local progression',
    introParagraph: 'AlpArcade is a compact browser arcade with eight distinct cabinets, local progression, and an optional global scoreboard. Playing never requires an account.',
    sections: [
      {
        heading: 'The Arcade Loop',
        content: 'Players begin with free cabinets, earn local XP, unlock more games, pursue one seeded Singapore-day challenge, and keep personal bests on the device. The games range from Snake and brick breaker to reaction, memory, rhythm, and an endless space shooter.'
      },
      {
        heading: 'Shared Systems',
        content: 'Each cabinet has its own controls and scoring, while the lobby coordinates unlocks, achievements, daily challenges, music, and exportable progress. Google sign-in is optional and exists only for publishing best scores to the cloud board.',
        techNote: 'Tech: static HTML, CSS, JavaScript, Canvas and Web Audio; localStorage progression; optional Firebase scores.'
      }
    ],
    challenges: {
      heading: 'Fairness & Resilience',
      content: 'Arcade scoring needs to survive refreshes, long runs, mobile controls, and balance changes without turning cloud scores into a requirement. Local play stays authoritative for the player, while score validation and caps protect the optional public board.'
    },
    currentState: {
      heading: 'Current State',
      content: 'Eight cabinets are live, with local XP, achievements, daily play, music, and optional Google-backed leaderboards.'
    },
    actions: {
      primary: {
        label: 'Play AlpArcade',
        url: 'https://alphaeusng.github.io/AlpArcade/'
      },
      secondary: {
        label: 'View source',
        url: 'https://github.com/AlphaeusNg/AlpArcade'
      }
    }
  }
};

const MODAL_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');
let projectModalTrigger = null;

function getProjectModalFocusables(modal) {
  return Array.from(modal.querySelectorAll(MODAL_FOCUSABLE_SELECTOR))
    .filter(element => element.getClientRects().length > 0);
}

// Reusable renderer for rich project modals
function openRichProjectModal(slug) {
  const data = PROJECT_MODAL_DATA[slug];
  if (!data) {
    console.warn('No modal data for slug:', slug);
    return;
  }

  const modal = document.getElementById('project-modal');
  if (!modal) return;
  if (modal.classList.contains('hidden')) {
    projectModalTrigger = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  }

  // Header
  const badgesContainer = document.getElementById('modal-badges') || modal.querySelector('#modal-badges');
  const titleEl = document.getElementById('modal-title') || modal.querySelector('#modal-title');
  
  if (badgesContainer) {
    badgesContainer.innerHTML = '';
    data.badges.forEach((badge, i) => {
      const span = document.createElement('span');
      span.className = 'project-badge';
      if (i === 1 && slug === 'seeking-biblical-truth') {
        span.style.background = 'rgba(201,162,39,0.07)';
        span.style.borderColor = 'rgba(201,162,39,0.28)';
      }
      span.textContent = badge;
      badgesContainer.appendChild(span);
    });
  }
  
  if (titleEl) titleEl.textContent = data.title;

  // Body
  const body = document.getElementById('modal-case-study-body') || modal.querySelector('.case-study');
  if (body) {
    body.innerHTML = '';

    // Intro
    if (data.introParagraph) {
      const p = document.createElement('p');
      p.textContent = data.introParagraph;
      body.appendChild(p);
    }

    // Sections
    if (data.sections) {
      data.sections.forEach(section => {
        const h4 = document.createElement('h4');
        h4.textContent = section.heading;
        body.appendChild(h4);

        const p = document.createElement('p');
        p.textContent = section.content;
        body.appendChild(p);

        if (section.techNote) {
          const note = document.createElement('p');
          note.className = 'text-sm text-[#64748B] mt-1';
          note.textContent = section.techNote;
          body.appendChild(note);
        }
      });
    }

    // Context block
    if (data.intersection) {
      const div = document.createElement('div');
      div.className = 'intersection mt-6 p-4 rounded-xl bg-[#111827]';
      const title = document.createElement('strong');
      title.textContent = 'Why It Matters';
      div.appendChild(title);
      div.appendChild(document.createElement('br'));
      div.appendChild(document.createTextNode(data.intersection.content));
      body.appendChild(div);
    }

    // Challenges
    if (data.challenges) {
      const h4 = document.createElement('h4');
      h4.textContent = data.challenges.heading;
      body.appendChild(h4);
      const p = document.createElement('p');
      p.textContent = data.challenges.content;
      body.appendChild(p);
    }

    // Current State
    if (data.currentState) {
      const h4 = document.createElement('h4');
      h4.textContent = data.currentState.heading;
      body.appendChild(h4);
      const p = document.createElement('p');
      p.textContent = data.currentState.content;
      body.appendChild(p);
    }

    // Quote (DOM APIs only — avoid innerHTML for static content hygiene)
    if (data.quote) {
      const q = document.createElement('p');
      q.className = 'mt-6 text-sm border-l-2 border-[#C9A227]/60 pl-5 text-[#94A3B8]';
      q.appendChild(document.createTextNode(`“${data.quote.text}” — `));
      const attr = document.createElement('span');
      attr.className = 'not-italic';
      attr.textContent = data.quote.attribution;
      q.appendChild(attr);
      body.appendChild(q);
    }

    if (data.visual && data.visual.enabled && data.visual.type === 'd3-knowledge-graph') {
      const template = document.getElementById('template-kg-graph');
      if (template) body.appendChild(template.content.cloneNode(true));
    }
  }

  const footer = document.getElementById('modal-footer-actions');
  if (footer) {
    footer.innerHTML = '';

    const actions = [data.actions && data.actions.primary, data.actions && data.actions.secondary].filter(Boolean);
    actions.forEach((action, index) => {
      const link = document.createElement('a');
      link.href = action.url;
      link.textContent = action.label;
      link.className = index === 0
        ? 'btn-solid inline-flex items-center justify-center rounded-full bg-[#C9A227] px-5 py-2.5 font-medium transition-colors hover:bg-[#E8C547]'
        : 'btn-outline inline-flex items-center justify-center rounded-full border border-[#C9A227]/45 px-5 py-2.5 font-medium transition-colors hover:border-[#C9A227]/8 hover:bg-[#C9A227]/10';
      if (/^https?:\/\//.test(action.url)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      footer.appendChild(link);
    });

  }

  // Show modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    getProjectModalFocusables(modal)[0]?.focus({ preventScroll: true });
  });
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal || modal.classList.contains('hidden')) return;
  modal.classList.remove('flex');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  const trigger = projectModalTrigger;
  projectModalTrigger = null;
  if (trigger?.isConnected) {
    trigger.focus({ preventScroll: true });
  }
}

function handleProjectModalKeydown(event) {
  const modal = document.getElementById('project-modal');
  if (!modal || modal.classList.contains('hidden')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeProjectModal();
    return;
  }
  if (event.key !== 'Tab') return;

  const focusables = getProjectModalFocusables(modal);
  if (!focusables.length) {
    event.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !modal.contains(active))) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

document.addEventListener('keydown', handleProjectModalKeydown, true);

// Expose for debugging if needed
window.openRichProjectModal = openRichProjectModal;
window.closeProjectModal = closeProjectModal;
