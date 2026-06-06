import { describe, expect, it } from 'vitest';
import { getRoleHomeRoute } from './roles';

describe('getRoleHomeRoute', () => {
  it('returns chat route for requestor', () => {
    expect(getRoleHomeRoute('REQUESTOR')).toBe('/chat');
  });

  it('returns agent route for real agent', () => {
    expect(getRoleHomeRoute('REAL_AGENT')).toBe('/agent');
  });

  it('returns dashboard route for admin', () => {
    expect(getRoleHomeRoute('PLATFORM_ADMIN')).toBe('/dashboard');
  });
});