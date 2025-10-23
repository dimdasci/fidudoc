interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string; // Example environment variable
  // Add other environment variables here
  [key: string]: string | undefined;
}

// Dummy usage to satisfy the linter
declare const importMeta: ImportMeta;
void importMeta;
