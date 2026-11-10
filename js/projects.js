// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE — everything personal lives here.
//  Content below was taken from ml_resume.pdf and swe_resume.pdf (Nov 2026).
//  A link set to '#' is hidden on the site until you fill it in.
// ─────────────────────────────────────────────────────────────

export const PLAYER = {
  name: 'Hrishikesh Muniraju',
  tag: 'HRISHIKESH',                 // short label shown above your player
  number: '23',
  role: 'MS CS @ UMass Amherst · ML + Software',
  team: 'DEVS',      // your side on the scorebug
  rival: 'BUGS',     // the defenders
  teammates: ['PyTorch', 'Python', 'React', 'Docker'], // names under your four teammates
  links: {
    github: 'https://github.com/2004Hrishikesh',
    linkedin: 'https://www.linkedin.com/in/hrishikesh2026',
    email: 'mailto:hrishikeshihs1985@gmail.com',
    resume: '#',     // e.g. 'resume.pdf' once you drop a public copy next to index.html
  },
};

// Everything on the scrolling page that is not a project. Taken from the résumés;
// `headline` and `bio` were drafted from them — reword freely.
export const PROFILE = {
  headline: 'I build machine-learning systems and the software around them.',
  bio: 'I am a Master\'s student in Computer Science at UMass Amherst. My work centres on computer vision and multimodal learning — I am first author of an IEEE paper on explainable video anomaly detection — and I like building the engineering around a model too: APIs, tests, CI and Docker.',
  facts: [
    { k: 'MS Computer Science', v: 'UMass Amherst · 2026 – 2028' },
    { k: 'B.Tech CSE · CGPA 8.53/10', v: 'VIT Vellore · 2022 – 2026' },
    { k: 'First-author paper', v: 'IEEE iConSCEPT 2025' },
  ],
  experience: [
    {
      role: 'Frontend Development Intern', org: 'Utthunga Technologies · AI Center of Excellence',
      where: 'Bengaluru, India', when: 'Feb 2026 – May 2026',
      points: [
        'Built UI features for in-house projects with React, JavaScript, HTML and CSS, working from Figma designs.',
        'Worked with Node.js services and explored LangChain for LLM-based application features.',
      ],
    },
  ],
  publication: {
    title: 'Enhancing Explainable Video Anomaly Detection using Cross-Modal Attention Fusion Mechanism',
    authors: 'Hrishikesh Muniraju and Sridhar Raj S',
    venue: '2025 International Conference on Signal Processing, Computation, Electronics, Power and Telecommunication (iConSCEPT), IEEE, 2025',
    url: 'https://ieeexplore.ieee.org/document/11436826',
  },
  education: [
    { school: 'University of Massachusetts Amherst', degree: 'Master of Science in Computer Science', when: 'Sep 2026 – May 2028 (expected)', note: 'Coursework: Machine Learning, Advanced Algorithms, Secure Distributed Systems' },
    { school: 'Vellore Institute of Technology', degree: 'Bachelor of Technology in Computer Science and Engineering', when: '2022 – 2026', note: 'CGPA 8.53/10' },
  ],
  skills: [
    { k: 'Languages', v: ['Python', 'JavaScript', 'C++', 'HTML', 'CSS', 'SQL'] },
    { k: 'ML & data', v: ['PyTorch', 'Hugging Face Transformers', 'scikit-learn', 'OpenCV', 'pandas', 'NumPy', 'CLIP', 'BLIP', 'YOLO'] },
    { k: 'Web & APIs', v: ['React', 'Node.js', 'Flask', 'FastAPI', 'Pydantic', 'Plotly Dash', 'SQLite'] },
    { k: 'Tooling', v: ['Git', 'Docker', 'GitHub Actions', 'pytest', 'Linux', 'CUDA', 'LangChain', 'Figma'] },
  ],
};

