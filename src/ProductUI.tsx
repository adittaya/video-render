import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';

/* ------------------------------------------------------------------ */
/* Motion-graphics fragments                                           */
/* Small floating cropped cards + chips — NOT application windows.     */
/* Reference grammar: floating fragment, hero type, big negative space.*/
/* ------------------------------------------------------------------ */

const FONT = "'Inter','Helvetica Neue',Arial,'DejaVu Sans',sans-serif";
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const INK = '#121317';
const SUB = '#5a5a62';
const FAINT = '#9a9aa2';
const ACCENT = '#2f78f0';
const PURPLE = '#55229b';
const OK = '#1f8a5b';

export const Caps: React.FC<{children: React.ReactNode; size?: number; color?: string; weight?: number}> = ({children, size = 14, color = FAINT, weight = 600}) => (
  <div style={{fontFamily: FONT, fontSize: size, letterSpacing: '0.18em', textTransform: 'uppercase', color, fontWeight: weight}}>{children}</div>
);

const Sq: React.FC<{c?: string; s?: number}> = ({c = INK, s = 9}) => (
  <span style={{width: s, height: s, background: c, display: 'inline-block', flex: 'none'}} />
);

/* White floating card — soft elevation, no chrome */
export const WhiteCard: React.FC<{children: React.ReactNode; style?: React.CSSProperties; dark?: boolean}> = ({children, style, dark}) => (
  <div style={{
    background: dark ? '#1e2026' : '#fefefe',
    borderRadius: 20,
    boxShadow: dark ? '0 30px 80px rgba(0,0,0,0.5)' : '0 34px 90px rgba(18,19,23,0.16), 0 2px 8px rgba(18,19,23,0.05)',
    padding: '30px 34px',
    ...style,
  }}>{children}</div>
);

/* Small floating pill */
export const Chip: React.FC<{children: React.ReactNode; tone?: string; dark?: boolean}> = ({children, tone = INK, dark}) => (
  <span style={{
    fontFamily: FONT, fontSize: 20, color: tone,
    background: dark ? 'rgba(255,255,255,0.10)' : '#ffffff',
    border: dark ? '1px solid rgba(255,255,255,0.16)' : '1px solid #e7e7e5',
    padding: '10px 20px', borderRadius: 999, display: 'inline-block',
    boxShadow: dark ? 'none' : '0 10px 26px rgba(18,19,23,0.08)',
  }}>{children}</span>
);

/* ------------------------------------------------------------------ */
/* Indus composer screen (B11) — from the supplied Indus HTML          */
/* ------------------------------------------------------------------ */
const SERIF = "'Times New Roman', Georgia, 'DejaVu Serif', serif";

