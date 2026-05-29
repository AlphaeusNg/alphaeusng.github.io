// Rich Project Case Study Modal System
// Extracted and cleaned from monolithic index.html

const PROJECT_MODAL_DATA = {
  'seeking-biblical-truth': {
    slug: 'seeking-biblical-truth',
    title: 'Seeking Biblical Truth',
    badges: ['FAITH × CODE', 'LIVING • OPEN'],
    contextLine: '',
    introParagraph: 'This project started from a pretty simple conviction: the habits that make engineering trustworthy also matter when Christians talk about doctrine. Define your terms. Show your reasoning. Stay humble when the evidence punches your favorite idea in the face.',
    sections: [
      {
        heading: 'The Question',
        content: 'How do you make serious Bible study easier to enter without dumbing it down? And how do you do that in a world full of instant theological takes from people who read one verse and declare victory?'
      },
      {
        heading: 'The Architecture',
        content: 'The core is a structured Obsidian vault: version-controlled, heavily linked, and organized around books of Scripture, doctrine, and older voices worth listening to. Around that, I built Python tooling to parse notes, surface cross-links, and make the hidden connections less hidden. The web layer is where I test ways people might actually move through all of this without getting lost or bored.',
        techNote: 'Tech: Obsidian + Dataview, custom Python parsers, experimental Flask/React surfaces, plain-text-first on purpose.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'The biggest risk is turning living truth into a tidy little system that flatters the builder. Scripture does not exist to make my diagrams feel smart. The other danger is obvious too: building tools about truth can make a person unbearably pleased with himself. Both problems need real community and regular repentance.'
    },
    currentState: {
      heading: 'Current State & Invitation',
      content: 'The vault keeps growing. The tooling works, but it is still young. The web layer is still very much in the \"this is promising, keep going\" phase. I keep it public on purpose so people can critique it, use it, or steal the good ideas and do better.'
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
    introParagraph: 'KoboForge is a browser-based EPUB builder for Kobo readers. It keeps private files local and tries not to butcher paragraph structure, which already puts it ahead of a depressing number of document converters.',
    sections: [
      {
        heading: 'The Problem',
        content: 'A lot of converters are fine if the document is plain vanilla prose and nothing weird happens. Real documents are rarely that polite. Tables, scans, ugly layouts, weird spacing, formula-heavy pages: that is where most tools quietly fall apart.'
      },
      {
        heading: 'The Approach',
        content: 'The public page runs fully client-side. DOCX, PDF, TXT, and Markdown go through the browser, get previewed before export, and end up packaged as EPUB without being uploaded anywhere. PDF handling leans on line-height and x-position heuristics to rebuild spaces, paragraph breaks, and indentation more faithfully than the older version did.',
        techNote: 'Tech: static HTML, JSZip, Mammoth, PDF.js, client-side EPUB packaging, plus optional Python companion tooling under tools/.'
      }
    ],
    intersection: {
      content: 'Same instinct as the rest of the site: preserve meaning across format boundaries, be honest when a tool can fail, and keep private material private by default.'
    },
    challenges: {
      heading: 'Current Limitations',
      content: 'PDF extraction is still heuristic. There is no magical \"understand this cursed layout perfectly\" button. DOCX remains the cleanest path because it carries real structure; PDFs make you infer intent from coordinates and spacing like some kind of document archaeologist.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The deployed site has the client-side converter back, with local preview and EPUB export. The Python companion is still useful for rougher offline cases and the fidelity work that never fully goes away.'
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
    introParagraph: 'I built this NTU Final Year Project because I like manga and got impatient. Translation delays are real, and I wanted to see whether early useful LLM tooling could help with text buried inside panels and natural images.',
    sections: [
      {
        heading: 'The Technical Challenge',
        content: 'Scene text is messy in all the obvious ways: bad lighting, stylized lettering, warped layouts, speech bubbles, signboards, and phrases that mean different things once context changes. Off-the-shelf OCR falls over quickly. The hard part was not just getting words out, but putting meaning back in without trashing the reading experience.'
      },
      {
        heading: 'Architecture & Process',
        content: 'The pipeline used EasyOCR for localisation and recognition, an early GPT-4-class workflow for context-aware translation, then a rendering pass in PIL/OpenCV that removed the original text region, matched layout as closely as possible, and wrote the translated text back into the image. The full thing shipped as a Flask backend with a React SPA so users could upload an image and inspect the output right away.',
        techNote: 'Tech: PyTorch (CUDA), EasyOCR, OpenAI API, Flask, React, PIL/OpenCV. Evaluated on Manga109 and real-world photography back when CV + LLM capability was rising fast and reliability still needed hard guardrails.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'The worst problems were all edge cases: vertical text, logos pretending not to be text, curved surfaces, dense dialogue, and the surprisingly non-trivial question of what should not be translated. Early LLM-era tooling made the limits obvious fast. Preserving intent and visual coherence mattered way more than pretending the pipeline was magic.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The project is still open source and still useful if you are exploring the CV + LLM boundary. For me it was proof that careful data curation, translation judgment, and the final overlay step mattered more than whatever shiny new model people were yelling about that week.'
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
    introParagraph: "At HTX's CBRNE Centre of Expertise, I worked on production-grade computer vision systems for automated threat detection at Singapore's borders. Real environment, real constraints, real consequences if you get sloppy.",
    sections: [
      {
        heading: 'The Operational Reality',
        content: 'This was not research theater. I spent time on the ground at Tuas Port, Woodlands Checkpoint, and Changi Airport collecting and staging real threat items in operational X-ray and imaging systems, then building the annotation, training, and automation pipelines that turned that mess into deployable models. The sample X-ray image on the site gives a glimpse of what the models actually had to deal with.'
      },
      {
        heading: 'Pipeline & Process',
        content: 'The job was end to end: on-ground data collection under security constraints, large-scale annotation and quality control, model training and evaluation, Python automation for everything from transforms to slide-deck generation, and documentation for handoff. The public HTX write-up and LinkedIn video are the tidy summary. The actual work was the slow, careful systems labor underneath.',
        techNote: 'Tech: YOLOv7, Detectron2, Python automation, real operational data from ICA checkpoints. 8.5/10 intern experience rating.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'Operational environments are brutal on clean-dataset fantasies. Lighting, artifacts, clutter, and adversarial concealment never stop. When real security is involved, the temptation to oversell model performance is always there. The right response is less ego, more rigor.'
    },
    currentState: {
      heading: 'Current State & Impact',
      content: "The models built during this period contributed to real deployed capability at Singapore's borders. On the site, the project sits next to the HTX write-up, the LinkedIn video, and sample X-ray imagery so people can see both the public-facing summary and the visual system behind it."
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
    introParagraph: "VotaFun makes the most sense when you just launch it and try it. It's a live group decision-making demo where the model helps surface preferences and shortlist options, but the final call still belongs to the humans. As it should.",
    sections: [
      {
        heading: 'What The Demo Does',
        content: 'Users join a room, say what they want, watch the system cluster preferences into actual options, and then vote together in real time. Most AI group-decision tools either hide the model or let it run the whole show. VotaFun keeps it useful, then tells it to sit down.'
      },
      {
        heading: 'Architecture',
        content: 'Next.js, TypeScript, and Tailwind on the frontend; Flask and Python on the backend; Redis and Socket.IO for room state and live sync. The stack exists to keep the demo flow smooth: join a room, submit preferences, get ranked suggestions with explanations, and keep iterating without breaking the group dynamic.',
        techNote: 'Tech: Next.js, Flask, Socket.IO, Redis, OpenAI/ChatGPT, Docker Compose. ~158 commits. Live demo available.'
      }
    ],
    challenges: {
      heading: 'Challenges & Humility',
      content: 'Getting the LLM to give useful, non-manipulative explanations is harder than getting it to rank things. Users can game the system. And there is always the temptation to sneak in \"smart defaults\" that quietly steer the room. The architecture exists to keep that steering visible and optional.'
    },
    currentState: {
      heading: 'Current State',
      content: 'The important thing is that it runs. The project is open source under the VetoFun organization, and the live deployment lets people test the actual interaction instead of reading another paragraph about it.'
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
