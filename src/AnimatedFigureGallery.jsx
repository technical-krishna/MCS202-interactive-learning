import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import figures from './figure-catalog.json';

const stages = {
  architecture: ['Input / output', 'Memory', 'Control', 'Registers', 'ALU'],
  instruction: ['Opcode', 'Addressing mode', 'Operand', 'Execute', 'Write result'],
  pipeline: ['Fetch', 'Decode', 'Execute', 'Memory', 'Write back'],
  transfer: ['Request', 'Ready', 'Transfer', 'Acknowledge'],
  device: ['Physical signal', 'Sensor', 'Encoding', 'Computer data'],
  concept: ['Representation', 'Organization', 'Operation', 'Result'],
};

function sequenceForFigure(figure) {
  const caption = `${figure.caption} ${figure.topic}`.toLowerCase();
  if (figure.model === 'architecture') {
    if (/harvard/.test(caption)) return ['Instruction memory', 'Instruction path', 'CPU', 'Data path', 'Data memory'];
    if (/von neumann|princeton/.test(caption)) return ['Input / output', 'Shared memory', 'Address + data bus', 'CPU'];
    if (/mobile/.test(caption)) return ['Touch / sensors', 'Applications processor', 'Communications processor', 'Display · memory · power'];
    if (/multi.?core|multiprocessor|shared memory/.test(caption)) return ['Core 0', 'Core 1', 'Interconnect', 'Shared memory'];
    if (/8086/.test(caption)) return ['Bus Interface Unit', 'Instruction queue', 'Execution Unit', 'System bus'];
    return stages.architecture;
  }
  if (figure.model === 'instruction') {
    if (/assembler|program assembly/.test(caption)) return ['Assembly source', 'Assembler', 'Object module', 'Linker', 'Loader / execution'];
    if (/stored program/.test(caption)) return ['Instruction memory', 'Program counter', 'Instruction register', 'Decode / execute'];
    if (/program characteristics/.test(caption)) return ['High-level program', 'Procedure calls', 'Memory references', 'Compiled instruction stream'];
    if (/stack/.test(caption)) return ['CALL', 'Push return address', 'Procedure runs', 'RET restores address'];
    if (/direct and indirect|addressing mode|addressing modes/.test(caption)) return ['Instruction field', 'Effective address', 'Pointer lookup', 'Operand'];
    if (/micro.?instruction|control unit|wilkes/.test(caption)) return ['Control memory', 'Microinstruction', 'Datapath signals', 'Next address'];
    return stages.instruction;
  }
  if (figure.model === 'pipeline') {
    if (/interrupt/.test(caption)) return ['Finish instruction', 'Save state', 'Run handler', 'Restore state', 'Resume'];
    if (/branch|jump/.test(caption)) return ['Fetch', 'Decode branch', 'Resolve target', 'Flush / stall', 'Fetch target'];
    return stages.pipeline;
  }
  if (figure.model === 'transfer') {
    if (/handshak/.test(caption)) return ['Request', 'Data valid', 'Acknowledge', 'Release signals'];
    if (/strobe/.test(caption)) return /source/i.test(caption) ? ['Source sets data', 'Source asserts strobe', 'Destination captures', 'Source clears strobe'] : ['Destination asserts strobe', 'Source places data', 'Destination captures', 'Strobe clears'];
    if (/dma/.test(caption)) return ['CPU sets up DMA', 'DMA requests bus', 'Memory block transfers', 'CPU notified'];
    if (/interrupt/.test(caption)) return ['Device requests service', 'CPU finishes instruction', 'Handler runs', 'CPU resumes'];
    if (/programmed i\/o/.test(caption)) return ['CPU polls status', 'Device ready?', 'CPU transfers item', 'Repeat'];
    return stages.transfer;
  }
  if (figure.model === 'device') {
    if (/mouse/.test(caption)) return ['Surface movement', 'Optical / mechanical sensor', 'Relative X,Y counts', 'Cursor update'];
    if (/keyboard/.test(caption)) return ['Key switch changes', 'Matrix is scanned', 'Scan code generated', 'CPU receives event'];
    if (/camera|webcam/.test(caption)) return ['Lens focuses scene', 'Sensor samples light', 'Pixels are encoded', 'Image reaches memory'];
    if (/siri|alexa|speaker/.test(caption)) return ['Microphone captures speech', 'Audio is digitised', 'Words / intent recognised', 'Response is produced'];
    if (/printer/.test(caption)) return ['Computer sends page data', 'Printer controller buffers', 'Print engine marks paper', 'Page exits'];
    if (/scanner/.test(caption)) return ['Illuminate document', 'Sensor measures reflection', 'Sample rows of pixels', 'Encode image data'];
    if (/modem/.test(caption)) return ['Digital bits', 'Modulate carrier', 'Analog channel', 'Demodulate bits'];
    if (/display|monitor|crt|lcd|led|raster|pixel|color|resolution|frame buffer|bit-mapped/.test(caption)) return ['Frame-buffer value', 'Pixel address', 'Color / intensity', 'Screen refresh'];
  }
  if (figure.model === 'memory') {
    if (/hierarchy/.test(caption)) return ['Registers', 'L1 / L2 cache', 'Main memory', 'Secondary storage'];
    if (/virtual address/.test(caption)) return ['Virtual page', 'TLB / page table', 'Physical frame', 'Offset preserved'];
    if (/associative/.test(caption)) return ['Search key', 'Compare all tags', 'Match signal', 'Selected word'];
    if (/cache/.test(caption)) return ['Block address', 'Index selects line', 'Tag comparison', 'Hit or miss'];
    return ['Address decoder', 'Selected word', 'Read / write control', 'Data lines'];
  }
  return stages[figure.model] || stages.concept;
}