const Icon: React.FC<{d: string; size?: number; stroke?: boolean}> = ({d, size = 22, stroke = true}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke ? 'none' : 'currentColor'} stroke={stroke ? 'currentColor' : 'none'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const ComposerScreen: React.FC = () => {
  const f = useCurrentFrame();
  const fade = (d: number) => interpolate(f, [d, d + 14], [0, 1], clamp);
  const rise = (d: number) => interpolate(f, [d, d + 14], [18, 0], clamp);
  const text = 'I need an agent that answers citizens in their own language. Here are the documents.';
  const n = Math.floor(interpolate(f, [34, 150], [0, text.length], clamp));
  const caret = f % 30 < 15 ? 1 : 0;
  return (
    <WhiteCard style={{width: 1000, padding: '58px 58px 38px', borderRadius: 26}}>
      <div style={{fontFamily: SERIF, fontSize: 62, fontWeight: 400, letterSpacing: '-1.9px', color: '#090909', textAlign: 'center', opacity: fade(4), transform: `translateY(${rise(4)}px)`}}>
        Let's get to work.
      </div>
      <div style={{marginTop: 46, background: '#f4f4f4', borderRadius: 43, padding: '12px 0 0', opacity: fade(16), transform: `translateY(${rise(16)}px)`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '0 30px 8px', minHeight: 56}}>
          <span style={{color: '#555'}}><Icon size={24} d="M9 2h6v2h3a2 2 0 0 1 2 2v2h1v10h-3v2h-4v2h-4v-2H6v-2H3V8h1V6a2 2 0 0 1 2-2h3V2Zm-2 9a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm6 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" stroke={false} /></span>
          <span style={{fontFamily: FONT, fontSize: 21, color: '#555'}}>Agent</span>
          <span style={{width: 9, height: 9, borderRight: '1.5px solid #666', borderBottom: '1.5px solid #666', transform: 'rotate(45deg) translateY(-3px)'}} />
        </div>
        <div style={{background: '#fff', border: '1.5px solid #d5d5d5', borderRadius: 43, minHeight: 210, padding: '24px 24px 12px', display: 'flex', flexDirection: 'column'}}>
          <div style={{fontFamily: FONT, fontSize: 25, lineHeight: 1.5, color: '#222', flex: 1}}>
            {text.slice(0, n)}<span style={{opacity: caret}}>|</span>
          </div>
          <div style={{display: 'flex', gap: 12, marginTop: 10, opacity: interpolate(f, [150, 172], [0, 1], clamp)}}>
            {['PDF', 'DOC'].map((c, i) => (
              <span key={i} style={{fontFamily: FONT, fontSize: 16, color: '#4a4a52', background: '#f1f0ee', padding: '7px 14px', borderRadius: 9}}>{c}</span>
            ))}
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, minHeight: 56, marginTop: 6}}>
            <span style={{color: '#111'}}><Icon d="M8 12.5v-5a4 4 0 0 1 8 0v8a6 6 0 0 1-12 0V7.8" /></span>
            <span style={{flex: 1}} />
            <span style={{color: '#111'}}><Icon d="M12 3v12M8 7h8M5 13a7 7 0 0 0 14 0M12 20v2" /></span>
            <span style={{width: 56, height: 56, borderRadius: 56, background: '#909090', display: 'grid', placeItems: 'center', color: '#fff'}}>
              <Icon d="M12 20V4M5.5 10.5 12 4l6.5 6.5" size={26} />
            </span>
          </div>
        </div>
      </div>
      <div style={{marginTop: 20, textAlign: 'center', fontFamily: FONT, fontSize: 16, color: '#c8c8c8', opacity: fade(30)}}>
        AI can make mistakes. Please double-check responses.
      </div>
    </WhiteCard>
  );
};

/* ------------------------------------------------------------------ */
/* Cropped transcript fragment (B05)                                   */
/* ------------------------------------------------------------------ */
export const TranscriptFragment: React.FC<{style?: React.CSSProperties}> = ({style}) => {
  const f = useCurrentFrame();
  const fade = (d: number) => interpolate(f, [d, d + 12], [0, 1], clamp);
  const rise = (d: number) => interpolate(f, [d, d + 12], [16, 0], clamp);
  return (
    <WhiteCard style={{width: 700, padding: '26px 30px', ...style}}>
      <Caps size={12}>Live call · Tamil</Caps>
      <div style={{marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16}}>
        <div style={{opacity: fade(10), transform: `translateY(${rise(10)}px)`}}>
          <Img src={staticFile('tamil_line.png')} style={{width: 560, height: 'auto', display: 'block', opacity: 0.8}} />
        </div>
        <div style={{opacity: fade(22), transform: `translateY(${rise(22)}px)`}}>
          <div style={{fontFamily: FONT, fontSize: 19, color: INK}}>Of course — one moment while I verify your account.</div>
        </div>
        <div style={{opacity: fade(34), transform: `translateY(${rise(34)}px)`}}>
          <div style={{fontFamily: FONT, fontSize: 19, color: INK}}>Could you confirm the email you signed up with?</div>
        </div>
      </div>
      <div style={{marginTop: 22, display: 'flex', alignItems: 'flex-end', gap: 3, height: 26, opacity: fade(48)}}>
        {Array.from({length: 34}).map((_, i) => (
          <span key={i} style={{width: 3.5, height: 4 + Math.abs(Math.sin(i * 0.7 + f * 0.06)) * 20, borderRadius: 2, background: ACCENT, opacity: 0.8}} />
        ))}
      </div>
    </WhiteCard>
  );
};

