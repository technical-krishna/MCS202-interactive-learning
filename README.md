
# MCS-202 Computer Organisation Study Studio

**🔗 Live Website:** [mcs202-interactive-learning.vercel.app](https://mcs202-interactive-learning.vercel.app)

A React study app covering all 16 units across the four IGNOU course blocks.
It maps 227 section lessons from the books. Each lesson has a guided reader
that reveals the complete section text in short recall steps, interactive visual
models, and access to the intact section text. All 197 printed source figures are
catalogued and presented as interactive, animated walkthroughs inside their
own lessons; source figure-number inconsistencies are explained in place. Unit pages also include a searchable source reader, retrieval
questions with feedback, exam answer prompts, and a saved topic-by-topic mastery
checklist. Light and black/charcoal dark themes are available.


A React study app covering all 16 units across the four IGNOU course blocks.
It maps 227 section lessons from the books. Each lesson has a guided reader
that reveals the complete section text in short recall steps, interactive visual
models, and access to the intact section text. All 197 printed source figures are
catalogued and presented as interactive, animated walkthroughs inside their
own lessons; source figure-number inconsistencies are explained in place. Unit pages also include a searchable source reader, retrieval
questions with feedback, exam answer prompts, and a saved topic-by-topic mastery
checklist. Light and black/charcoal dark themes are available.

The 16 source readers contain approximately 134,000 extracted words from the
provided PDFs. The four original PDFs remain bundled under `public/source/pdfs/`
as source artifacts; the learner-facing app does not require opening them.

## Run locally

```bash
npm install
npm run dev
```

Open the local address shown by Vite. To create and preview a production build:

```bash
npm run build
npm run preview
```

Progress is stored in the browser's local storage.

## Content audit

Run the source and diagram integrity audit after changing course metadata:

```bash
python3 scripts/audit-course.py
python3 scripts/audit-ui.py
```

It verifies all 227 lesson texts against their unit and block readers, validates
the diagram catalog and its source-page mapping, checks PDF/extracted page counts,
and confirms the app has no learner-facing PDF link or viewer. The UI audit also
checks all 197 source figures have an interactive rendering path, every lesson
mounts a lab, and the final black/charcoal theme and responsive safety rules are
present.
