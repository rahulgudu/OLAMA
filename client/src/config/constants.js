export const APP_NAME = "Nexus AI";

// Localhost URL for Mac development
export const API_BASE_URL = "http://localhost:8000";

// GitHub Codespaces URL (Keep commented out for reference)
// export const API_BASE_URL = "https://zany-spoon-pvjgxjr6g6vf7q7q-8000.app.github.dev";

export const DEFAULT_MODEL = "phi4-mini";

export const AVAILABLE_MODELS = [
  { id: 'phi4-mini', name: 'Phi-4 Mini (3.8B - Recommended)' },
  { id: 'qwen2.5:0.5b', name: 'Qwen 2.5 (Fast & Light)' }
];