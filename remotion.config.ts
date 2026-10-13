import {Config} from '@remotion/cli/config';

// Preview-first settings: fast and light for CI.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(80);
Config.setOverwriteOutput(true);
