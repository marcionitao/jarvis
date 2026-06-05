const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Registar .sql como source extension (ajuda Metro a reconhecer imports de .sql).
// A transformação do conteúdo é feita pelo babel-plugin-sql-import.js
// (intercepção ao nível do babel, mais fiável que um Metro transformer).
config.resolver.sourceExts.push('sql');

module.exports = withNativeWind(config, { input: './global.css' });
