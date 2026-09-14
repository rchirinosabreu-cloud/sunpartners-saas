import { describe, expect, it } from 'vitest';
import { isLegacyDataCleanupEnabled } from '../utils/bootstrapPolicy';

describe('bootstrap legacy data cleanup policy', () => {
  it('is disabled when the opt-in variable is absent', () => {
    expect(isLegacyDataCleanupEnabled({})).toBe(false);
  });

  it('is disabled for truthy-looking values other than the exact opt-in', () => {
    expect(isLegacyDataCleanupEnabled({ RUN_LEGACY_DATA_CLEANUP: '1' })).toBe(false);
    expect(isLegacyDataCleanupEnabled({ RUN_LEGACY_DATA_CLEANUP: 'TRUE' })).toBe(false);
  });

  it('runs only after an explicit lowercase true opt-in', () => {
    expect(isLegacyDataCleanupEnabled({ RUN_LEGACY_DATA_CLEANUP: 'true' })).toBe(true);
  });
});
