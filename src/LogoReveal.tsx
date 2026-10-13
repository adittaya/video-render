import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import {MARK_URI, WORD_URI} from './revealAssets';

/* =====================================================================
   LOGO REVEAL — the approved animation, implemented natively in Remotion.
   No external capture step: this is a real composition.

   Obsidian/smoked-glass sphere (analytic ray-sphere, studio softboxes,
   blue-white Fresnel rim, volumetric interior light) -> fine luminous
   filaments leave the sphere and assemble the official Sarvam emblem ->
   the sphere's own light floods the frame into the white background ->
   confident hold.

   Deterministic: every value is a function of the frame index.
   ===================================================================== */

const W = 1920;
const H = 1080;
const S = 1.5;                     // 1280x720 design space -> 1920x1080
const CX = 640 * S;                // 960
const CY = 290 * S;                // 435
const SPHERE_R = 1.5;
const ORB_W = 1280;                // orb render res (upscaled to frame)
const ORB_H = 720;

export const REVEAL_FRAMES = 300;  // 10 s @ 30fps

/* ---------------- maths ---------------- */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const eOut = (x: number) => {
  x = clamp01(x);
  return 1 - Math.pow(1 - x, 4);
};
const eInOut = (x: number) => {
  x = clamp01(x);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};
const mix = (a: number[], b: number[], k: number) => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
const rgb = (c: number[]) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
/* perspective: the tangent silhouette projects to this many px */
const projR = (R: number) => (R * 1.55 / Math.sqrt(9 - R * R)) * (H / 2);

/* Sarvam's visual system: a CONTINUOUS blue -> orange run */
const SPEC = [
  [22, 71, 212],
  [193, 204, 245],
  [241, 197, 170],
  [239, 103, 48],
];
function spectrum(t: number) {
  t = ((t % 1) + 1) % 1;
  const n = SPEC.length - 1;
  const x = t * n;
  const i = Math.min(n - 1, Math.floor(x));
  return mix(SPEC[i], SPEC[i + 1], x - i);
}

