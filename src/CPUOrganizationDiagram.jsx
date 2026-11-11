import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react';

const phases = [
  { title: 'Fetch instruction', detail: 'The Program Counter supplies an address. Memory returns the instruction to the CPU’s Instruction Register.', active: ['memory', 'control', 'registers'], signal: 'pc' },
  { title: 'Decode', detail: 'The Control Unit interprets the opcode and determines which operands and operation the instruction needs.', active: ['control', 'registers'], signal: 'decode' },
  { title: 'Read operands', detail: 'Required data moves from registers or memory into the CPU datapath.', active: ['memory', 'registers'], signal: 'data' },
  { title: 'Execute', detail: 'The ALU performs the selected arithmetic or logical operation on the operand values.', active: ['registers', 'alu'], signal: 'execute' },
  { title: 'Write result', detail: 'The result is stored in a destination register or written back to memory; control flow selects the next PC value.', active: ['registers', 'alu', 'memory'], signal: 'write' },
  { title: 'Communicate with I/O', detail: 'The processor exchanges data and control with I/O interfaces. Polling, interrupts, and DMA coordinate transfers in different ways.', active: ['input', 'output', 'control'], signal: 'io' },
];

function Node({ id, x, y, width, height, title, lines, active }) {
  return <g className={`cpu-node ${active ? 'is-active' : ''}`}>
    <rect x={x} y={y} width={width} height={height} rx="12"/>
    <text x={x + width / 2} y={y + 28} textAnchor="middle" className="cpu-node-title">{title}</text>
    {lines.map((line, i) => <text key={line} x={x + width / 2} y={y + 52 + i * 19} textAnchor="middle" className="cpu-node-line">{line}</text>)}
  </g>;
}

export default function CPUOrganizationDiagram() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const phase = phases[step];
  const isActive = id => phase.active.includes(id);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setStep(value => (value + 1) % phases.length), 1800);
    return () => window.clearInterval(timer);
  }, [playing]);

  function selectStep(next) {
    setStep((next + phases.length) % phases.length);
  }

  return <div className="cpu-diagram">
    <div className="cpu-diagram-toolbar">
      <span>FIGURE WALKTHROUGH · CPU ORGANIZATION</span>
      <span>{step + 1} / {phases.length}</span>
    </div>
    <svg className="cpu-architecture-svg" viewBox="0 0 900 360" role="img" aria-labelledby="cpu-fig-title cpu-fig-desc">
      <title id="cpu-fig-title">Animated computer organization: processor, memory, input and output</title>
      <desc id="cpu-fig-desc">A CPU contains a control unit, registers and an arithmetic logic unit. It exchanges instructions and data with memory and communicates with input and output devices.</desc>
      <defs>
        <marker id="cpu-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 Z" className="cpu-arrow-head"/></marker>
      </defs>
      <text x="450" y="30" textAnchor="middle" className="cpu-bus-label">SYSTEM INTERCONNECT · address · data · control</text>
      <path d="M90 210 V306 M267 235 V306 M540 293 V306 M815 210 V306 M90 306 H815" className={`cpu-bus ${['data', 'write', 'io'].includes(phase.signal) ? 'is-hot' : ''}`} markerStart="url(#cpu-arrow)" markerEnd="url(#cpu-arrow)"/>
      <Node id="input" x={25} y={120} width={130} height={90} title="Input" lines={['data and programs']} active={isActive('input')}/>
      <Node id="memory" x={190} y={95} width={155} height={140} title="Memory" lines={['instructions', 'and data']} active={isActive('memory')}/>
      <g className={`cpu-core ${isActive('cpu') || phase.active.some(x => ['control', 'registers', 'alu'].includes(x)) ? 'is-active' : ''}`}>
        <rect x="385" y="58" width="310" height="235" rx="18" className="cpu-core-frame"/>
        <text x="540" y="84" textAnchor="middle" className="cpu-core-title">CENTRAL PROCESSING UNIT</text>
        <Node id="control" x={410} y={105} width={125} height={65} title="Control Unit" lines={['decode · sequence']} active={isActive('control')}/>
        <Node id="registers" x={545} y={105} width={125} height={65} title="Registers" lines={['PC · IR · operands']} active={isActive('registers')}/>
        <path d="M475 180 V205 M605 180 V205" className="cpu-internal-bus"/>
        <Node id="alu" x={470} y={205} width={200} height={65} title="ALU / datapath" lines={['arithmetic · logic · shifts']} active={isActive('alu')}/>
      </g>
      <Node id="output" x={750} y={120} width={130} height={90} title="Output" lines={['results']} active={isActive('output')}/>
      <circle className="cpu-signal" r="7">
        <animateMotion key={phase.signal} dur="1.4s" repeatCount="indefinite" path={phase.signal === 'execute' ? 'M490 238 H650' : phase.signal === 'decode' ? 'M600 137 H470' : phase.signal === 'write' ? 'M650 238 H300' : phase.signal === 'data' ? 'M280 165 H600' : phase.signal === 'io' ? 'M110 306 H800' : 'M600 137 H280'}/>
      </circle>
      <text x="267" y="265" textAnchor="middle" className="cpu-small-label">main memory</text>
      <text x="450" y="342" textAnchor="middle" className="cpu-small-label">The CPU repeatedly fetches, interprets and executes instructions.</text>
    </svg>
    <div className="cpu-phase-card" aria-live="polite"><b>{phase.title}</b><p>{phase.detail}</p></div>
    <div className="cpu-phase-controls">
      <button type="button" onClick={() => selectStep(step - 1)} aria-label="Previous CPU stage"><ArrowLeft size={15}/> Previous</button>
      <button type="button" className="cpu-play" onClick={() => setPlaying(value => !value)}>{playing ? <Pause size={15}/> : <Play size={15}/>} {playing ? 'Pause' : 'Play sequence'}</button>
      <button type="button" onClick={() => { setPlaying(false); selectStep(step + 1); }}><span>Next stage</span><ArrowRight size={15}/></button>
      <button type="button" onClick={() => { setPlaying(false); setStep(0); }} aria-label="Reset CPU walkthrough"><RotateCcw size={15}/></button>
    </div>
    <p className="cpu-diagram-note">This is a conceptual single-processor datapath. Actual bus arrangements and instruction cycles depend on the machine’s architecture.</p>
  </div>;
}
