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

// play: which signature move unlocks the project
//   'dunk'     – poster dunk in the paint
//   'corner'   – catch-and-shoot corner three
//   'logo'     – deep three from the logo
//   'fade'     – mid-range fadeaway over the defender
//   'stepback' – step-back three on the wing
// spot: [x, z] in metres. Hoop is at x=12.4, z=0. Half-court line is x=0.
// demo / demoLabel: the gold button (a live demo, a paper, anything). repo: the GitHub button.
export const PROJECTS = [
  {
    id: 'p1', play: 'dunk', playName: 'POSTER DUNK', call: 'POSTERIZED!',
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
    id: 'p2', play: 'corner', playName: 'CORNER THREE', call: 'BANG!',
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
    id: 'p3', play: 'logo', playName: 'LOGO THREE', call: 'FROM THE LOGO!',
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
    id: 'p4', play: 'fade', playName: 'FADEAWAY', call: 'CASH!',
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
    id: 'p5', play: 'stepback', playName: 'STEP-BACK THREE', call: 'SPLASH!',
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
