const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
export const useMockApi = env?.VITE_USE_MOCK_API === 'true';
