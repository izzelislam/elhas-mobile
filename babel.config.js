module.exports = {
  presets: [
    ['module:@react-native/babel-preset', {jsxImportSource: 'nativewind'}],
    'nativewind/babel',
  ],
  plugins: [
    ['module-resolver', {root: ['./src'], alias: {'@': './src'}}],
    'react-native-worklets/plugin',
  ],
};
