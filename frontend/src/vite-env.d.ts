/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_USE_MOCK_API: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