/* ------------------------------------------------------------------ */
/* Cropped artifacts fragment (B09)                                    */
/* ------------------------------------------------------------------ */
export const ArtifactsFragment: React.FC<{style?: React.CSSProperties}> = ({style}) => {
  const f = useCurrentFrame();
  const fade = (d: number) => interpolate(f, [d, d + 12], [0, 1], clamp);
  const rise = (d: number) => interpolate(f, [d, d + 12], [16, 0], clamp);
  const items: [string, string, string][] = [
    ['Endangered-Languages-of-India.docx', '20.7 kB', ACCENT],
    ['Policy-Brief.html', '355.6 kB', PURPLE],
    ['Year-on-Year.docx', '17.8 kB', ACCENT],
  ];
  return (
    <WhiteCard style={{width: 520, padding: '24px 28px', ...style}}>
      <Caps size={12}>Artifacts</Caps>
      <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14}}>
        {items.map(([n, s, c], i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, opacity: fade(14 + i * 12), transform: `translateY(${rise(14 + i * 12)}px)`}}>
            <Sq c={c} s={9} />
            <span style={{fontFamily: FONT, fontSize: 18, color: INK}}>{n}</span>
            <span style={{marginLeft: 'auto', fontFamily: FONT, fontSize: 15, color: FAINT}}>{s}</span>
          </div>
        ))}
      </div>
    </WhiteCard>
  );
};

/* ------------------------------------------------------------------ */
/* Metric cards (B10)                                                  */
/* ------------------------------------------------------------------ */
export const MetricCard: React.FC<{n: string; l: string; style?: React.CSSProperties}> = ({n, l, style}) => (
  <WhiteCard style={{padding: '24px 30px', minWidth: 250, ...style}}>
    <div style={{fontFamily: FONT, fontSize: 54, fontWeight: 600, color: INK, letterSpacing: '-0.02em'}}>{n}</div>
    <div style={{fontFamily: FONT, fontSize: 17, color: FAINT, marginTop: 4}}>{l}</div>
  </WhiteCard>
);

export const TableFragment: React.FC<{style?: React.CSSProperties}> = ({style}) => {
  const f = useCurrentFrame();
  const rows: [string, string][] = [
    ['Alternate verification', 'Passed'],
    ['Guardrail · out of scope', 'Passed'],
  ];
  return (
    <WhiteCard style={{width: 520, padding: '22px 26px', ...style}}>
      <div style={{display: 'flex', paddingBottom: 10, borderBottom: '1px solid #ececeb'}}>
        {['Test', 'Status'].map((h) => <div key={h} style={{flex: h === 'Test' ? 3 : 1, fontFamily: FONT, fontSize: 12, color: '#55555e', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600}}>{h}</div>)}
      </div>
      {rows.map(([a, c], i) => (
        <div key={i} style={{display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: i < rows.length - 1 ? '1px solid #f1f1ef' : 'none', opacity: interpolate(f, [30 + i * 10, 42 + i * 10], [0, 1], clamp)}}>
          <div style={{flex: 3, fontFamily: FONT, fontSize: 17, color: INK}}>{a}</div>
          <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: 8}}>
            <span style={{width: 8, height: 8, borderRadius: 8, background: OK, display: 'inline-block'}} />
            <span style={{fontFamily: FONT, fontSize: 16, color: OK, fontWeight: 500}}>{c}</span>
          </div>
        </div>
      ))}
    </WhiteCard>
  );
};
