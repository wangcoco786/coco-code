/// <reference types="vite/client" />

// CSS Modules
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

// SVG
declare module '*.svg' {
  const src: string
  export default src
}
