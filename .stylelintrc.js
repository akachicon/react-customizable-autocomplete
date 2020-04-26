const rationalOrder = require('stylelint-rational-order');

module.exports = {
  ignoreFiles: ['!**/*.css', '!**/*.scss'],
  extends: ['stylelint-config-recommended-scss'],
  plugins: ['stylelint-scss', 'stylelint-order'],
  rules: {
    'string-quotes': 'single',
    'order/order': [
      {
        type: 'at-rule',
        hasBlock: false,
      },
      'dollar-variables',
      'custom-properties',
      'declarations',
      'rules',
      {
        type: 'at-rule',
        hasBlock: true,
      },
    ],
    'order/properties-order': rationalOrder(),
  },
};
