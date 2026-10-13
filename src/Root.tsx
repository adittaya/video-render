import React from 'react';
import {Composition, Sequence, AbsoluteFill} from 'remotion';
import {SarvamFilm} from './Film';
import {LogoReveal, REVEAL_FRAMES} from './LogoReveal';

/* The approved logo reveal is now a real composition in this project —
   no external capture step. It plays first, then the film. The film sits
   inside a <Sequence>, so its internal frame clock (and therefore the
   audio, which is the master clock) still starts at 0. */
const FilmWithReveal: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#07080a'}}>
    <Sequence from={0} durationInFrames={REVEAL_FRAMES}>
      <LogoReveal />
    </Sequence>
    <Sequence from={REVEAL_FRAMES}>
      <SarvamFilm />
    </Sequence>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="LogoReveal"
      component={LogoReveal}
      durationInFrames={REVEAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="SarvamFilm"
      component={SarvamFilm}
      durationInFrames={3326}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="FilmWithReveal"
      component={FilmWithReveal}
      durationInFrames={3326 + REVEAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
