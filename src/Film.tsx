import React from 'react';
import {TranscriptFragment, ArtifactsFragment, MetricCard, TableFragment, Chip, ComposerScreen} from './ProductUI';
import {OrbShader} from './OrbShader';
import {ComposerSequence} from './ComposerSequence';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';

/* ------------------------------------------------------------------ */
/* Design tokens (Sarvam brand, measured) + reference-film DNA         */
/* ------------------------------------------------------------------ */
const FONT = "'Inter','Helvetica Neue',Arial,'DejaVu Sans',sans-serif";
const INDIC = "'SarvamDeva','SarvamTamil','SarvamBengali',sans-serif";

const FontFaces: React.FC = () => (
  <style>{`
    @font-face{font-family:'NotoDeva';src:url('${staticFile('fonts/NotoDevanagari.ttf')}') format('truetype');font-display:block;}
    @font-face{font-family:'NotoTamil';src:url('${staticFile('fonts/NotoTamil.ttf')}') format('truetype');font-display:block;}
    @font-face{font-family:'NotoBengali';src:url('${staticFile('fonts/NotoBengali.ttf')}') format('truetype');font-display:block;}
  `}</style>
);
const OFFWHITE = '#f3f3f1';
const PAPER = '#fefefe';
const INK = '#121317';
const BLUE = '#2f78f0';
const PURPLE = '#55229b';
const GREY = '#8a8a8f';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const FadeScene: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 7, dur - 7, dur], [0, 1, 1, 0], clamp);
  // design-led settle: scene eases down from a slight zoom (motion-graphics feel)
  const scale = interpolate(f, [0, 16], [1.035, 1], clamp);
  return <AbsoluteFill style={{opacity, transform: `scale(${scale})`}}>{children}</AbsoluteFill>;
};

const Scene: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => (
  <Sequence from={from} durationInFrames={to - from}>
    <FadeScene dur={to - from}>{children}</FadeScene>
  </Sequence>
);

