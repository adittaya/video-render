import React from 'react';
import {interpolate, useCurrentFrame, Easing} from 'remotion';

/* ------------------------------------------------------------------ */
/* Composer UI sequence — B11 (85.0-92.0 s, 210 frames)                */
/* The typing is driven by the FEMALE VOICEOVER's word timings, so the */
/* chat box writes exactly what she says, as she says it.              */
/* ------------------------------------------------------------------ */

const FONT = "'Inter','Helvetica Neue',Arial,'DejaVu Sans',sans-serif";
const SERIF = "'Times New Roman', Georgia, 'DejaVu Serif', serif";
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const CARD_W = 1040;
const CARD_H = 660;

const seg = (f: number, a: number, b: number, easing = false) =>
  interpolate(f, [a, b], [0, 1], {clamp, easing: easing ? ease : undefined});

/* Word timings lifted from vo_02_female_citizen_request_transcription.json,
   converted to B11-local frames (B11 starts at 85.0 s = frame 2550). */
const WORDS: [string, number, number][] = [
  ['I', 14, 16], ['need', 20, 27], ['an', 29, 31], ['agent', 34, 48], ['that', 50, 58],
  ['answers', 62, 76], ['citizens', 77, 93], ['in', 95, 98], ['their', 99, 107],
  ['own', 110, 118], ['language.', 120, 137], ['Here', 173, 177], ['are', 178, 180],
  ['the', 181, 182], ['documents', 184, 199],
];

const Ico: React.FC<{d: string; size?: number; sw?: number; fill?: boolean}> = ({d, size = 22, sw = 2, fill}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const Hand: React.FC<{x: number; y: number; press?: number; opacity?: number}> = ({x, y, press = 0, opacity = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity, transform: `scale(${1 - press * 0.12})`, transformOrigin: '6px 4px', pointerEvents: 'none', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.28))'}}>
    <svg width="40" height="44" viewBox="0 0 24 26">
      <path d="M9 12V5.2a1.7 1.7 0 0 1 3.4 0V11m0-.4V4.2a1.7 1.7 0 0 1 3.4 0V11m0-.6V5.6a1.7 1.7 0 0 1 3.4 0V14c0 4.4-2.6 7.4-7 7.4-3.2 0-5-1.3-6.6-4L3 12.9c-.5-1-.1-2 .9-2.4.9-.3 1.7.1 2.2 1L7.4 14" fill="#fff" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  </div>
);

const Dot3: React.FC<{f: number; from: number}> = ({f, from}) => (
  <span style={{display: 'inline-flex', gap: 5, marginLeft: 8}}>
    {[0, 1, 2].map((i) => {
      const p = Math.sin((f - from) * 0.28 - i * 0.9);
      return <span key={i} style={{width: 7, height: 7, borderRadius: 7, background: '#2f78f0', display: 'inline-block', opacity: 0.35 + 0.65 * Math.max(0, p), transform: `translateY(${-Math.max(0, p) * 2}px)`}} />;
    })}
  </span>
);

