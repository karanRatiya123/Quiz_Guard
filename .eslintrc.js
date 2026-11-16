// ESLint 8 (the version Expo SDK 52 pins) uses the legacy config format.
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*', '/android/*', '/ios/*', '/.expo/*'],
};
