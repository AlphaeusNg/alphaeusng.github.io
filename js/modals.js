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
    intersection: {
      content: 'At the heart of this work lies the conviction that the God who spoke order into chaos is not threatened by careful systems thinking. Engineering virtues — decomposition, falsifiability, transparent provenance — are servants of theology, not rivals to it. This is not an attempt to reduce mystery to code, but to serve the truth with the best tools we have been given.'
    },
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
        label: 'Full vault + interactive graph →',
        url: 'seeking-biblical-truth/'
      }
    }
  },

  'koboforge': {
    slug: 'koboforge',
    title: 'KoboForge',
    badges: ['AI TOOLING', 'LOCAL-FIRST'],
    contextLine: 'Private EPUB workflow for Kobo readers',
    introParagraph: 'KoboForge is a pragmatic conversion workflow for turning PDFs and DOCX files into cleaner EPUB output for Kobo readers without sending private documents to a remote service.',
    sections: [
      {
        heading: 'The Problem',
        content: 'Many document converters handle simple prose but fail on the files readers actually keep: reports with complex tables, scanned material, wide layouts, and formula-heavy pages. KoboForge treats those cases as first-class conversion problems rather than edge cases.'
      },
      {
        heading: 'The Approach',
        content: 'The public page explains the workflow and the repository includes a local Python companion for tougher inputs. The emphasis is on local execution, readable output, metadata hygiene, and a simple command surface that can be extended without turning the portfolio into a hosted document processor.',
        techNote: 'Tech: static HTML project page plus Python companion tooling under tools/.'
      }
    ],
    intersection: {
      content: 'This project reflects the same engineering instinct as the rest of the site: preserve meaning across format boundaries, be honest about failure modes, and keep private material private by default.'
    },
    challenges: {
      heading: 'Current Limitations',
      content: 'The deployed site currently provides a project overview and companion CLI rather than a full browser-based converter. That constraint is intentional until a complete, tested web UI is ready to publish.'
    },
    currentState: {
      heading: 'Current State',
      content: 'A working static project page is available from the portfolio. The companion script remains the practical local path for experimentation and future hard-document conversion work.'
    },
    actions: {
      primary: {
        label: 'Open KoboForge page',
        url: 'kobo-forge.html',
        icon: 'external-link'
      },
      secondary: {
        label: 'Read companion notes',
        url: 'tools/README.md'
      }
    }
  },

  'scene-text': {
    slug: 'scene-text',
    title: 'Scene Text Translator',
    badges: ['COMPUTER VISION + NLP', 'FINAL YEAR PROJECT'],
    contextLine: 'Nanyang Technological University',
    introParagraph: 'My NTU Final Year Project explored the practical intersection of computer vision and large language models: localising and translating text embedded in natural scenes or stylized manga pages.',
    sections: [
      {
        heading: 'The Technical Challenge',
        content: 'Real-world scene text is messy. Lighting varies, fonts are artistic, backgrounds compete, and the same character can appear in wildly different visual contexts. Off-the-shelf OCR fails quickly. The system needed to not only detect text but understand its visual role so that translations could be rendered back without destroying the original aesthetic.'
      },
      {
        heading: 'Architecture & Process',
        content: 'EasyOCR for detection and recognition → GPT-4 class model for context-aware translation → dynamic overlay generation using PIL/OpenCV that respects original font size, orientation, and background. The entire pipeline runs as a Flask backend serving a clean React SPA. Users upload an image and receive a translated version with text seamlessly reintegrated.',
        techNote: 'Tech: PyTorch (CUDA), EasyOCR, OpenAI API, Flask, React, PIL/OpenCV. Tested extensively on Manga109 and real-world photography.'
      }
    ],
    intersection: {
      content: 'Localizing and faithfully re-rendering text across visual and linguistic boundaries is interpretive work under severe constraints. The technical demand for fidelity when meaning must cross cultures resonates with the conviction that the Logos is the coherence of all things. Engineering that reduces distortion in transmission participates, at the level of craft, in the larger preservation of truth.'
    },
    challenges: {
      heading: 'Challenges & Humility',
      content: 'The hardest problems were not model accuracy but edge cases: vertical text, stylized logos, text on curved surfaces, and the ethical question of what should even be translated. Failure modes taught me that “good enough” in perception systems is often culturally and aesthetically loaded.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The project is open source and remains a useful reference for anyone working at the CV + LLM boundary. It taught me that the last mile of real-world computer vision is almost always about careful data curation and honest failure analysis rather than chasing the newest architecture.'
    },
    quote: {
      text: 'Every model necessarily discards information to predict. The gap between a deployed detector and the irreducible mess of a traveler’s bag is permanent.',
      attribution: 'From HTX reflection, equally true here'
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
    introParagraph: 'At HTX’s Chemical, Biological, Radiological, Nuclear and Explosives Centre of Expertise, I worked on production-grade computer vision systems for automated threat detection at Singapore’s borders.',
    sections: [
      {
        heading: 'The Operational Reality',
        content: 'This was not research theater. I spent time on the ground at Tuas Port, Woodlands Checkpoint, and Changi Airport collecting and staging real threat items in operational X-ray and imaging systems, then building the annotation, training, and automation pipelines that turned that raw signal into deployable models (primarily YOLO family and Detectron2).'
      },
      {
        heading: 'Pipeline & Process',
        content: 'Full end-to-end responsibility: on-ground data collection under real security constraints → large-scale annotation and quality control → model training and rigorous evaluation (including SSIM/FFT analysis) → Python automation for everything from data transforms to slide deck generation → documentation and handoff to operational teams.',
        techNote: 'Tech: YOLOv7, Detectron2, Python automation, real operational data from ICA checkpoints. 8.5/10 intern experience rating.'
      }
    ],
    intersection: {
      content: 'The demand for extreme precision when labeling what endangers the public is not abstract. It forces a particular kind of attention: you cannot afford to project your own categories onto the data. This discipline is indistinguishable in spirit from the reverence owed to Scripture or to any serious intellectual tradition. Annotation, in this register, becomes an act of guardianship.'
    },
    challenges: {
      heading: 'Challenges & Humility',
      content: 'Operational environments are hostile to clean datasets. Lighting, artifacts, and adversarial concealment are constant. The temptation to over-claim model performance is strong when real security is on the line. The mentors who drilled “Rank is given, respect is earned” into the culture modeled the epistemic humility the work actually requires.'
    },
    currentState: {
      heading: 'Current State & Impact',
      content: 'Models developed during this period contributed to real deployed capability at Singapore’s borders. The experience permanently changed how I think about “applied AI” — it is logistics, anthropology, and moral seriousness as much as it is model architecture.'
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
      }
    }
  },

  'votafun': {
    slug: 'votafun',
    title: 'VotaFun',
    badges: ['MULTIPLAYER + AI', 'REAL-TIME COLLABORATION'],
    contextLine: 'NTU 3002-TEL1 Module Project',
    introParagraph: 'VotaFun is a real-time, gamified group decision-making platform that uses large language models to help people surface preferences, shortlist options, and reach decisions together without the AI making the final call.',
    sections: [
      {
        heading: 'The Design Philosophy',
        content: 'Most “AI group decision” tools either poll people and then let the model decide, or they hide the model entirely. VotaFun does the opposite: the LLM ingests free-text preferences, proposes ranked options with transparent natural-language explanations, and then steps back. The final act of judgment and the relational joy of choosing together remain human.'
      },
      {
        heading: 'Architecture',
        content: 'Next.js + TypeScript + Tailwind frontend, Flask/Python backend, Redis + Socket.IO for real-time synchronization across rooms. Users join with a username, submit preferences, see live proposals and voting, and can iterate. The entire system is designed so the AI augments collective intelligence rather than replacing it.',
        techNote: 'Tech: Next.js, Flask, Socket.IO, Redis, OpenAI/ChatGPT, Docker Compose. ~158 commits. Live demo available.'
      }
    ],
    intersection: {
      content: 'Tools that would serve the church’s (or any community’s) discernment must be constructed with the same asymmetry VotaFun attempts: they illuminate options and surface hidden preferences, but they do not decide. The final movement of conscience and relationship belongs to the people in the room. When AI is built this way, it can genuinely serve rather than subtly colonize human judgment.'
    },
    challenges: {
      heading: 'Challenges & Humility',
      content: 'Getting the LLM to give good, non-manipulative explanations is harder than getting it to rank things. Users can game the system. The temptation to add “smart defaults” that quietly steer the group is constant. The architecture exists to make that steering visible and optional.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The project is open source under the VetoFun organization. It remains one of the cleanest demonstrations I have built of human-AI collaboration that respects human agency at the architectural level.'
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
        label: 'View on GitHub',
        url: 'https://github.com/VetoFun/3002-TEL1-VotaFun',
        icon: 'external-link'
      },
      secondary: {
        label: 'Try the live demo',
        url: 'https://votafun.onrender.com/'
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

    // Intersection
    if (data.intersection) {
      const div = document.createElement('div');
      div.className = 'intersection mt-6 p-4 rounded-xl bg-[#111827]';
      div.innerHTML = `<strong>The Intersection</strong><br>${data.intersection.content}`;
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
