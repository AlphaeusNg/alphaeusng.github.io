// Rich Project Case Study Modal System
// Extracted and cleaned from monolithic index.html

const PROJECT_MODAL_DATA = {
  'seeking-biblical-truth': {
    slug: 'seeking-biblical-truth',
    title: 'Seeking Biblical Truth',
    badges: ['FAITH × CODE', 'LIVING • OPEN'],
    contextLine: '',
    introParagraph: 'This project began from a simple conviction: the same habits of mind that produce trustworthy engineering — exacting definitions, documented assumptions, reproducible reasoning, and humility before evidence — are desperately needed in how Christians pursue doctrine and Scripture together.',
    sections: [
      {
        heading: 'The Question',
        content: 'How might we lower the barrier to rigorous, communal study of the Bible while raising the standard of clarity and charity? In an age of rapid theological hot-takes, can we build tools that reward slow, careful attention?'
      },
      {
        heading: 'The Architecture',
        content: 'A structured Obsidian vault serves as the living core — version-controlled, richly linked, and organized around books of Scripture, systematic categories, and historical voices. Accompanying Python tooling parses, cross-references, and surfaces connections that would otherwise remain invisible. Early web prototypes explore interfaces for community annotation and “truth-weight” scoring.',
        techNote: 'Tech: Obsidian + Dataview, custom Python parsers, experimental Flask/React surfaces, plain-text-first philosophy.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'The greatest risk is over-systematizing what must remain living. Scripture resists our neat categories; the Spirit is not a dataset. Another challenge: the temptation toward intellectual pride when building tools for “truth.” Both dangers require constant repentance and the guardrails of real community.'
    },
    currentState: {
      heading: 'Current State & Invitation',
      content: 'The vault grows weekly. The tooling is functional but young. The web experiments are early sketches. The project is deliberately public so that others may critique, contribute, or simply be encouraged to pursue truth with greater rigor and gentleness in their own contexts.'
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
    introParagraph: 'KoboForge is a browser-based EPUB builder for Kobo readers that keeps private files local while doing a better job of preserving paragraph boundaries and indentation.',
    sections: [
      {
        heading: 'The Problem',
        content: 'Many document converters handle simple prose but fail on the files readers actually keep: reports with complex tables, scanned material, wide layouts, and formula-heavy pages. KoboForge treats those cases as first-class conversion problems rather than edge cases.'
      },
      {
        heading: 'The Approach',
        content: 'The restored public page runs fully client-side. DOCX, PDF, TXT, and Markdown inputs are parsed in the browser, previewed before export, and then packaged into an EPUB without any upload step. PDF handling now uses line-height and x-position heuristics to reconstruct spaces, paragraph breaks, and indentation more faithfully than the older version.',
        techNote: 'Tech: static HTML, JSZip, Mammoth, PDF.js, client-side EPUB packaging, plus optional Python companion tooling under tools/.'
      }
    ],
    intersection: {
      content: 'This project reflects the same engineering instinct as the rest of the site: preserve meaning across format boundaries, be honest about failure modes, and keep private material private by default.'
    },
    challenges: {
      heading: 'Current Limitations',
      content: 'PDF extraction is still heuristic rather than semantically perfect. DOCX remains the cleanest path because it carries native paragraph structure; PDFs require inference from coordinates, spacing, and indentation.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The deployed site now includes the client-side converter again, with local preview and EPUB export. The Python companion remains useful for tougher offline experiments and future fidelity work.'
    },
    actions: {
      primary: {
        label: 'Open KoboForge page',
        url: 'kobo-forge.html',
        icon: 'external-link'
      },
      secondary: {
        label: 'Read companion notes',
        url: 'tools/koboforge/README.md'
      }
    }
  },

  'scene-text': {
    slug: 'scene-text',
    title: 'Scene Text Translator',
    badges: ['COMPUTER VISION + NLP', 'FINAL YEAR PROJECT'],
    contextLine: 'Nanyang Technological University',
    introParagraph: 'I built this NTU Final Year Project out of a simple frustration as someone who loves manga: translation delays are real, and I wanted to see whether the first wave of usable LLMs and image-model tooling could help shorten that gap for text embedded inside panels and natural images.',
    sections: [
      {
        heading: 'The Technical Challenge',
        content: 'Scene text is messy in exactly the ways manga and real-world photography make obvious: lighting shifts, lettering is stylized, speech bubbles and signboards deform the layout, and the same phrase can need very different translations depending on visual context. Off-the-shelf OCR breaks quickly. The hard part was not just extracting words, but preserving the reading experience after translation.'
      },
      {
        heading: 'Architecture & Process',
        content: 'The pipeline was: EasyOCR for localisation and recognition, an early GPT-4-class workflow for context-aware translation, then an overlay-back rendering pass in PIL/OpenCV that removed the source text region, matched layout as closely as possible, and wrote the translated text back into the image before returning the final composite. The full system shipped as a Flask backend with a React SPA so users could upload an image and immediately inspect the translated output.',
        techNote: 'Tech: PyTorch (CUDA), EasyOCR, OpenAI API, Flask, React, PIL/OpenCV. Evaluated on Manga109 and real-world photography during the early CV + LLM/image-model moment when capability was rising fast but reliability still needed explicit guardrails.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'The hardest problems were edge cases: vertical text, stylized logos, curved surfaces, dense dialogue, and the question of what should or should not be translated at all. Working with early LLM-era tooling made the limits obvious very quickly; preserving intent and visual coherence mattered more than pretending the pipeline was fully automatic.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The project remains open source as a useful reference for anyone exploring the CV + LLM boundary. For me, it was proof that careful data curation, translation judgment, and the final overlay-back step mattered more than hype about whichever new model had just landed.'
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
    introParagraph: 'At HTX’s Chemical, Biological, Radiological, Nuclear and Explosives Centre of Expertise, I worked on production-grade computer vision systems for automated threat detection at Singapore’s borders. The work is also reflected in the HTX intern story, a LinkedIn video walkthrough, and the sample X-ray imagery shown on this site.',
    sections: [
      {
        heading: 'The Operational Reality',
        content: 'This was not research theater. I spent time on the ground at Tuas Port, Woodlands Checkpoint, and Changi Airport collecting and staging real threat items in operational X-ray and imaging systems, then building the annotation, training, and automation pipelines that turned that raw signal into deployable models. The sample X-ray image included with this project gives a glimpse of the actual visual conditions the models had to handle.'
      },
      {
        heading: 'Pipeline & Process',
        content: 'Full end-to-end responsibility: on-ground data collection under real security constraints, large-scale annotation and quality control, model training and rigorous evaluation, Python automation for everything from data transforms to slide deck generation, and documentation for operational handoff. The public HTX blog write-up and LinkedIn video are the outward-facing summary; the actual work was the slow systems labor behind them.',
        techNote: 'Tech: YOLOv7, Detectron2, Python automation, real operational data from ICA checkpoints. 8.5/10 intern experience rating.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'Operational environments are hostile to clean datasets. Lighting, artifacts, and adversarial concealment are constant. The temptation to over-claim model performance is strong when real security is on the line. The mentors who drilled “Rank is given, respect is earned” into the culture modeled the epistemic humility the work actually requires.'
    },
    currentState: {
      heading: 'Current State & Impact',
      content: 'Models developed during this period contributed to real deployed capability at Singapore’s borders. On the site, this project now sits alongside the HTX blog feature, the LinkedIn video, and sample X-ray imagery so the work is legible both as deployed engineering and as a concrete visual system.'
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
    introParagraph: 'VotaFun is best understood as something you launch and try: a live, real-time group decision-making demo where the LLM helps surface preferences and shortlist options, but the final decision still belongs to the people in the room.',
    sections: [
      {
        heading: 'What The Demo Does',
        content: 'Users join a room, type what they want, watch the system cluster preferences into concrete options, and then vote together in real time. Most “AI group decision” tools either hide the model or let it decide. VotaFun keeps the model visible enough to be useful, then gets out of the way.'
      },
      {
        heading: 'Architecture',
        content: 'Next.js + TypeScript + Tailwind on the frontend, Flask/Python on the backend, and Redis + Socket.IO for room state and live synchronization. The stack exists to support a direct demo flow: enter a room, submit preferences, get ranked suggestions with explanations, and keep iterating without breaking the group experience.',
        techNote: 'Tech: Next.js, Flask, Socket.IO, Redis, OpenAI/ChatGPT, Docker Compose. ~158 commits. Live demo available.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'Getting the LLM to give good, non-manipulative explanations is harder than getting it to rank things. Users can game the system. The temptation to add “smart defaults” that quietly steer the group is constant. The architecture exists to make that steering visible and optional.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The important thing is that it runs. The project is open source under the VetoFun organization, and the live deployment lets people test the full interaction instead of reading a description of it.'
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
  }
};

// Reusable renderer for rich project modals
function openRichProjectModal(slug) {
  const data = PROJECT_MODAL_DATA[slug];
  if (!data) {
    console.warn('No modal data for slug:', slug);
    return;
  }

  const modal = document.getElementById('project-modal');
  if (!modal) return;

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
      div.innerHTML = `<strong>Why It Matters</strong><br>${data.intersection.content}`;
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

    // Quote
    if (data.quote) {
      const q = document.createElement('p');
      q.className = 'mt-6 text-sm border-l-2 border-[#C9A227]/60 pl-5 text-[#94A3B8]';
      q.innerHTML = `“${data.quote.text}” — <span class="not-italic">${data.quote.attribution}</span>`;
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
        ? 'inline-flex items-center justify-center rounded-full bg-[#C9A227] px-5 py-2.5 font-medium text-[#0A0F1C] hover:bg-[#EAB308] transition-colors'
        : 'inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 font-medium text-[#CBD5E1] hover:border-[#C9A227]/60 hover:text-white transition-colors';
      if (/^https?:\/\//.test(action.url)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      footer.appendChild(link);
    });

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.className = 'inline-flex items-center justify-center rounded-full px-5 py-2.5 font-medium text-[#94A3B8] hover:text-white transition-colors sm:ml-auto';
    close.addEventListener('click', closeProjectModal);
    footer.appendChild(close);
  }

  // Show modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  // Optional: re-init graph if this is the Seeking modal
  if (slug === 'seeking-biblical-truth' && typeof initKGModalGraph === 'function') {
    setTimeout(() => {
      initKGModalGraph();
    }, 80);
  }
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  modal.classList.remove('flex');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

const KG_MODAL_DATA = {
  nodes: [
    { id: 'bible', label: 'Bible', group: 'scripture' },
    { id: 'truth_weight', label: 'Truth Weight', group: 'doctrine' },
    { id: 'salvation', label: 'Salvation', group: 'doctrine' },
    { id: 'epistemic', label: 'Epistemic Humility', group: 'personal' },
    { id: 'discussion_app', label: 'Christian Discussion App', group: 'vision' },
    { id: 'obsidian', label: 'Obsidian Vault', group: 'tooling' },
    { id: 'logos', label: 'Logos', group: 'scripture' },
    { id: 'annotations', label: 'Annotation Pipelines', group: 'tooling' },
    { id: 'big_picture', label: 'Big Picture Canvas', group: 'vision' }
  ],
  links: [
    { source: 'bible', target: 'salvation' },
    { source: 'truth_weight', target: 'salvation' },
    { source: 'truth_weight', target: 'epistemic' },
    { source: 'truth_weight', target: 'discussion_app' },
    { source: 'discussion_app', target: 'bible' },
    { source: 'epistemic', target: 'logos' },
    { source: 'obsidian', target: 'big_picture' },
    { source: 'annotations', target: 'obsidian' }
  ]
};

let kgModalSimulation = null;

function kgColor(group) {
  return {
    scripture: '#5B9BD5',
    doctrine: '#C9A227',
    vision: '#9F7AEA',
    tooling: '#4CAF8A',
    personal: '#E07A7A'
  }[group] || '#CBD5E1';
}

function initKGModalGraph() {
  const root = document.getElementById('kg-modal-root');
  const svgEl = document.getElementById('kg-modal-svg');
  if (!root || !svgEl || typeof d3 === 'undefined') return;

  const graphArea = root.querySelector('.kg-graph-area') || root;
  const width = Math.max(280, graphArea.clientWidth || root.clientWidth || 640);
  const height = Math.max(180, graphArea.clientHeight || 300);
  const nodes = KG_MODAL_DATA.nodes.map(node => ({ ...node }));
  const links = KG_MODAL_DATA.links.map(link => ({ ...link }));

  if (kgModalSimulation) kgModalSimulation.stop();

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();
  svg.attr('viewBox', `0 0 ${width} ${height}`);

  const link = svg.append('g')
    .attr('stroke', '#4B5563')
    .attr('stroke-opacity', 0.65)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', 1.3);

  const node = svg.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'kg-modal-node')
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) kgModalSimulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) kgModalSimulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }));

  node.append('circle')
    .attr('r', d => d.group === 'doctrine' ? 10 : 8)
    .attr('fill', d => kgColor(d.group));

  node.append('text')
    .text(d => d.label)
    .attr('x', 14)
    .attr('y', 4)
    .attr('fill', '#E5E7EB')
    .attr('font-size', 11);

  kgModalSimulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(86))
    .force('charge', d3.forceManyBody().strength(-260))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

  const search = document.getElementById('kg-modal-search');
  if (search) {
    search.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      node.style('opacity', d => !term || d.label.toLowerCase().includes(term) ? 1 : 0.18);
    });
  }
}

function kgModalReset() {
  initKGModalGraph();
}

function kgModalReheat() {
  if (kgModalSimulation) kgModalSimulation.alpha(0.8).restart();
}

function kgModalShowAll() {
  const search = document.getElementById('kg-modal-search');
  if (search) search.value = '';
  document.querySelectorAll('.kg-modal-node').forEach(node => {
    node.style.opacity = '1';
  });
}

function kgModalExportPNG() {
  const root = document.getElementById('kg-modal-root');
  if (!root || typeof html2canvas === 'undefined') return;
  html2canvas(root, { backgroundColor: '#0A0F1C', scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'seeking-biblical-truth-graph.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

// Expose for debugging if needed
window.openRichProjectModal = openRichProjectModal;
window.closeProjectModal = closeProjectModal;
window.initKGModalGraph = initKGModalGraph;
window.kgModalReset = kgModalReset;
window.kgModalReheat = kgModalReheat;
window.kgModalShowAll = kgModalShowAll;
window.kgModalExportPNG = kgModalExportPNG;
