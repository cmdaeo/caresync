import * as React from 'react';
import { string } from 'three/src/nodes/TSL.js';

// Define the exact props you need
type ModelViewerElement = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  'camera-controls'?: boolean | string;
  'interaction-prompt'?: string;
  'environment-image'?: string;
  'auto-rotate'?: boolean | string;
  'auto-rotate-delay'?: string | number;
  'rotation-per-second'?: string;
  'tone-mapping'?: string;
  exposure?: string | number;
  loading?: string;
  'min-camera-orbit'?: string;
  'max-camera-orbit'?: string;
  'camera-orbit'?: string;
  orientation?: string;
};

// 1. Augment for standard/older setups
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}

// 2. Augment specifically for React 18+ with "jsx": "react-jsx"
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}