/* ---------------- obsidian sphere shader ---------------- */
const ORB_VERT = `
attribute vec2 a_position;
void main(){ gl_Position=vec4(a_position,0.0,1.0); }
`;
const ORB_FRAG = `
precision highp float;
uniform vec2 u_res; uniform vec2 u_centre;
uniform float u_time,uPresence,uSweep,uLift,uExit,uEnvRot,uInner;
float hash(vec3 p){ p=fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0.,0.,0.)),hash(i+vec3(1.,0.,0.)),f.x),
                 mix(hash(i+vec3(0.,1.,0.)),hash(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(hash(i+vec3(0.,0.,1.)),hash(i+vec3(1.,0.,1.)),f.x),
                 mix(hash(i+vec3(0.,1.,1.)),hash(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<3;i++){ s+=a*noise(p);
  p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
float panel(vec3 d, vec3 nrm, vec3 ax, vec3 ay, float sw, float sh, float soft){
  nrm=normalize(nrm); float dz=dot(d,nrm); if(dz<=0.001) return 0.0;
  vec3 px=normalize(ax-nrm*dot(ax,nrm)); vec3 py=normalize(cross(nrm,px));
  float u=dot(d,px)/dz, v=dot(d,py)/dz;
  float m=max(abs(u)/sw, abs(v)/sh);
  return (1.0-smoothstep(1.0-soft,1.0,m))*dz; }
vec3 env(vec3 d){
  vec3 c=mix(vec3(0.008,0.010,0.014), vec3(0.030,0.038,0.054), smoothstep(-0.40,0.95,d.y));
  c+=vec3(0.95,0.97,1.00)*panel(d, vec3(-0.55,0.72,0.42), vec3(0.,1.,0.), vec3(0.,0.,1.), 0.40,0.28, 0.16)*1.30;
  c+=vec3(0.42,0.60,0.95)*panel(d, vec3( 0.85,0.10,0.50), vec3(0.,1.,0.), vec3(0.,0.,1.), 0.065,0.62, 0.14)*0.95;
  c+=vec3(1.00,0.99,0.96)*panel(d, vec3(-0.12,0.92,0.36), vec3(1.,0.,0.), vec3(0.,0.,1.), 0.11,0.11, 0.35)*1.15;
  c+=vec3(0.90,0.58,0.32)*panel(d, vec3(-0.72,-0.30,0.42), vec3(0.,1.,0.), vec3(0.,0.,1.), 0.28,0.20, 0.45)*0.26;
  vec3 b=normalize(vec3(0.0,0.34,-1.0));
  c+=vec3(0.18,0.24,0.38)*pow(max(dot(d,b),0.0),4.0)*0.16;
  vec3 fl=normalize(vec3(-0.15,-0.88,0.40));
  c+=vec3(0.11,0.13,0.17)*pow(max(dot(d,fl),0.0),5.0)*0.55;
  float ev=fbm(d*1.7+3.0)*0.5+0.5;
  c*=0.90+0.20*ev;
  return c; }
void main(){
  vec2 uv=(gl_FragCoord.xy-u_centre)/u_res.y*2.0;
  float R=${SPHERE_R.toFixed(2)}*uPresence;
  vec3 ro=vec3(0.0,0.0,3.0); vec3 rd=normalize(vec3(uv,-1.55));
  float b=dot(ro,rd), c=dot(ro,ro)-R*R, h=b*b-c;
  vec3 col=vec3(0.0); float alpha=0.0;
  if(h>0.0){
    float d=-b-sqrt(h); vec3 p=ro+rd*d; vec3 N=normalize(p/R);
    float imp=(fbm(N*7.0)-0.5)*0.020;
    N=normalize(N+imp);
    float fres=pow(1.0-clamp(dot(N,-rd),0.0,1.0),4.0);
    vec3 Rv=reflect(rd,N);
    float ca=cos(uEnvRot), sa=sin(uEnvRot);
    Rv=vec3(ca*Rv.x-sa*Rv.z, Rv.y, sa*Rv.x+ca*Rv.z);
    vec3 refl=env(Rv);
    vec3 ks=normalize(vec3(-0.62+1.45*uSweep,0.52,0.62));
    float sweep=pow(max(dot(N,ks),0.0),46.0)*0.50;
    float spec=pow(max(dot(N,normalize(vec3(-0.50,0.80,0.45))),0.0),430.0)*2.10;
    float spec2=pow(max(dot(N,normalize(vec3(0.78,0.18,0.50))),0.0),110.0)*0.42;
    float thick=2.0*sqrt(h);
    col=vec3(0.016,0.018,0.028)+refl*0.95
      +fres*vec3(0.58,0.72,0.96)*0.62
      +spec*vec3(1.0)+spec2*vec3(0.62,0.76,1.0)*0.50
      +sweep*vec3(0.80,0.88,1.00);
    col*=1.0-0.34*smoothstep(0.25,1.65,thick)*(1.0-fres);
    float core=exp(-thick*1.15);
    float inN=fbm(N*1.55+vec3(0.0,u_time*0.10,u_time*0.06));
    vec3 innerTint=mix(vec3(0.34,0.54,1.0), vec3(0.95,0.70,0.46), inN*0.55);
    col+=innerTint*core*(0.03+0.10*uInner);
    col+=fres*vec3(0.66,0.78,0.98)*0.16*uInner;
    alpha=1.0;
  } else {
    float dd=length(uv)-R;
    float g=exp(-max(dd,0.0)*9.5)*0.13;
    col=vec3(0.42,0.55,0.82)*g; alpha=g;
  }
  col*=(1.0-uExit*0.92); alpha*=(1.0-uExit*0.92);
  col=clamp(col,0.0,6.0);
  col=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  col+=hash(vec3(gl_FragCoord.xy,floor(u_time*24.0)))*0.016-0.008;
  col=mix(col, col*0.52+vec3(0.26,0.27,0.30), uLift*0.60);
  gl_FragColor=vec4(col,clamp(alpha,0.0,1.0));
}
`;

type Boundary = {x: number; y: number};

