import React, {useEffect, useRef} from 'react';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';

/* ------------------------------------------------------------------ */
/* Chromatic orb — WebGL shader (ported from the supplied HTML)         */
/* + bubble inclusions, extra texture, and slow inertia "physics".      */
/* Deterministic: driven by the frame clock, not wall time.            */
/* ------------------------------------------------------------------ */

const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){ v_uv = a_position*0.5+0.5; gl_Position = vec4(a_position,0.0,1.0); }
`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform vec2 u_rotation;

float hash(vec3 p){ p=fract(p*0.3183099+vec3(.1,.2,.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float v=0.0,a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec3(13.1,7.7,5.3); a*=.5; } return v; }
mat2 rot(float a){ float s=sin(a),c=cos(a); return mat2(c,-s,s,c); }

void main(){
  vec2 p=(gl_FragCoord.xy-0.5*u_resolution)/min(u_resolution.x,u_resolution.y);
  float radius=0.455;
  float d2=dot(p,p);
  if(d2>radius*radius){ gl_FragColor=vec4(0.0,0.0,0.0,0.0); return; }
  float z=sqrt(max(0.0,radius*radius-d2));
  vec3 n=normalize(vec3(p,z));

  vec3 q=n;
  q.yz=rot(u_rotation.y)*q.yz;
  q.xz=rot(u_rotation.x)*q.xz;
  float t=u_time*0.11;
  vec3 flow=q;
  flow.xy=rot(t*0.45)*flow.xy;
  flow.xz=rot(t*0.27)*flow.xz;

  float macro=fbm(flow*3.7+vec3(0.0,t*0.24,0.0));
  float mid=fbm(flow*8.5+vec3(t*0.19,-t*0.13,t*0.11));
  float fine=fbm(flow*24.0+vec3(-t*0.31,t*0.22,0.0));
  float veins=abs(sin((flow.x*5.0+flow.y*3.0+flow.z*4.0+(macro-0.5)*4.2)*3.2+mid*3.0));
  veins=smoothstep(.58,.97,veins);
  float pigment=clamp(macro*.68+mid*.25+fine*.07,0.0,1.0);

  vec3 deepNavy=vec3(.004,.008,.035);
  vec3 royalBlue=vec3(.018,.12,.78);
  vec3 cobalt=vec3(.015,.36,1.0);
  vec3 ice=vec3(.22,.76,1.0);
  vec3 indigo=vec3(.18,.12,.82);
  vec3 violet=vec3(.53,.045,.95);
  vec3 magenta=vec3(.77,.10,.98);

  float blueMask=smoothstep(-.65,.42,-q.x*.78+q.y*.42+(macro-.5)*.48);
  float purpleMask=smoothstep(-.28,.68,q.x*.83+q.y*.22+(mid-.5)*.62);
  vec3 col=mix(deepNavy,royalBlue,smoothstep(-.7,.28,q.y*.62-q.x*.22+pigment*.45));
  col=mix(col,cobalt,blueMask*.88);
  col=mix(col,indigo,purpleMask*.72);
  col=mix(col,violet,smoothstep(.12,.78,q.x*.72+q.y*.24+(mid-.5)*.75)*.95);
  col=mix(col,ice,smoothstep(.24,.82,-q.x*.86+q.y*.63+(fine-.5)*.3)*.95);
  col=mix(col,magenta,veins*.17*purpleMask);

  /* bubble inclusions: bright soft spheres with a rim highlight */
  float bub=0.0, brim=0.0;
  for(int i=0;i<6;i++){
    float fi=float(i);
    vec3 bc=normalize(vec3(sin(t*0.9+fi*2.1), cos(t*0.7+fi*1.7), sin(t*0.8+fi*3.3)));
    float d=distance(q,bc);
    bub+=smoothstep(0.17,0.02,d);
    brim+=smoothstep(0.12,0.0,abs(d-0.15));
  }
  col=mix(col, vec3(0.58,0.86,1.0), clamp(bub,0.0,1.0)*0.20);
  col+=vec3(0.72,0.92,1.0)*clamp(brim,0.0,1.0)*0.14;

  /* micro texture speckle */
  col+=(fine-.5)*0.03;

  float e=.012;
  float h=fbm((q+vec3(e,0.0,0.0))*15.0+vec3(0.0,t*.2,0.0));
  float hx=fbm((q-vec3(e,0.0,0.0))*15.0+vec3(0.0,t*.2,0.0));
  float hy=fbm((q+vec3(0.0,e,0.0))*15.0+vec3(0.0,t*.2,0.0));
  float hy2=fbm((q-vec3(0.0,e,0.0))*15.0+vec3(0.0,t*.2,0.0));
  vec3 bump=normalize(n+vec3((h-hx)*1.8,(hy-hy2)*1.8,0.0));
  vec3 lightDir=normalize(vec3(-.54,.69,.82)+vec3(u_pointer*.16,0.0));
  float diffuse=max(dot(bump,lightDir),0.0);
  float ambient=.28+.23*max(n.z,0.0);
  col*=ambient+.92*diffuse;

  vec3 viewDir=vec3(0.0,0.0,1.0);
  vec3 halfVec=normalize(lightDir+viewDir);
  float spec=pow(max(dot(bump,halfVec),0.0),52.0);
  float wideSpec=pow(max(dot(bump,halfVec),0.0),9.0);
  col+=vec3(.58,.84,1.0)*spec*.9;
  col+=vec3(.13,.35,.95)*wideSpec*.18;
  float glint=exp(-dot((p-vec2(-.115,.14))*vec2(1.0,1.2),(p-vec2(-.115,.14))*vec2(1.0,1.2))*40.0);
  col+=vec3(.30,.72,1.0)*glint*.24;

  float rim=pow(1.0-max(n.z,0.0),2.25);
  col+=mix(vec3(.0,.54,1.0),vec3(.63,.12,1.0),smoothstep(-.25,.78,q.x))*rim*.32;
  col*=.96+.045*sin(t*2.0+q.x*5.0+q.y*4.0+fine*3.0);
  col=pow(max(col,0.0),vec3(.91));
  gl_FragColor=vec4(col,1.0);
}
`;

