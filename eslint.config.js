import pluginSecurity from 'eslint-plugin-security';

export default [
  pluginSecurity.configs.recommended,
  {
    rules: {
      'security/detect-object-injection': 'off', // Autorisé pour les maps de clés typées
      'security/detect-non-literal-fs-filename': 'warn',
    },
  },
];
