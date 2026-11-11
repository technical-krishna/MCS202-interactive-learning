import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Sparkles } from 'lucide-react';
import InteractiveLab from './InteractiveLab.jsx';
import GuidedReader from './GuidedReader.jsx';
import AnimatedFigureGallery from './AnimatedFigureGallery.jsx';

function ideaFrom(text) {
  const lines=text.replace(/\f/g,'\n').split('\n').map(x=>x.trim()).filter(Boolean);
  const paragraphs=[];let current=[];
  for(const line of lines){
    if(/^\d+(?:\.\d+)+\.?\s+/.test(line)&&!current.length)continue;
    if(/^\d{1,3}$/.test(line)||/^Figure\s+\d|^Check Your Progress|^Objectives$/i.test(line))continue;
    current.push(line);
    if(/[.!?]$/.test(line)&&current.join(' ').length>140){paragraphs.push(current.join(' '));current=[];if(paragraphs.length===2)break;}
  }
  if(current.length&&paragraphs.length<2)paragraphs.push(current.join(' '));
  return paragraphs.join('\n\n')||'Use the interactive model first, then open the complete section below to work through the explanation and examples.';
}

export default function LessonView({unit,topic,topics,onClose,onSelect,isMastered,onToggleMastery}){
  useEffect(()=>{document.getElementById('lesson-detail')?.scrollIntoView({behavior:'smooth',block:'start'})},[topic?.id]);
  const index=topics.findIndex(x=>x.id===topic.id),coreIdea=useMemo(()=>ideaFrom(topic.text),[topic]);
  return <section id="lesson-detail" className="lesson-detail">
    <div className="lesson-detail-head"><div><span className="tag">GUIDED LESSON · SECTION {topic.id}</span><h2>{topic.title}</h2><p>Start with the model, test your understanding, then study the complete section.</p></div><button className="iconbtn" aria-label="Close lesson" onClick={onClose}>×</button></div>
    <div className="from-zero"><span><Sparkles size={15}/> FIRST PASS</span><p>{coreIdea}</p></div>
    <AnimatedFigureGallery unit={unit} topic={topic}/>
    <InteractiveLab key={`${unit}-${topic.id}`} unit={unit} topic={topic}/>
    <GuidedReader key={`reader-${topic.id}`} topic={topic}/>
    <details className="deep-dive">
      <summary><BookOpen size={17}/> Complete explanation and examples <ChevronDown size={16}/></summary>
      <p className="deep-dive-note">Full section text, kept intact so definitions, worked examples, tables, and checks are available while you learn.</p>
      <pre>{topic.text}</pre>
    </details>
    <div className="lesson-detail-footer"><div className="lesson-footer-actions"><button className={`mastery-toggle ${isMastered?'mastered':''}`} onClick={onToggleMastery}><Check size={15}/>{isMastered?'Marked mastered':'Mark topic mastered'}</button><div><button disabled={index===0} onClick={()=>onSelect(topics[index-1])}><ArrowLeft size={15}/> Previous topic</button><button disabled={index===topics.length-1} onClick={()=>onSelect(topics[index+1])}>Next topic <ArrowRight size={15}/></button></div></div></div>
  </section>;
}