export const OrbShader: React.FC<{size: number}> = ({size}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uRef = useRef<{res?: WebGLUniformLocation | null; time?: WebGLUniformLocation | null; ptr?: WebGLUniformLocation | null; rot?: WebGLUniformLocation | null}>({});
  const [init] = React.useState(() => delayRender('orb-init'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      continueRender(init);
      return;
    }
    const gl = canvas.getContext('webgl', {alpha: true, antialias: true, premultipliedAlpha: false}) as WebGLRenderingContext | null;
    if (!gl) {
      continueRender(init);
      return;
    }
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    try {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const pos = gl.getAttribLocation(prog, 'a_position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.viewport(0, 0, size, size);
      gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), size, size);
      uRef.current = {
        time: gl.getUniformLocation(prog, 'u_time'),
        ptr: gl.getUniformLocation(prog, 'u_pointer'),
        rot: gl.getUniformLocation(prog, 'u_rotation'),
      };
      glRef.current = gl;
    } catch (e) {
      // WebGL unavailable -> canvas stays transparent
    }
    continueRender(init);
  }, [init, size]);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    const h = delayRender('orb-frame');
    const t = frame / fps;
    // slow, inertial spin (deterministic)
    const rotY = t * 0.22 + Math.sin(t * 0.31) * 0.18;
    const rotX = Math.sin(t * 0.19) * 0.34;
    gl.uniform1f(uRef.current.time ?? null, t);
    gl.uniform2f(uRef.current.ptr ?? null, 0, 0);
    gl.uniform2f(uRef.current.rot ?? null, rotX, rotY);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(() => continueRender(h));
  }, [frame, fps]);

  return <canvas ref={canvasRef} width={size} height={size} style={{width: size, height: size, display: 'block'}} />;
};