// highlight: the move the player performs in the background when someone hovers the project
//   'windmill' | 'spin360' | 'reverse' | 'halfcourt' | 'stepback' | 'fade'
// play: which signature move unlocks the project in the optional game
//   'dunk'     – poster dunk in the paint
//   'corner'   – catch-and-shoot corner three
//   'logo'     – deep three from the logo
//   'fade'     – mid-range fadeaway over the defender
//   'stepback' – step-back three on the wing
// spot: [x, z] in metres. Hoop is at x=12.4, z=0. Half-court line is x=0.
// demo / demoLabel: the gold button (a live demo, a paper, anything). repo: the GitHub button.
export const PROJECTS = [
  {
    id: 'p1', highlight: 'windmill', when: 'Aug 2025 – Apr 2026', play: 'dunk', playName: 'POSTER DUNK', call: 'POSTERIZED!',
    spot: [9.6, 0], color: '#ff4d5a',
    title: 'Ex-VAD — Explainable Video Anomaly Detection',
    tagline: 'Cross-modal attention that fuses video features with generated captions to flag anomalies and explain them. First-author paper at IEEE iConSCEPT 2025.',
    features: [
      'Cross-Modal Attention Fusion module: CLIP video features meet BLIP captions encoded by DistilBERT, through bidirectional multi-head attention, a learned gate and a residual path.',
      'Anomaly recall rose from 81.4% to 89.3% and AUC-ROC from 0.898 to 0.909 over the CLIP + BLIP baseline on the UCF-Crime test set (290 videos).',
      'A temporal branch (Transformer, BiLSTM, frame-difference motion encoder) with confidence-gated score fusion lifted accuracy from 82.8% to 86.2% and cut false alarms from 35 to 19.',
      'Ablations and a frame-shuffle test confirm the branch uses frame order; pytest checks in CI reproduce every reported metric.',
    ],
    metrics: [{ k: 'RECALL', v: '89.3%' }, { k: 'AUC-ROC', v: '0.909' }, { k: 'FALSE ALARMS', v: '−46%' }],
    stack: ['PyTorch', 'CLIP', 'BLIP', 'DistilBERT', 'Hugging Face Transformers', 'CUDA'],
    demo: 'https://ieeexplore.ieee.org/document/11436826', demoLabel: 'IEEE PAPER ↗',
    repo: 'https://github.com/2004Hrishikesh/Ex-VAD',
  },
  {
    id: 'p2', highlight: 'spin360', when: 'Jun 2025', play: 'corner', playName: 'CORNER THREE', call: 'BANG!',
    spot: [12.2, -7.0], color: '#35c8ff',
    title: 'Thermal-Image Human Detection',
    tagline: 'Dataset pipeline for a YOLO person detector on thermal images that still work in darkness and smoke. Team project at the National University of Singapore.',
    features: [
      'Analysed 1,966 labelled thermal frames: 3.1 people per frame on average, up to 12.',
      'Rebalanced the data by crowd size into 2,282 images.',
      'Applied CLAHE contrast enhancement and label-safe augmentation, then exported the set to COCO format through Roboflow.',
    ],
    metrics: [{ k: 'FRAMES', v: '1,966' }, { k: 'BALANCED SET', v: '2,282' }, { k: 'MAX / FRAME', v: '12' }],
    stack: ['Python', 'OpenCV', 'YOLO', 'Albumentations', 'Roboflow'],
    demo: '#', repo: 'https://github.com/2004Hrishikesh/thermal-human-detection',
  },
  {
    id: 'p3', highlight: 'halfcourt', when: 'Jul 2025', play: 'logo', playName: 'LOGO THREE', call: 'FROM THE LOGO!',
    spot: [3.4, 0], color: '#ffc531',
    title: 'Offline Legal Document Summarizer',
    tagline: 'A web app that summarises terms of service entirely offline — paste text, upload a PDF or DOCX, or give it a URL.',
    features: [
      'Four summarisers: a DistilBART model fine-tuned on ToS;DR, BART, T5 and extractive LexRank.',
      'Backend split into modules for file parsing, text cleaning and summarisation, with a fallback from transformer models to the extractive method so a failed model never breaks a request.',
      'FastAPI REST API with Pydantic validation and SQLite request history, served with Gunicorn and Uvicorn in Docker Compose.',
      '14 pytest tests that run in under a second with mocked models, plus GitHub Actions CI for linting, tests and Docker builds.',
    ],
    metrics: [{ k: 'SUMMARISERS', v: '4' }, { k: 'TESTS', v: '14' }, { k: 'INPUT TYPES', v: '3' }],
    stack: ['Python', 'Flask', 'FastAPI', 'SQLite', 'Docker', 'pytest', 'Hugging Face Transformers'],
    demo: '#', repo: 'https://github.com/2004Hrishikesh/terms-summarizer',
  },
  {
    id: 'p4', highlight: 'reverse', when: 'Sep 2025 – Nov 2025', play: 'fade', playName: 'FADEAWAY', call: 'CASH!',
    spot: [8.4, 2.9], color: '#b07bff',
    title: 'Vehicle Emissions Data Pipeline & Dashboard',
    tagline: 'A data-cleaning pipeline for three vehicle datasets, with an interactive dashboard that shows what was cleaned and why.',
    features: [
      'Cleans three vehicle datasets (3,400 rows) with median and KNN imputation and IQR outlier capping.',
      'Feature engineering and a quality score for each dataset.',
      'Interactive Plotly Dash dashboard with tabs for data overview, quality scores, distributions and the cleaning steps.',
    ],
    metrics: [{ k: 'DATASETS', v: '3' }, { k: 'ROWS', v: '3,400' }, { k: 'DASH TABS', v: '4' }],
    stack: ['Python', 'pandas', 'scikit-learn', 'Plotly Dash'],
    demo: '#', repo: 'https://github.com/2004Hrishikesh/automotive-emissions-management',
  },
  {
    id: 'p5', highlight: 'stepback', when: 'Fall 2026 – Present', play: 'stepback', playName: 'STEP-BACK THREE', call: 'SPLASH!',
    spot: [7.0, 5.3], color: '#3dffa2',
    title: 'UMass Dining Meal Planner',
    tagline: 'A daily pipeline that reads the UMass dining menu and emails a meal plan built around a protein target every morning.',
    features: [
      'Reads the daily UMass dining menu and asks an LLM through the Groq API for a meal plan around a protein target.',
      'Emails the plan as HTML every morning.',
      'Runs on a GitHub Actions schedule, so there is no server to maintain.',
    ],
    metrics: [{ k: 'SCHEDULE', v: 'DAILY' }, { k: 'SERVERS', v: '0' }, { k: 'DELIVERY', v: 'EMAIL' }],
    stack: ['Python', 'Groq API', 'LLMs', 'GitHub Actions'],
    demo: '#', repo: '#',
  },
];