/* deterministic PRNG so grain never repeats frame to frame */
function RNG(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbCanvas = useRef<HTMLCanvasElement | null>(null);
  const orbGL = useRef<WebGLRenderingContext | null>(null);
  const orbU = useRef<Record<string, WebGLUniformLocation | null>>({});
  const markInk = useRef<HTMLCanvasElement | null>(null);
  const markWhite = useRef<HTMLCanvasElement | null>(null);
  const wordInk = useRef<HTMLCanvasElement | null>(null);
  const wordWhite = useRef<HTMLCanvasElement | null>(null);
  const boundary = useRef<Boundary[]>([]);
  const [assets, setAssets] = useState<{
    markInk: HTMLCanvasElement;
    markWhite: HTMLCanvasElement;
    wordInk: HTMLCanvasElement;
    wordWhite: HTMLCanvasElement;
  } | null>(null);
  const grain = useRef<HTMLCanvasElement | null>(null);
  const gradeCv = useRef<HTMLCanvasElement | null>(null);
  const bloomCv = useRef<HTMLCanvasElement | null>(null);
  const [init] = useState(() => delayRender('reveal-init'));

  /* ---------- one-time setup ---------- */
  useEffect(() => {
    let cancelled = false;

    /* --- WebGL orb --- */
    const oc = document.createElement('canvas');
    oc.width = ORB_W;
    oc.height = ORB_H;
    orbCanvas.current = oc;
    const gl = oc.getContext('webgl', {alpha: true, antialias: false, premultipliedAlpha: false}) as
      | WebGLRenderingContext
      | null;
    if (gl) {
      const compile = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, ORB_VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, ORB_FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(prog, 'a_position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.viewport(0, 0, ORB_W, ORB_H);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      [
        'u_res',
        'u_centre',
        'u_time',
        'uPresence',
        'uSweep',
        'uLift',
        'uExit',
        'uEnvRot',
        'uInner',
      ].forEach((n) => (orbU.current[n] = gl.getUniformLocation(prog, n)));
      gl.uniform2f(orbU.current.u_res, ORB_W, ORB_H);
      gl.uniform2f(orbU.current.u_centre, ORB_W / 2, ORB_H - (CY * ORB_H) / H);
      orbGL.current = gl;
    }

    /* --- grain + grade + bloom buffers --- */
    const g = document.createElement('canvas');
    g.width = g.height = 512;
    const gx = g.getContext('2d')!;
    const rnd = RNG(987654321);
    const grid = (n: number) => {
      const a = new Float32Array(n * n);
      for (let i = 0; i < n * n; i++) a[i] = rnd();
      return a;
    };
    const samp = (a: Float32Array, n: number, x: number, y: number) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
      const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
      const at = (i: number, j: number) => a[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
      return (
        (at(xi, yi) * (1 - u) + at(xi + 1, yi) * u) * (1 - v) +
        (at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u) * v
      );
    };
    const g1 = grid(48);
    const g2 = grid(96);
    const g3 = grid(192);
    const img = gx.createImageData(512, 512);
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const n =
          samp(g1, 48, (x / 512) * 48, (y / 512) * 48) * 0.5 +
          samp(g2, 96, (x / 512) * 96, (y / 512) * 96) * 0.32 +
          samp(g3, 192, (x / 512) * 192, (y / 512) * 192) * 0.18;
        const l = (n - 0.5) * 2;
        const i = (y * 512 + x) * 4;
        const ch = (rnd() - 0.5) * 0.11;
        img.data[i] = 128 + l * 127 + ch * 127;
        img.data[i + 1] = 128 + l * 127;
        img.data[i + 2] = 128 + l * 127 - ch * 127;
        img.data[i + 3] = 255;
      }
    }
    gx.putImageData(img, 0, 0);
    grain.current = g;

    const gr = document.createElement('canvas');
    gr.width = W;
    gr.height = H;
    gradeCv.current = gr;
    const bl = document.createElement('canvas');
    bl.width = 320;
    bl.height = 180;
    bloomCv.current = bl;

    /* --- marks --- */
    const tint = (im: HTMLImageElement, colour: string) => {
      const o = document.createElement('canvas');
      o.width = im.width;
      o.height = im.height;
      const c = o.getContext('2d')!;
      c.drawImage(im, 0, 0);
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = colour;
      c.fillRect(0, 0, o.width, o.height);
      return o;
    };

    let pending = 2;
    const ready = () => {
      if (cancelled || --pending > 0) return;
      /* emblem silhouette -> filament targets */
      const src = markInk.current!;
      const mw = 96;
      const mh = 95;
      const oc2 = document.createElement('canvas');
      oc2.width = mw;
      oc2.height = mh;
      const c2 = oc2.getContext('2d')!;
      c2.drawImage(src, 0, 0, mw, mh);
      const d = c2.getImageData(0, 0, mw, mh).data;
      const pts: Boundary[] = [];
      for (let y = 1; y < mh - 1; y++) {
        for (let x = 1; x < mw - 1; x++) {
          if (d[(y * mw + x) * 4 + 3] <= 128) continue;
          let edge = false;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            if (d[((y + dy) * mw + (x + dx)) * 4 + 3] <= 128) {
              edge = true;
              break;
            }
          }
          if (edge) pts.push({x: (x - mw / 2) * S + CX, y: (y - mh / 2) * S + CY});
        }
      }
      const step = Math.max(1, Math.floor(pts.length / 72));
      const out: Boundary[] = [];
      for (let m = 0; m < pts.length; m += step) out.push(pts[m]);
      out.sort((a, b) => Math.atan2(a.y - CY, a.x - CX) - Math.atan2(b.y - CY, b.x - CX));
      boundary.current = out;
      setAssets({
        markInk: markInk.current!,
        markWhite: markWhite.current!,
        wordInk: wordInk.current!,
        wordWhite: wordWhite.current!,
      });
      continueRender(init);
    };

    const loadMark = (uri: string) => {
      const im = new Image();
      im.onload = () => {
        markInk.current = tint(im, '#121317');
        markWhite.current = tint(im, '#ffffff');
        ready();
      };
      im.src = uri;
    };
    const loadWord = (uri: string) => {
      const im = new Image();
      im.onload = () => {
        wordInk.current = tint(im, '#121317');
        wordWhite.current = tint(im, '#ffffff');
        ready();
      };
      im.src = uri;
    };
    loadMark(MARK_URI);
    loadWord(WORD_URI);

    return () => {
      cancelled = true;
    };
  }, [init]);

  /* ---------- per-frame draw ---------- */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const h = delayRender('reveal-frame');
    const finish = () => requestAnimationFrame(() => continueRender(h));

    if (!assets || boundary.current.length === 0) {
      finish();
      return;
    }
    const cx = cv.getContext('2d')!;

    /* ---- timeline ---- */
    const pres = eOut(seg(t, 0.15, 1.3));
    const sweep = eInOut(seg(t, 1.3, 2.6));
    const inner = (0.22 + 0.78 * eOut(seg(t, 0.8, 3.0))) * (1 - eOut(seg(t, 5.2, 6.6)) * 0.55);
    const fl = seg(t, 2.6, 5.1);
    const embl = eOut(seg(t, 3.3, 5.2));
    const recede = eOut(seg(t, 5.2, 6.2));
    const word = eOut(seg(t, 5.3, 6.2));
    const wash = eInOut(seg(t, 7.15, 8.6));
    const lift = wash;
    const exit = eInOut(seg(t, 7.3, 8.4));
    const br = 1.0 + 0.012 * Math.sin(t * 0.72);

    cx.setTransform(1, 0, 0, 1, 0, 0);

    /* ---- background ---- */
    const cIn = mix([17, 20, 29], [251, 251, 248], lift);
    const cMid = mix([11, 13, 19], [240, 241, 241], lift);
    const cOut = mix([5, 6, 9], [226, 227, 228], lift);
    const tn = spectrum(0.12 + 0.5 * lift);
    const co = mix(cOut, tn, 0.035 + 0.045 * lift);
    const ci = mix(cIn, tn, 0.01 + 0.02 * lift);
    const gb = cx.createRadialGradient(CX, CY - 105, 60, CX, CY + 135, 1350);
    gb.addColorStop(0, rgb(ci));
    gb.addColorStop(0.45, rgb(cMid));
    gb.addColorStop(1, rgb(co));
    cx.fillStyle = gb;
    cx.fillRect(0, 0, W, H);

    /* ---- camera push-in ---- */
    const sc = (1.0 + 0.035 * eOut(seg(t, 0.6, 6.4))) * br;
    cx.translate(CX, CY);
    cx.scale(sc, sc);
    cx.translate(-CX, -CY);

    /* ---- obsidian sphere ---- */
    const gl = orbGL.current;
    if (gl && orbCanvas.current) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(orbU.current.u_time, t);
      gl.uniform1f(orbU.current.uPresence, pres * (1 - recede * 0.18));
      gl.uniform1f(orbU.current.uSweep, sweep);
      gl.uniform1f(orbU.current.uLift, lift);
      gl.uniform1f(orbU.current.uExit, exit);
      gl.uniform1f(orbU.current.uEnvRot, t * 0.055);
      gl.uniform1f(orbU.current.uInner, inner);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cx.save();
      cx.globalAlpha = pres * (1 - recede * 0.5);
      cx.drawImage(orbCanvas.current, 0, 0, W, H);
      cx.restore();
    }

    /* ---- motivated light transition: the sphere's own light floods ---- */
    if (wash > 0.001) {
      const wr = 165 + wash * 1875;
      const wg = cx.createRadialGradient(CX, CY, 0, CX, CY, wr);
      wg.addColorStop(0, `rgba(255,253,249,${(0.98 * wash).toFixed(3)})`);
      wg.addColorStop(0.5, `rgba(247,248,252,${(0.8 * wash).toFixed(3)})`);
      wg.addColorStop(1, 'rgba(242,244,249,0)');
      cx.fillStyle = wg;
      cx.fillRect(0, 0, W, H);
    }

    /* ---- filaments converge into the emblem ---- */
    const B = boundary.current;
    if (fl > 0.001 && fl < 0.999) {
      const Rs = projR(SPHERE_R) * (1 - recede * 0.18);
      const win = Math.sin(Math.PI * clamp01(fl)) * 0.85 + 0.15;
      cx.lineCap = 'round';
      for (let i = 0; i < B.length; i++) {
        const pt = B[i];
        const ang = Math.atan2(pt.y - CY, pt.x - CX);
        const sx = CX + Math.cos(ang) * Rs;
        const sy = CY + Math.sin(ang) * Rs;
        const mx = (sx + pt.x) / 2;
        const my = (sy + pt.y) / 2;
        const cxp = mx + Math.cos(ang) * 26 * S;
        const cyp = my + Math.sin(ang) * 26 * S;
        const wave = (i / B.length) * 0.55;
        const u = eInOut(clamp01((fl - wave) / (1 - 0.55)));
        if (u <= 0.001) continue;
        const n = Math.max(2, Math.round(18 * u));
        for (let s2 = 0; s2 < n; s2++) {
          const q0 = (s2 / 18) * u;
          const q1 = ((s2 + 1) / 18) * u;
          const x0 = (1 - q0) * (1 - q0) * sx + 2 * (1 - q0) * q0 * cxp + q0 * q0 * pt.x;
          const y0 = (1 - q0) * (1 - q0) * sy + 2 * (1 - q0) * q0 * cyp + q0 * q0 * pt.y;
          const x1 = (1 - q1) * (1 - q1) * sx + 2 * (1 - q1) * q1 * cxp + q1 * q1 * pt.x;
          const y1 = (1 - q1) * (1 - q1) * sy + 2 * (1 - q1) * q1 * cyp + q1 * q1 * pt.y;
          const head = q1 / Math.max(u, 1e-3);
          const a = (0.05 + 0.3 * head * head) * win * (1 - u * 0.35);
          cx.beginPath();
          cx.moveTo(x0, y0);
          cx.lineTo(x1, y1);
          cx.strokeStyle = `rgba(198,216,255,${a.toFixed(3)})`;
          cx.lineWidth = (0.6 + 0.7 * head) * S;
          cx.stroke();
        }
      }
    }

    /* ---- the emblem assembles around the ring ---- */
    const MS = 96 * S;
    if (embl > 0.004 && assets) {
      const drawAt = (img: HTMLCanvasElement, alpha: number, arc?: [number, number]) => {
        cx.save();
        if (arc) {
          cx.beginPath();
          cx.moveTo(CX, CY);
          cx.arc(CX, CY, 130 * S, arc[0], arc[1]);
          cx.closePath();
          cx.clip();
        }
        cx.globalAlpha = alpha;
        cx.drawImage(img, CX - MS / 2, CY - MS / 2, MS, MS);
        cx.restore();
      };
      if (embl > 0.999) {
        drawAt(assets.markInk, embl);
        if (lift < 0.995) drawAt(assets.markWhite, embl * (1 - lift));
      } else {
        const NS = 30;
        const TAU = Math.PI * 2;
        const stepA = TAU / NS;
        for (let s3 = 0; s3 < NS; s3++) {
          const su = eInOut(clamp01((fl - (s3 / NS) * 0.55) / (1 - 0.55)));
          if (su <= 0.002) continue;
          const a0 = -Math.PI + (s3 / NS) * TAU - stepA * 0.5;
          drawAt(assets.markInk, clamp01(su) * embl * 0.62, [a0, a0 + stepA * 2.0]);
          if (lift < 0.995)
            drawAt(assets.markWhite, clamp01(su) * embl * 0.62 * (1 - lift), [a0, a0 + stepA * 2.0]);
        }
      }
    }

    /* ---- wordmark ---- */
    if (word > 0.004 && assets) {
      const wSc = 1.0 + 0.045 * (1 - eOut(word));
      const wy = CY + 154 * S;
      const WW = 202 * S;
      const WH = 32 * S;
      const drawW = (img: HTMLCanvasElement, alpha: number) => {
        cx.save();
        cx.translate(CX, wy);
        cx.scale(wSc, wSc);
        cx.translate(-CX, -wy);
        cx.beginPath();
        cx.rect(CX - 180 * S, wy - 48 * S, 360 * S * eOut(word), 96 * S);
        cx.clip();
        cx.globalAlpha = alpha;
        cx.drawImage(img, CX - WW / 2, wy - WH / 2, WW, WH);
        cx.restore();
      };
      drawW(assets.wordInk, word);
      if (lift < 0.995) drawW(assets.wordWhite, word * (1 - lift));
    }

    cx.setTransform(1, 0, 0, 1, 0, 0);

    /* ---- finishing: whisper of bloom, gentle grade, light grain ---- */
    const bc = bloomCv.current;
    const gr = gradeCv.current;
    const gt = grain.current;
    if (bc && gr && gt) {
      const bx2 = bc.getContext('2d')!;
      bx2.clearRect(0, 0, 320, 180);
      bx2.drawImage(cv, 0, 0, 320, 180);
      cx.save();
      cx.globalCompositeOperation = 'screen';
      cx.globalAlpha = 0.045;
      cx.filter = 'blur(7px) brightness(1.1)';
      cx.drawImage(bc, 0, 0, W, H);
      cx.filter = 'none';
      cx.restore();

      const gctx = gr.getContext('2d')!;
      gctx.clearRect(0, 0, W, H);
      gctx.drawImage(cv, 0, 0);
      cx.clearRect(0, 0, W, H);
      cx.filter = 'contrast(1.10) saturate(1.06) brightness(1.005)';
      cx.drawImage(gr, 0, 0);
      cx.filter = 'none';

      const fr = Math.floor(t * 30);
      const ox = (fr * 97) % 512;
      const oy = (fr * 61) % 512;
      cx.save();
      cx.globalCompositeOperation = 'overlay';
      cx.globalAlpha = 0.032;
      for (let y = -oy; y < H; y += 512)
        for (let x = -ox; x < W; x += 512) cx.drawImage(gt, x, y);
      cx.globalCompositeOperation = 'screen';
      cx.globalAlpha = 0.014;
      for (let y = -((fr * 151) % 512); y < H; y += 512)
        for (let x = -((fr * 83) % 512); x < W; x += 512) cx.drawImage(gt, x, y);
      cx.restore();
    }

    /* ---- vignette ---- */
    const vg = cx.createRadialGradient(CX, CY - 30, 225, CX, CY + 60, 1200);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${(0.2 + 0.32 * (1 - lift)).toFixed(3)})`);
    cx.fillStyle = vg;
    cx.fillRect(0, 0, W, H);

    finish();
  }, [t, frame, fps, assets]);

  /* ---- tagline (DOM) ---- */
  const tagp = eOut(seg(t, 6.2, 7.2));
  const lift = eInOut(seg(t, 7.15, 8.6));
  const tagCol = mix([214, 218, 230], [86, 86, 94], lift);

  return (
    <AbsoluteFill style={{backgroundColor: '#07080a'}}>
      <canvas ref={canvasRef} width={W} height={H} style={{width: '100%', height: '100%'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '68.6%',
          textAlign: 'center',
          color: rgb(tagCol),
          fontFamily: "'Inter','Helvetica Neue',Arial,system-ui,sans-serif",
          fontSize: 38,
          letterSpacing: '0.14em',
          fontWeight: 400,
          opacity: tagp,
          transform: `translateY(${((1 - tagp) * 15).toFixed(2)}px)`,
        }}
      >
        AI for all, from India
      </div>
    </AbsoluteFill>
  );
};
