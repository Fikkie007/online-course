// Global type declarations

// CSS module declarations
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Allow side-effect imports of CSS
declare module '*.css' {}