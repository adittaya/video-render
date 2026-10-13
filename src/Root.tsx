import React from 'react';
import {Composition, Sequence, AbsoluteFill, OffthreadVideo, staticFile} from 'remotion';
import {SarvamFilm} from './Film';

export const REVEAL_FRAMES = 300; // 10s @30fps — the approved logo reveal

const FilmWithReveal: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#07080a'}}>
    <Sequence from={0} durationInFrames={REVEAL_FRAMES}>
      <OffthreadVideo src={staticFile('logo_reveal.mp4')} />
    </Sequence>
    <Sequence from={REVEAL_FRAMES}>
      <SarvamFilm />
    </Sequence>
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
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
