import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw } from 'lucide-react';

// Split at word boundaries while preserving every source character. The full
// section remains available below; this view simply gives it a study rhythm.
function splitForReading(text, target = 1050) {
  if (!text) return [''];
  const parts = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + target, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(' ', end);
      if (boundary > start + target * 0.65) end = boundary;
    }
    parts.push(text.slice(start, end));
    start = end;
  }
  return parts;
}

export default function GuidedReader({ topic }) {
  const chunks = useMemo(() => splitForReading(topic.text), [topic.text]);
  const [index, setIndex] = useState(0);
  const [recall, setRecall] = useState('');
  const current = chunks[index] || '';

  function go(next) {
    setIndex(Math.max(0, Math.min(chunks.length - 1, next)));
    setRecall('');
  }

  return <section className="guided-reader" aria-label={`Guided reading: ${topic.title}`}>
    <div className="guided-reader-head">
      <div><span className="tag"><BookOpen size={14}/> GUIDED READING</span><h3>Study this section in small steps</h3></div>
      <span className="reader-count">Part {index + 1} of {chunks.length}</span>
    </div>
    <div className="reader-progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax={chunks.length} aria-valuenow={index + 1}><i style={{ width: `${((index + 1) / chunks.length) * 100}%` }}/></div>
    <pre className="reader-chunk">{current}</pre>
    <label className="recall-prompt">Pause and explain this part in your own words
      <textarea value={recall} onChange={e => setRecall(e.target.value)} placeholder="Try to recall the idea without copying the paragraph…" rows="2" />
    </label>
    <div className="reader-controls">
      <button onClick={() => go(0)} disabled={index === 0}><RotateCcw size={15}/> Start over</button>
      <button onClick={() => go(index - 1)} disabled={index === 0}><ArrowLeft size={15}/> Previous part</button>
      {index < chunks.length - 1
        ? <button className="reader-next" onClick={() => go(index + 1)}><Check size={15}/> Continue <ArrowRight size={15}/></button>
        : <span className="reader-finished"><Check size={16}/> End of section · all source text covered</span>}
    </div>
  </section>;
}
