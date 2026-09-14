function isLegacyDataCleanupEnabled(env = process.env) {
  return env.RUN_LEGACY_DATA_CLEANUP === 'true';
}

module.exports = { isLegacyDataCleanupEnabled };
