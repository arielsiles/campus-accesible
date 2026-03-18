const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Fix ProtocolException on Windows emulator: disable multipart bundle responses
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Strip multipart accept header to prevent chunked encoding issues
      if (req.headers && req.headers.accept) {
        req.headers.accept = req.headers.accept.replace(/multipart\/mixed,?\s*/g, '');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