/* A background layer with a slow, quiet drift (reference motion language) */
const Drift: React.FC<{src?: string; color?: string; dur: number; amount?: number; filter?: string}> = ({src, color, dur, amount = 1.04, filter}) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [0, dur], [1.0, amount], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: color ?? OFFWHITE, overflow: 'hidden'}}>
      {src ? (
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})`, filter}} />
      ) : null}
    </AbsoluteFill>
  );
};

/* Nested rounded-square contour grid (reference motif) */
const ContourGrid: React.FC<{opacity?: number; color?: string}> = ({opacity = 0.95, color = '#c6c3bb'}) => {
  const rings = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <AbsoluteFill style={{opacity}}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        {rings.map((i) => {
          const w = 340 + i * 190;
          const h = 230 + i * 160;
          return <rect key={i} x={960 - w / 2} y={540 - h / 2} width={w} height={h} rx={90 + i * 42} fill="none" stroke={color} strokeWidth={2} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* Scattered soft squares (reference dark-reset motif) */
const SquareField: React.FC<{prog: number}> = ({prog}) => {
  const specs = [
    {x: -300, y: -150, s: 200, r: 40},
    {x: 130, y: -215, s: 150, r: 30},
    {x: 320, y: 70, s: 215, r: 46},
    {x: -70, y: 185, s: 175, r: 36},
    {x: -345, y: 160, s: 125, r: 26},
    {x: 70, y: -30, s: 120, r: 24},
  ];
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      {specs.map((s, i) => {
        const d = (i / specs.length) * 0.45;
        const o = interpolate(prog, [d, d + 0.45], [0, 1], clamp);
        const sc = interpolate(prog, [0, 1], [0.92, 1.06], clamp);
        return <div key={i} style={{position: 'absolute', width: s.s, height: s.s, borderRadius: s.r,
          background: 'rgba(158,158,168,0.15)', filter: 'blur(2px)',
          transform: `translate(${s.x}px, ${s.y}px) scale(${sc})`, opacity: o}} />;
      })}
    </AbsoluteFill>
  );
};

/* Dot-field ring (reference motif) */
const DotRing: React.FC<{radius?: number; n?: number; prog: number}> = ({radius = 250, n = 64, prog}) => {
  const dots = Array.from({length: n});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <svg width="900" height="900" viewBox="-450 -450 900 900">
        {dots.map((_, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const reveal = interpolate(prog, [i / n * 0.6, i / n * 0.6 + 0.4], [0, 1], clamp);
          const x = Math.cos(a) * radius, y = Math.sin(a) * radius;
          return <circle key={i} cx={x} cy={y} r={4.5} fill="#e9e7e4" opacity={reveal} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Caps: React.FC<{children: React.ReactNode; size?: number; color?: string; opacity?: number}> = ({children, size = 22, color = INK, opacity = 1}) => (
  <div style={{fontFamily: FONT, fontSize: size, letterSpacing: '0.18em', textTransform: 'uppercase', color, opacity, fontWeight: 500}}>{children}</div>
);

const Head: React.FC<{children: React.ReactNode; size?: number; weight?: number; color?: string; align?: any; opacity?: number}> = ({children, size = 64, weight = 600, color = INK, align = 'center', opacity = 1}) => (
  <div style={{fontFamily: FONT, fontSize: size, fontWeight: weight, color, textAlign: align, lineHeight: 1.12, letterSpacing: '-0.01em', opacity}}>{children}</div>
);

/* White floating card (reference UI treatment) */
const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{background: PAPER, borderRadius: 22, boxShadow: '0 24px 70px rgba(20,20,30,0.14), 0 2px 6px rgba(20,20,30,0.06)', padding: '38px 46px', ...style}}>{children}</div>
);

/* ------------------------------------------------------------------ */
/* Beats                                                               */
/* ------------------------------------------------------------------ */
const LogoMark: React.FC<{size?: number}> = ({size = 150}) => (
  <Img src={staticFile('logo.png')} style={{width: size, height: size, objectFit: 'contain'}} />
);

const B01: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 200, mass: 0.6}});
  const markScale = interpolate(s, [0, 1], [0.85, 1]);
  const word = interpolate(f, [22, 42], [0, 1], clamp);
  const sub = interpolate(f, [46, 68], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <div style={{transform: `scale(${markScale})`, opacity: interpolate(f, [0, 14], [0, 1], clamp)}}><LogoMark size={140} /></div>
      <div style={{marginTop: 34, fontFamily: FONT, fontSize: 74, fontWeight: 600, color: INK, letterSpacing: '-0.02em', opacity: word}}>Sarvam</div>
      <div style={{marginTop: 12, fontFamily: FONT, fontSize: 30, color: GREY, opacity: sub}}>AI for all, from India.</div>
    </AbsoluteFill>
  );
};

const STATUS = ['Reading a gazette notice', 'Transcribing a call in Tamil', 'Drafting a policy brief', 'Translating to Bengali', 'Checking a calendar'];

const B02: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const orb = spring({frame: f, fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'absolute', transform: `scale(${interpolate(orb, [0, 1], [0.6, 1])})`, opacity: interpolate(f, [24, 64], [0, 1], clamp)}}>
        <OrbShader size={230} />
      </div>
      {STATUS.map((t, i) => {
        const A = [30, 132, 236, 328, 414][i];
        const o = interpolate(f, [A, A + 14], [0, 1], clamp);
        const y = interpolate(f, [A, A + 14], [14, 0], clamp);
        const left = i % 2 === 0;
        return (
          <div key={i} style={{position: 'absolute', [left ? 'left' : 'right']: 240, top: 300 + i * 108, opacity: o, transform: `translateY(${y}px)`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, [left ? 'flexDirection' : 'flexDirection']: 'row'}}>
              <span style={{width: 12, height: 12, background: INK, display: 'inline-block'}} />
              <Caps size={22}>{t}</Caps>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const B03: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [20, 46], [0, 1], clamp);
  const grid = interpolate(f, [0, dur], [0.35, 0.6], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center'}}>
      <ContourGrid opacity={grid} />
      <div style={{opacity: o, textAlign: 'center'}}>
        <Head size={72} weight={600}>Sarvam <span style={{color: '#b9b3c6'}}>— India's full-stack</span></Head>
        <Head size={72} weight={400} color="#6f6a86">sovereign AI platform</Head>
      </div>
    </AbsoluteFill>
  );
};

const B04: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [18, 40], [0, 1], clamp);
  const b = interpolate(f, [98, 120], [0, 1], clamp);
  const win = interpolate(f, [56, 86], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Drift src="bg/cool.png" dur={dur} filter="saturate(0.85) brightness(1.04)" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
        <Head size={78} weight={600} color={PAPER} opacity={a}>India speaks 22 languages.</Head>
        <div style={{height: 16}} />
        <Head size={78} weight={400} color="#e6e4ef" opacity={b}>Most AI speaks one.</Head>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: '50%', bottom: 150, transform: `translateX(-50%) translateY(${interpolate(win, [0, 1], [20, 0])}px)`, opacity: win}}>
        <Card style={{display: 'flex', alignItems: 'center', gap: 18, padding: '22px 30px'}}>
          <span style={{width: 10, height: 10, borderRadius: 10, background: BLUE, display: 'inline-block'}} />
          <span style={{fontFamily: FONT, fontSize: 22, color: INK}}>Listening…</span>
          <Img src={staticFile('indic_line.png')} style={{height: 30, objectFit: 'contain'}} />
        </Card>
      </div>
    </AbsoluteFill>
  );
};

const B05: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [16, 38], [0, 1], clamp);
  const cardIn = interpolate(f, [30, 62], [0.92, 1], clamp);
  const CHIP_A = [62, 104, 136];
  const chips = ['Tools', 'Saaras · 120 ms', 'LLM · 204 ms'];
  return (
    <AbsoluteFill>
      <Drift src="bg/cool.png" dur={dur} filter="saturate(0.8) brightness(0.86)" />
      <AbsoluteFill style={{background: 'radial-gradient(58% 54% at 50% 46%, rgba(255,255,255,0.26), rgba(255,255,255,0) 72%)'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
        <div style={{opacity: a}}><Head size={74} weight={600} color={PAPER}>Gathering context</Head></div>
        <div style={{height: 50}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 90}}>
          <div style={{opacity: interpolate(f, [30, 62], [0, 1], clamp), transform: `scale(${cardIn})`}}>
            <TranscriptFragment />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
            {chips.map((c, i) => (
              <div key={c} style={{opacity: interpolate(f, [CHIP_A[i], CHIP_A[i] + 16], [0, 1], clamp), transform: `translateX(${interpolate(f, [CHIP_A[i], CHIP_A[i] + 16], [20, 0], clamp)}px)`}}>
                <Chip dark>{c}</Chip>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const B06: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [30, 52], [0, 1], clamp);
  const c = interpolate(f, [124, 150], [0, 1], clamp);
  const cy = interpolate(f, [124, 150], [18, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <Head size={66} weight={600} opacity={a}>English-first models miss most of India.</Head>
      <div style={{height: 46}} />
      <div style={{opacity: c, transform: `translateY(${cy}px)`}}>
        <Card><Head size={42} weight={500} color={PURPLE}>Sarvam's models are built for India's languages — from scratch.</Head></Card>
      </div>
    </AbsoluteFill>
  );
};

const B07: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const stages = ['Saaras', 'Sarvam-105B', 'Bulbul'];
  const cap = interpolate(f, [176, 200], [0, 1], clamp);
  const ST_A = [24, 62, 130];
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      {/* M09 ambient dot drift */}
      <AbsoluteFill style={{opacity: 0.55}}>
        {Array.from({length: 26}).map((_, i) => {
          const x = 120 + ((i * 137) % 1680);
          const y = 120 + ((i * 211) % 840);
          const dx = Math.sin(f * 0.012 + i) * 10;
          const dy = Math.cos(f * 0.009 + i * 1.7) * 8;
          return <span key={i} style={{position: 'absolute', left: x + dx, top: y + dy, width: 4, height: 4, borderRadius: 4, background: '#dad7d2'}} />;
        })}
      </AbsoluteFill>
      {/* M07 row-wide settle on "One sovereign stack" */}
      <div style={{display: 'flex', alignItems: 'center', gap: 26, transform: `scale(${interpolate(f, [176, 186, 194], [1, 1.014, 1], clamp)})`}}>
        {stages.map((s, i) => {
          const o = interpolate(f, [ST_A[i], ST_A[i] + 18], [0, 1], clamp);
          const y = interpolate(f, [ST_A[i], ST_A[i] + 18], [24, 0], clamp);
          const pulse = 1 + 0.012 * Math.sin((f - ST_A[i]) * 0.18);
          return (
            <React.Fragment key={s}>
              <div style={{opacity: o, transform: `translateY(${y}px) scale(${o > 0.5 ? pulse : 1})`}}>
                <Card style={{padding: '34px 42px'}}><Head size={40} weight={600}>{s}</Head></Card>
              </div>
              {i < stages.length - 1 ? (
                <svg width="74" height="30" viewBox="0 0 74 30" style={{opacity: interpolate(f, [ST_A[i] + 8, ST_A[i] + 26], [0, 1], clamp)}}>
                  <line x1="4" y1="15" x2="64" y2="15" stroke={GREY} strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset={60 * (1 - interpolate(f, [ST_A[i] + 8, ST_A[i] + 34], [0, 1], clamp))} />
                  <path d="M56 7 L66 15 L56 23" fill="none" stroke={GREY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity={interpolate(f, [ST_A[i] + 28, ST_A[i] + 42], [0, 1], clamp)} />
                </svg>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{marginTop: 56, opacity: cap}}><Caps size={24} color={GREY}>One sovereign stack · Self-hosted in India</Caps></div>
    </AbsoluteFill>
  );
};

const B08: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const prog = interpolate(f, [0, 60], [0, 1], clamp);
  const t = interpolate(f, [24, 46], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Drift src="bg/dark.png" color="#0a0b0d" dur={dur} amount={1.06} />
      <DotRing prog={prog} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <Head size={80} weight={500} color="#f4f3f6" opacity={t}>Sovereign compute.</Head>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const B09: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [12, 30], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center'}}>
      <ContourGrid opacity={interpolate(f, [0, dur], [0.3, 0.55], clamp)} />
      <div style={{display: 'flex', alignItems: 'center', gap: 80}}>
        <div style={{maxWidth: 660}}>
          <div style={{opacity: a}}><Caps size={16} color={BLUE}>Indus Cowork</Caps></div>
          <div style={{marginTop: 20, opacity: interpolate(f, [14, 40], [0, 1], clamp), transform: `translateY(${interpolate(f, [14, 40], [18, 0], clamp)}px)`}}>
            <Head size={78} weight={600} align="left">Give Indus Cowork a task</Head>
          </div>
          <div style={{marginTop: 40, opacity: interpolate(f, [196, 220], [0, 1], clamp)}}>
            <Chip>Voice Agents — 11 Indian languages</Chip>
          </div>
        </div>
        {/* explanation flow: task -> Research -> Analyse -> Present (motion graphics, not a UI demo) */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 26, position: 'relative', paddingLeft: 44}}>
          <div style={{position: 'absolute', left: 50, top: 14, bottom: 14, width: 2, background: '#dedbd6'}} />
          {([['Research', 86, BLUE], ['Analyse', 121, PURPLE], ['Present', 152, BLUE]] as [string, number, string][]).map(([label, at, col]) => (
            <div key={label} style={{display: 'flex', alignItems: 'center', gap: 20, opacity: interpolate(f, [at, at + 14], [0, 1], clamp), transform: `translateX(${interpolate(f, [at, at + 14], [26, 0], clamp)}px)`}}>
              <span style={{width: 14, height: 14, background: col, display: 'inline-block', flex: 'none'}} />
              <span style={{fontFamily: FONT, fontSize: 36, color: INK}}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const B10: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const metrics: [string, (p: number) => string][] = [
    ['uptime SLA', (p) => (99.9 * p).toFixed(1) + '%'],
    ['median latency', (p) => '<' + Math.round(100 * p) + ' ms'],
    ['tokens served', (p) => Math.round(10 * p) + 'B+'],
  ];
  const M = [90, 164, 258];
  const fill = interpolate(f, [24, 84], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      {/* M09 ambient dot drift */}
      <AbsoluteFill style={{opacity: 0.45}}>
        {Array.from({length: 22}).map((_, i) => {
          const x = 140 + ((i * 173) % 1640);
          const y = 120 + ((i * 239) % 840);
          return <span key={i} style={{position: 'absolute', left: x + Math.sin(f * 0.011 + i) * 9, top: y + Math.cos(f * 0.008 + i * 1.6) * 7, width: 4, height: 4, borderRadius: 4, background: '#dad7d2'}} />;
        })}
      </AbsoluteFill>
      <div style={{display: 'flex', alignItems: 'center', gap: 16, opacity: interpolate(f, [24, 46], [0, 1], clamp)}}>
        {/* M02 healthy pulse */}
        <span style={{width: 18, height: 18, background: BLUE, borderRadius: 18, transform: `scale(${1 + 0.09 * Math.sin(f * 0.21)})`}} />
        <Caps size={22} color={BLUE} weight={700}>Evaluation succeeded</Caps>
      </div>
      {/* M05 progress fill */}
      <div style={{marginTop: 20, width: 640, height: 6, borderRadius: 6, background: '#e6e4e0', overflow: 'hidden', opacity: interpolate(f, [30, 46], [0, 1], clamp)}}>
        <div style={{width: `${fill * 100}%`, height: 6, background: BLUE, borderRadius: 6}} />
      </div>
      <div style={{height: 34}} />
      <div style={{display: 'flex', gap: 40}}>
        {metrics.map(([l, fmt], i) => {
          const cp = Math.max(0, Math.min(1, (f - M[i]) / 30));
          const p = 1 - Math.pow(1 - cp, 3);   // ease-out cubic, hard-clamped
          const over = interpolate(f, [M[i] + 30, M[i] + 36, M[i] + 46], [1, 1.022, 1], clamp);
          return (
            <div key={l} style={{opacity: interpolate(f, [M[i], M[i] + 22], [0, 1], clamp), transform: `translateY(${interpolate(f, [M[i], M[i] + 22], [24, 0], clamp)}px) scale(${over})`}}>
              <MetricCard n={fmt(p)} l={l} />
            </div>
          );
        })}
      </div>
      <div style={{height: 46}} />
      <div style={{opacity: interpolate(f, [300, 326], [0, 1], clamp), transform: `translateY(${interpolate(f, [300, 326], [20, 0], clamp)}px)`}}>
        <TableFragment />
      </div>
    </AbsoluteFill>
  );
};

const B11: React.FC<{dur: number}> = ({dur}) => {
  return (
    <AbsoluteFill>
      <Drift src="bg/brand.png" dur={dur} amount={1.05} filter="saturate(0.72) brightness(1.08)" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <ComposerSequence />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const B12: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const portraits = ['05_young_indian_woman_phone_conversation', '06_middle_aged_indian_man_glasses_phone_call', '07_indian_woman_modern_office_smartphone', '08_older_indian_man_outdoors_smartphone'];
  const head = interpolate(f, [8, 32], [0, 1], clamp);
  const sub = interpolate(f, [110, 136], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <div style={{display: 'flex', gap: 18}}>
        {portraits.map((p, i) => {
          const o = interpolate(f, [6 + i * 12, 28 + i * 12], [0, 1], clamp);
          const y = interpolate(f, [6 + i * 12, 28 + i * 12], [40, 0], clamp);
          return <Img key={p} src={staticFile(`portraits/${p}.png`)} style={{width: 250, height: 333, objectFit: 'cover', borderRadius: 16, opacity: o, transform: `translateY(${y}px)`}} />;
        })}
      </div>
      <div style={{marginTop: 46, opacity: head}}><Head size={58} weight={600}>Built for India, at population scale.</Head></div>
      <div style={{marginTop: 16, opacity: sub}}><Caps size={22} color={GREY}>Trusted by UIDAI, NITI Aayog, and India's enterprises</Caps></div>
    </AbsoluteFill>
  );
};

const B13: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [6, 22], [0, 1], clamp);
  const chips = ['Slack', 'Gmail', 'Salesforce', 'Snowflake', 'GitHub', 'Drive'];
  return (
    <AbsoluteFill>
      <Drift src="bg/brand.png" dur={dur} amount={1.03} filter="saturate(0.7) brightness(1.08)" />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
        <div style={{opacity: o}}><Head size={62} weight={600} color={PAPER}>Connect Sarvam to your stack.</Head></div>
        <div style={{display: 'flex', gap: 16, marginTop: 48}}>
          {chips.map((c, i) => (
            <span key={c} style={{fontFamily: FONT, fontSize: 24, color: INK, background: PAPER, padding: '14px 26px', borderRadius: 999, opacity: interpolate(f, [20 + i * 5, 34 + i * 5], [0, 1], clamp)}}>{c}</span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const B14: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  // sequential, non-overlapping phases: headline -> subtitle -> lockup
  const a = interpolate(f, [20, 44, 96, 112], [0, 1, 1, 0], clamp);
  const b = interpolate(f, [106, 130, 190, 204], [0, 1, 1, 0], clamp);
  const lock = interpolate(f, [202, 228], [0, 1], clamp);
  const s = spring({frame: Math.max(0, f - 202), fps, config: {damping: 200}});
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE, justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <ContourGrid opacity={interpolate(f, [0, dur], [0.3, 0.55], clamp)} />
      <div style={{position: 'absolute', top: 430, left: 0, right: 0, textAlign: 'center', opacity: a}}><Head size={66} weight={600}>AI that speaks India's languages.</Head></div>
      <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', opacity: b}}><Head size={50} weight={400} color={GREY}>AI for all, from India.</Head></div>
      <div style={{opacity: lock, transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <LogoMark size={130} />
        <div style={{marginTop: 26, fontFamily: FONT, fontSize: 62, fontWeight: 600, color: INK, letterSpacing: '-0.02em'}}>Sarvam</div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Master timeline                                                     */
/* ------------------------------------------------------------------ */
export const SarvamFilm: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: OFFWHITE}}>
      <Audio src={staticFile('mixed_audio.m4a')} />
      <Scene from={0} to={135}><B01 dur={135} /></Scene>
      <Scene from={135} to={615}><B02 dur={480} /></Scene>
      <Scene from={615} to={795}><B03 dur={180} /></Scene>
      <Scene from={795} to={975}><B04 dur={180} /></Scene>
      <Scene from={975} to={1170}><B05 dur={195} /></Scene>
      <Scene from={1170} to={1455}><B06 dur={285} /></Scene>
      <Scene from={1455} to={1755}><B07 dur={300} /></Scene>
      <Scene from={1755} to={1845}><B08 dur={90} /></Scene>
      <Scene from={1845} to={2145}><B09 dur={300} /></Scene>
      <Scene from={2145} to={2550}><B10 dur={405} /></Scene>
      <Scene from={2550} to={2760}><B11 dur={210} /></Scene>
      <Scene from={2760} to={3030}><B12 dur={270} /></Scene>
      <Scene from={3030} to={3090}><B13 dur={60} /></Scene>
      <Scene from={3090} to={3326}><B14 dur={236} /></Scene>

      {/* global film grain, matching the reference texture */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <Img src={staticFile('grain.png')} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.06, mixBlendMode: 'overlay'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