export const ComposerSequence: React.FC = () => {
  const f = useCurrentFrame();

  /* --- outline + reveal (before she starts speaking) --- */
  const strokeP = seg(f, 2, 16, true);
  const cardIn = seg(f, 10, 22, true);
  const strokeOut = seg(f, 22, 32, true);

  /* --- typing: reveal each word over its spoken window --- */
  const parts: string[] = [];
  for (const [w, s, e] of WORDS) {
    if (f >= e) parts.push(w);
    else if (f >= s) {
      const k = Math.max(1, Math.ceil(((f - s) / Math.max(1, e - s)) * w.length));
      parts.push(w.slice(0, k));
      break;
    } else break;
  }
  const typed = parts.join(' ');
  const caret = f % 30 < 15 ? 1 : 0;

  /* --- upload + send, timed to the pause and to "Here are the documents" --- */
  const menuIn = seg(f, 152, 164, true);
  const menuOut = seg(f, 176, 184, true);
  const uploadP = seg(f, 176, 188, true);
  const chipIn = seg(f, 176, 188, true);

  const press = interpolate(f, [196, 200, 206], [0, 1, 0], clamp);
  const ring = interpolate(f, [198, 214], [1, 0], clamp);
  const ripple = seg(f, 200, 216, true);
  const shine = seg(f, 198, 216, true);
  const sent = f >= 200;

  /* --- cursor path --- */
  const moveTo = (a: number, b: number, p: [number, number], q: [number, number]) => {
    const t = seg(f, a, b, true);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] as [number, number];
  };
  const PAPERCLIP: [number, number] = [112, 399];
  const PDF_ITEM: [number, number] = [108, 232];
  const SEND: [number, number] = [906, 399];
  let cur: [number, number] = [430, 360];
  let curO = 0;
  if (f >= 137 && f < 152) { cur = moveTo(137, 152, [430, 360], PAPERCLIP); curO = seg(f, 137, 143); }
  else if (f >= 152 && f < 166) { cur = PAPERCLIP; curO = 1; }
  else if (f >= 166 && f < 176) { cur = moveTo(166, 176, PAPERCLIP, PDF_ITEM); curO = 1; }
  else if (f >= 176 && f < 186) { cur = PDF_ITEM; curO = 1 - seg(f, 180, 186); }
  else if (f >= 186 && f < 196) { cur = moveTo(186, 196, PDF_ITEM, SEND); curO = seg(f, 186, 191); }
  else if (f >= 196) { cur = SEND; curO = 1; }

  const status = f >= 202 ? 'Analyzing' : '';

  return (
    <div style={{position: 'relative', width: CARD_W, height: CARD_H, fontFamily: FONT}}>
      {/* outline stroke, ~10% larger than the card */}
      <svg width={CARD_W + 120} height={CARD_H + 120} viewBox={`0 0 ${CARD_W + 120} ${CARD_H + 120}`} style={{position: 'absolute', left: -60, top: -60, opacity: (1 - strokeOut) * (strokeP > 0 ? 1 : 0)}}>
        {(() => {
          const x = 60, y = 60, w = CARD_W, h = CARD_H, r = 40;
          const d = `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y}`;
          const L = 2 * (w + h);
          return <path d={d} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - strokeP)} style={{filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.85)) drop-shadow(0 0 22px rgba(120,160,255,0.55))'}} />;
        })()}
      </svg>

      {/* card */}
      <div style={{position: 'absolute', inset: 0, background: '#fefefe', borderRadius: 22, padding: '58px 58px 38px', boxShadow: '0 34px 90px rgba(18,19,23,0.16)', opacity: cardIn, transform: `scale(${interpolate(cardIn, [0, 1], [0.995, 1])})`}}>
        <div style={{fontFamily: SERIF, fontSize: 60, fontWeight: 400, letterSpacing: '-1.9px', color: '#090909', textAlign: 'center'}}>Let's get to work.</div>

        <div style={{marginTop: 44, background: '#f4f4f4', borderRadius: 43, padding: '10px 10px 10px', position: 'relative', overflow: 'hidden'}}>
          {ripple > 0 && (
            <div style={{position: 'absolute', left: 848, top: 230, width: 10, height: 10, marginLeft: -5, marginTop: -5, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,170,255,0.55), rgba(120,170,255,0) 70%)', transform: `scale(${ripple * 130})`, pointerEvents: 'none'}} />
          )}
          {shine > 0 && shine < 1 && (
            <div style={{position: 'absolute', top: 0, bottom: 0, width: '45%', left: `${-50 + shine * 150}%`, background: 'linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)', pointerEvents: 'none'}} />
          )}

          <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '2px 22px 8px', minHeight: 52}}>
            <span style={{color: '#555'}}><Ico size={22} fill d="M9 2h6v2h3a2 2 0 0 1 2 2v2h1v10h-3v2h-4v2h-4v-2H6v-2H3V8h1V6a2 2 0 0 1 2-2h3V2Zm-2 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm6 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" /></span>
            <span style={{fontSize: 20, color: '#555'}}>Agent</span>
            <span style={{width: 8, height: 8, borderRight: '1.5px solid #666', borderBottom: '1.5px solid #666', transform: 'rotate(45deg) translateY(-3px)'}} />
          </div>

          <div style={{background: '#fff', border: '1.5px solid #d5d5d5', borderRadius: 43, minHeight: 216, padding: '22px 24px 12px', display: 'flex', flexDirection: 'column'}}>
            {!sent ? (
              <div style={{fontSize: 24, lineHeight: 1.5, color: '#222', flex: 1}}>
                {typed}<span style={{opacity: caret}}>|</span>
              </div>
            ) : (
              <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 14}}>
                <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start', background: '#f1f0ee', borderRadius: 12, padding: '9px 14px'}}>
                  <span style={{color: '#c73636'}}><Ico size={18} fill d="M6 2h8l4 4v16H6z" /></span>
                  <span style={{fontSize: 17, color: '#222'}}>Research.pdf</span>
                  <span style={{fontSize: 15, color: '#8d8d8d'}}>2.4 MB</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', fontSize: 20, color: '#3a3a42'}}>
                  {status}<Dot3 f={f} from={202} />
                </div>
              </div>
            )}

            {!sent && chipIn > 0 && (
              <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start', background: '#f1f0ee', borderRadius: 12, padding: '8px 12px', marginTop: 10, opacity: chipIn, transform: `translateY(${(1 - chipIn) * 8}px)`, maxWidth: '100%'}}>
                <span style={{color: '#c73636'}}><Ico size={17} fill d="M6 2h8l4 4v16H6z" /></span>
                <span style={{fontSize: 16, color: '#222'}}>Research.pdf</span>
                <span style={{fontSize: 14, color: '#8d8d8d'}}>{uploadP < 1 ? `${Math.round(uploadP * 100)}%` : '2.4 MB'}</span>
                {uploadP < 1 && <span style={{width: 54, height: 4, borderRadius: 4, background: '#ddd', display: 'inline-block', overflow: 'hidden'}}><span style={{display: 'block', width: 54 * uploadP, height: 4, background: '#2f78f0'}} /></span>}
                <span style={{fontSize: 15, color: '#8d8d8d'}}>×</span>
              </div>
            )}

            <div style={{display: 'flex', alignItems: 'center', gap: 18, minHeight: 54, marginTop: 6}}>
              <span style={{color: '#111'}}><Ico d="M8 12.5v-5a4 4 0 0 1 8 0v8a6 6 0 0 1-12 0V7.8" /></span>
              <span style={{flex: 1}} />
              <span style={{color: '#111'}}><Ico d="M12 3v12M8 7h8M5 13a7 7 0 0 0 14 0M12 20v2" /></span>
              <span style={{width: 54, height: 54, borderRadius: 54, background: press > 0.25 ? '#6a6a6a' : '#909090', display: 'grid', placeItems: 'center', color: '#fff', transform: `scale(${1 - press * 0.12})`, boxShadow: ring > 0 ? `0 0 0 ${10 * (2 - ring)}px rgba(120,170,255,${(0.3 * ring).toFixed(3)})` : 'none'}}>
                <Ico size={25} d="M12 20V4M5.5 10.5 12 4l6.5 6.5" />
              </span>
            </div>
          </div>
        </div>

        <div style={{marginTop: 18, textAlign: 'center', fontSize: 16, color: '#c8c8c8'}}>AI can make mistakes. Please double-check responses.</div>
      </div>

      {/* upload menu */}
      {menuIn > 0 && menuOut < 1 && (
        <div style={{position: 'absolute', left: 86, top: 200, width: 240, background: '#fff', border: '1px solid #e2e2e2', borderRadius: 14, padding: 6, boxShadow: '0 12px 35px rgba(0,0,0,0.14)', opacity: menuIn * (1 - menuOut), transform: `translateY(${(1 - menuIn) * 8 - menuOut * 8}px) scale(${0.98 + menuIn * 0.02})`, transformOrigin: 'bottom left'}}>
          {[['PDF', 'M6 2h8l4 4v16H6z', '#c73636'], ['Docs', 'M5 3h10l4 4v14H5z', '#2f78f0'], ['More files', 'M5 12h.01M12 12h.01M19 12h.01', '#8d8d8d']].map(([label, d, col], i) => (
            <div key={label} style={{display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 9, background: i === 0 && f >= 166 ? '#f4f4f4' : 'transparent'}}>
              <span style={{color: col as string}}><Ico size={18} d={d as string} fill={i < 2} /></span>
              <span style={{fontSize: 17, color: '#333'}}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {curO > 0 && <Hand x={cur[0]} y={cur[1]} press={press} opacity={curO} />}
    </div>
  );
};
