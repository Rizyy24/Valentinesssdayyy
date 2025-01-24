/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;

  // Add other env variables as needed
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
