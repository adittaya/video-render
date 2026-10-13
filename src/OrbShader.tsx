import React, {useEffect, useRef} from 'react';
import {continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';

/* ------------------------------------------------------------------ */
/* Obsidian / smoked-glass sphere — the APPROVED material.              */
/*                                                                      */
/* Replaces the old chromatic plasma orb. Analytic ray-sphere with a    */
/* procedural studio environment (softbox panels) reflected off the     */
/* normal, a tight blue-white Fresnel rim, two crisp speculars and      */
/* volumetric interior light. No plasma, no noise clouds.               */
/*                                                                      */
/* Deterministic: driven by the frame clock, never wall time.           */
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
uniform float u_energy;

float hash(vec3 p){ p=fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x),f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0.,0.,0.)),hash(i+vec3(1.,0.,0.)),f.x),
                 mix(hash(i+vec3(0.,1.,0.)),hash(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(hash(i+vec3(0.,0.,1.)),hash(i+vec3(1.,0.,1.)),f.x),
                 mix(hash(i+vec3(0.,1.,1.)),hash(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<3;i++){ s+=a*noise(p);
  p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }

/* a softbox: a rectangular light panel, defined by direction + size */
float panel(vec3 d, vec3 nrm, vec3 ax, vec3 ay, float sw, float sh, float soft){
  nrm=normalize(nrm); float dz=dot(d,nrm); if(dz<=0.001) return 0.0;
  vec3 px=normalize(ax-nrm*dot(ax,nrm)); vec3 py=normalize(cross(nrm,px));
  float u=dot(d,px)/dz, v=dot(d,py)/dz;
  float m=max(abs(u)/sw, abs(v)/sh);
  return (1.0-smoothstep(1.0-soft,1.0,m))*dz;
}

/* procedural studio: defined softboxes, not a soft blur */
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
  return c;
}

void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*u_resolution)/u_resolution.y*2.0;
  float R=1.50;
  vec3 ro=vec3(0.0,0.0,3.0);
  vec3 rd=normalize(vec3(uv,-1.55));
  float b=dot(ro,rd), c=dot(ro,ro)-R*R, h=b*b-c;
  vec3 col=vec3(0.0); float alpha=0.0;

  if(h>0.0){
    float d=-b-sqrt(h);
    vec3 p=ro+rd*d;
    vec3 N=normalize(p/R);
    float imp=(fbm(N*7.0)-0.5)*0.020;
    N=normalize(N+imp);

    float fres=pow(1.0-clamp(dot(N,-rd),0.0,1.0),4.0);
    vec3 Rv=reflect(rd,N);
    float ca=cos(u_time*0.055), sa=sin(u_time*0.055);
    Rv=vec3(ca*Rv.x-sa*Rv.z, Rv.y, sa*Rv.x+ca*Rv.z);
    vec3 refl=env(Rv);

    float spec=pow(max(dot(N,normalize(vec3(-0.50,0.80,0.45))),0.0),430.0)*2.10;
    float spec2=pow(max(dot(N,normalize(vec3(0.78,0.18,0.50))),0.0),110.0)*0.42;
    float thick=2.0*sqrt(h);

    col=vec3(0.016,0.018,0.028)
      + refl*0.95
      + fres*vec3(0.58,0.72,0.96)*0.62
      + spec*vec3(1.0)
      + spec2*vec3(0.62,0.76,1.0)*0.50;

    /* interior light living inside the glass */
    float core=exp(-thick*1.15);
    float inN=fbm(N*1.55+vec3(0.0,u_time*0.10,u_time*0.06));
    vec3 innerTint=mix(vec3(0.34,0.54,1.0), vec3(0.95,0.70,0.46), inN*0.55);
    col+=innerTint*core*(0.03+0.10*u_energy);
    col+=fres*vec3(0.66,0.78,0.98)*0.16*u_energy;

    col*=1.0-0.34*smoothstep(0.25,1.65,thick)*(1.0-fres);
    alpha=1.0;
  } else {
    float dd=length(uv)-R;
    float g=exp(-max(dd,0.0)*9.5)*0.13;
    col=vec3(0.42,0.55,0.82)*g; alpha=g;
  }

  col=clamp(col,0.0,6.0);
  col=(col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14);
  col+=hash(vec3(gl_FragCoord.xy,floor(u_time*24.0)))*0.016-0.008;
  gl_FragColor=vec4(col,clamp(alpha,0.0,1.0));
}
`;

export const OrbShader: React.FC<{size: number; energy?: number}> = ({size, energy = 0.55}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uRef = useRef<{time?: WebGLUniformLocation | null; energy?: WebGLUniformLocation | null}>({});
  const [init] = React.useState(() => delayRender('orb-init'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      continueRender(init);
      return;
    }
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    }) as WebGLRenderingContext | null;
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
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      const pos = gl.getAttribLocation(prog, 'a_position');
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.viewport(0, 0, size, size);
      gl.uniform2f(gl.getUniformLocation(prog, 'u_resolution'), size, size);
      uRef.current = {
        time: gl.getUniformLocation(prog, 'u_time'),
        energy: gl.getUniformLocation(prog, 'u_energy'),
      };
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
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
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uRef.current.time ?? null, t);
    /* gentle internal-energy pulse — deterministic, no wall clock */
    gl.uniform1f(uRef.current.energy ?? null, energy * (0.85 + 0.15 * Math.sin(t * 0.9)));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(() => continueRender(h));
  }, [frame, fps, energy]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{width: size, height: size, display: 'block'}}
    />
  );
};
