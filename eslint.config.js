import ashNazg from 'eslint-config-ash-nazg';

export default [
  {
    ignores: [
      'options/jml.js',
      'polyfills/browser-polyfill.min.js'
    ]
  },
  ...ashNazg(['sauron', 'browser']),
  {
    languageOptions: {
      globals: {
        browser: 'readonly'
      }
    }
  }
];