function AnimatedModel({ figure, step, setStep, bits, setBits, logicCells, setLogicCells, address, setAddress, gate, setGate }) {
  const model = figure.model;
  const caption = `${figure.caption} ${figure.topic}`.toLowerCase();
  const binary = bits.slice(0, 2);
  const result = gate === 'AND' ? binary[0] & binary[1] : gate === 'OR' ? binary[0] | binary[1] : gate === 'XOR' ? binary[0] ^ binary[1] : 1 - binary[0];
  const sequence = sequenceForFigure(figure);

  if (model === 'scale') {
    const eras = [
      ['SSI', '10¹–10²', 'a few gates on a chip'],
      ['MSI', '10²–10³', 'small functional blocks'],
      ['LSI', '10³–10⁵', 'larger integrated logic'],
      ['VLSI', '10⁵–10⁷', 'processors and substantial memory'],
      ['ULSI', '10⁷+', 'very high transistor integration'],
    ];
    const selected = Math.min(step % eras.length, eras.length - 1);
    return <div className="figure-model figure-model-scale">
      <div className="scale-bars">{eras.map(([name,count],i)=><button key={name} className={i===selected?'selected':''} onClick={()=>setStep(i)} style={{'--bar-height':`${28+i*15}px`}}><i/><b>{name}</b><small>{count}</small></button>)}</div>
      <div className="scale-explanation"><b>{eras[selected][0]} · approximately {eras[selected][1]} transistors</b><span>{eras[selected][2]}</span></div>
      <p>Integration levels describe the order of magnitude of circuit density. The exact boundaries have changed over time, but the course figure’s key idea is that shrinking features enabled much more functionality per chip.</p>
    </div>;
  }

  if (model === 'logic' && /k-map|kmap/.test(caption)) return <div className="figure-model figure-model-kmap">
    <div className="kmap-grid" aria-label="Four-variable Karnaugh map">
      <span className="kmap-corner">AB \ CD</span>{['00','01','11','10'].map(x=><b key={`x${x}`}>{x}</b>)}
      {['00','01','11','10'].map((row,r)=><React.Fragment key={`r${row}`}><b>{row}</b>{[0,1,2,3].map((col)=><button type="button" key={col} className={logicCells[r*4+col]?'one':''} onClick={()=>setLogicCells(v=>v.map((n,i)=>i===r*4+col?1-n:n))}>{logicCells[r*4+col]}</button>)}</React.Fragment>)}
    </div>
    <p>Gray-code ordering places adjacent input combinations in neighboring cells. Toggle minterms, then group adjacent 1s in powers of two; edge cells also wrap around. This 4-variable map is a teaching model for the K-map figure.</p>
  </div>;

  if (model === 'logic' && /multiplexer|\bmux\b/.test(caption)) return <div className="figure-model figure-model-logic">
    <div className="mux-select"><label>Select input<input type="range" min="0" max="3" value={address%4} onChange={e=>setAddress(Number(e.target.value))}/><b>I{address%4}</b></label></div>
    <div className="mux-inputs">{bits.map((v,i)=><button key={i} className={i===address%4?'selected':''} onClick={()=>setBits(x=>x.map((n,j)=>j===i?1-n:n))}>I{i} = {v}</button>)}<b className="mux-output">Y = {bits[address%4]}</b></div>
    <p>The select lines choose exactly one input to appear at the output. Changing a non-selected input does not change Y.</p>
  </div>;

  if (model === 'logic' && /decoder/.test(caption)) {
    const selected = (bits[0] << 1) | bits[1];
    return <div className="figure-model figure-model-decoder"><div className="figure-inputs"><button onClick={()=>setBits(v=>[1-v[0],v[1],v[2],v[3]])}>A1 = {bits[0]}</button><button onClick={()=>setBits(v=>[v[0],1-v[1],v[2],v[3]])}>A0 = {bits[1]}</button></div><div className="decoder-outputs"><b>2 → 4<br/>decoder</b>{[0,1,2,3].map(i=><span key={i} className={selected===i?'selected':''}>Y{i} = {selected===i?1:0}</span>)}</div><p>A binary address selects one of four output lines. All other outputs remain inactive.</p></div>;
  }

  if (model === 'logic' && /encoder/.test(caption)) return <div className="figure-model figure-model-decoder"><div className="encoder-inputs">{[0,1,2,3].map(i=><button key={i} className={address%4===i?'selected':''} onClick={()=>setAddress(i)}>D{i} {address%4===i?'active':'inactive'}</button>)}</div><div className="encoder-result"><b>4 → 2 encoder</b><span>Y1Y0 = {(address%4).toString(2).padStart(2,'0')}</span></div><p>A one-hot input is encoded as its binary index. This simple model assumes only one input is active at a time.</p></div>;

  if (model === 'logic' && /truth table|boolean algebra|boolean expression|minterm|maxterm/.test(caption)) return <div className="figure-model figure-model-logic">
    <div className="boolean-law-picker"><button className={gate==='AND'?'selected':''} onClick={()=>setGate('AND')}>AND truth table</button><button className={gate==='OR'?'selected':''} onClick={()=>setGate('OR')}>OR truth table</button><button className={gate==='XOR'?'selected':''} onClick={()=>setGate('XOR')}>XOR comparison</button></div>
    <div className="boolean-table"><b>A</b><b>B</b><b>{gate==='AND'?'A · B':gate==='OR'?'A + B':'A ⊕ B'}</b>{[0,1].flatMap(a=>[0,1].map(b=><React.Fragment key={`${a}${b}`}><span>{a}</span><span>{b}</span><strong>{gate==='AND'?a&b:gate==='OR'?a|b:a^b}</strong></React.Fragment>))}</div>
    <p>The truth table enumerates every input combination. Select a Boolean operator and compare its output pattern before simplifying or implementing it with gates.</p>
  </div>;

  if (model === 'logic') return <div className="figure-model figure-model-logic">
    <div className="figure-inputs"><button onClick={() => setBits(v => [1 - v[0], v[1], v[2], v[3]])}>A = {binary[0]}</button><button onClick={() => setBits(v => [v[0], 1 - v[1], v[2], v[3]])}>B = {binary[1]}</button>
      <label>Gate<select value={gate} onChange={e => setGate(e.target.value)}><option>AND</option><option>OR</option><option>XOR</option><option>NOT</option></select></label></div>
    <div className="figure-logic-path"><span>{/a \. b \+ c|a\.b\+c/.test(caption)?'A · B + C':'A · B'}</span><i className="logic-wire"/><b className="logic-gate">{gate}</b><i className="logic-wire"/><strong className={result ? 'logic-one' : ''}>F = {/a \. b \+ c|a\.b\+c/.test(caption)?((binary[0]&binary[1])|bits[2]):result}</strong></div>
    {/a \. b \+ c|a\.b\+c/.test(caption)&&<button onClick={()=>setBits(v=>[v[0],v[1],1-v[2],v[3]])}>C = {bits[2]} · toggle C</button>}
    <p>Change the binary inputs and evaluate the selected Boolean operation. AND is 1 only when both inputs are 1; OR is 1 when either is 1; XOR is 1 when the inputs differ.</p>
  </div>;

  if (model === 'adder') {
    const [a, b] = binary, cin = bits[2], sum = a ^ b ^ cin, carry = (a & b) | (cin & (a ^ b));
    return <div className="figure-model figure-model-adder">
      <div className="figure-inputs"><button onClick={() => setBits(v => [1-v[0],v[1],v[2],v[3]])}>A = {a}</button><button onClick={() => setBits(v => [v[0],1-v[1],v[2],v[3]])}>B = {b}</button><button onClick={() => setBits(v => [v[0],v[1],1-v[2],v[3]])}>Carry in = {cin}</button></div>
      <div className="adder-svg"><span>A = {a}</span><span>B = {b}</span><span>Cin = {cin}</span><b>FULL<br/>ADDER</b><strong>Sum = {sum}</strong><strong>Carry out = {carry}</strong></div>
      <p>Sum = A ⊕ B ⊕ Cin. Carry out = AB + Cin(A ⊕ B). Toggle each input and verify both outputs.</p>
    </div>;
  }

  if (model === 'memory') return <div className="figure-model figure-model-memory">
    <div className="memory-address-control"><label>Address <input type="range" min="0" max="7" value={address} onChange={e => setAddress(Number(e.target.value))}/><b>{address}</b></label><button onClick={() => setBits(v => {const n=[...v];n[address%4]=1-n[address%4];return n})}>Write {bits[address%4] ? 0 : 1}</button></div>
    <div className="memory-cell-grid">{Array.from({length:8},(_,i)=><div key={i} className={i===address?'selected':''}><small>Address {i}</small><b>{bits[i%4]}</b></div>)}</div>
    <p>The address decoder selects one word. A read returns the selected stored value; a write changes the selected location. Addressing, word width, and timing depend on the memory design described in the section.</p>
  </div>;

  if (model === 'state') return <div className="figure-model figure-model-state">
    <div className="state-bits">{bits.map((bit,i)=><button key={i} onClick={() => setBits(v => v.map((x,j)=>j===i?1-x:x))} aria-label={`Toggle state bit ${i}`}>{bit}<small>Q{i}</small></button>)}</div>
    <div className="state-clock"><i style={{'--pulse-delay':`${step * -.25}s`}}/><span>clock edge</span></div>
    <p>Each cell stores one state bit until its control or clock condition permits a change. Toggle the cells and step the clock to explore the state representation.</p>
  </div>;

  if (model === 'storage') return <div className="figure-model figure-model-storage">
    <div className="disk-illustration" style={{'--disk-turn':`${step * 36}deg`}}><i/><i/><i/><i/><b className={`disk-head head-${step%4}`}/><span>track {step%4 + 1} · sector {address%8 + 1}</span></div>
    <div className="figure-inputs"><label>Sector<input type="range" min="0" max="7" value={address} onChange={e=>setAddress(Number(e.target.value))}/><b>{address + 1}</b></label><button onClick={()=>setStep(s=>(s+1)%8)}>Rotate to next sector</button></div>
    <p>A rotating medium stores data along tracks divided into sectors. The head position and rotation determine access time; the exact geometry shown here is a teaching model.</p>
  </div>;

  const active = step % sequence.length;
  return <div className={`figure-model figure-model-${model}`}>
    <div className="diagram-stage-track">{sequence.map((name,i)=><React.Fragment key={name}><button className={i===active?'active':''} onClick={()=>setStep(i)}><small>{String(i+1).padStart(2,'0')}</small><b>{name}</b></button>{i<sequence.length-1&&<i className={i<active?'passed':''}/>}</React.Fragment>)}</div>
    <div className="diagram-signal-row"><span>Signal</span><i className={active%2===0?'signal-on':''}/><b>{sequence[active]}</b><span>{model==='pipeline'?'One instruction advances by a stage each clock.':model==='transfer'?'The sender and receiver coordinate before data is accepted.':model==='device'?'A physical input is converted into a computer-readable representation.':model==='instruction'?'The processor decodes fields, locates operands and performs the operation.':'Follow the highlighted component to see its role in this organization.'}</span></div>
    <button className="figure-step-button" onClick={()=>setStep(s=>(s+1)%sequence.length)}><Zap size={15}/> Advance {sequence[active]}</button>
  </div>;
}

