declare namespace JSX {
  interface IntrinsicElements {
    'pet-render': {
      url: string;
      reverse?: boolean;
      scale?: string;
    } & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

interface PetRenderElement extends HTMLElement {
  play(): void;
  pause(): void;
  stop(): void;
  setState(state: string): void;
  getState(): string;
  getAvailableStates(): string[];
  whenReady(): Promise<void>;
  addEventListener(type: 'ready'|'animationComplete'|'hit', listener: (event: CustomEvent) => void, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: 'ready'|'animationComplete'|'hit', listener: (event: CustomEvent) => void, options?: boolean | EventListenerOptions): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'pet-render': PetRenderElement;
  }
}