export default function AnimatedFigureGallery({ unit, topic }) {
  const entries = useMemo(() => figures.filter(item => item.unit === unit + 1 && item.topicId === topic.id), [unit, topic.id]);
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [bits, setBits] = useState([1,0,0,1]);
  const [logicCells, setLogicCells] = useState([1,0,0,1,0,1,1,0,0,0,1,0,1,0,0,1]);
  const [address, setAddress] = useState(0);
  const [gate, setGate] = useState('AND');
  useEffect(() => { setSelected(0); setStep(0); setPlaying(false); setBits([1,0,0,1]); setLogicCells([1,0,0,1,0,1,1,0,0,0,1,0,1,0,0,1]); setAddress(0); setGate('AND'); }, [unit, topic.id]);
  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setStep(value => value + 1), 1100);
    return () => window.clearInterval(timer);
  }, [playing]);

  if (!entries.length) return null;
  const figure = entries[Math.min(selected, entries.length - 1)];

  return <section className="animated-figure-gallery" aria-label={`Animated diagrams for ${topic.title}`}>
    <div className="figure-gallery-heading"><div><span className="tag">ANIMATED FIGURE WALKTHROUGH · {entries.length} SOURCE FIGURE{entries.length===1?'':'S'}</span><h3>Explore the diagrams as working models</h3><p>These interactive models teach the idea represented by each figure caption. The complete course text remains below.</p></div>
      <div className="figure-gallery-controls"><button onClick={()=>{setPlaying(value=>!value);}} aria-label={playing?'Pause animation':'Play animation'}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><button onClick={()=>{setPlaying(false);setStep(0);}} aria-label="Restart diagram animation"><RotateCcw size={15}/></button></div>
    </div>
    {entries.length>1&&<nav className="figure-picker" aria-label="Source figures in this section">
      {entries.map((item,i)=><button key={item.id} type="button" aria-pressed={i===selected} className={i===selected?'selected':''} onClick={()=>{setSelected(i);setStep(0);setPlaying(false);}}><small>FIGURE {item.figure}</small><span>{item.caption}</span></button>)}
    </nav>}
    <article className={`animated-figure model-${figure.model}`}>
      <div className="animated-figure-caption"><span>FIGURE {figure.figure}</span><b>{figure.caption}</b></div>
      {figure.referenceNote&&<p className="figure-reference-note" role="note">Source-label note: {figure.referenceNote}</p>}
      <AnimatedModel key={figure.id} figure={figure} step={step} setStep={setStep} bits={bits} setBits={setBits} logicCells={logicCells} setLogicCells={setLogicCells} address={address} setAddress={setAddress} gate={gate} setGate={setGate}/>
    </article>
  </section>;
}
