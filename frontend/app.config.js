/**
 * Permite sobrescribir apiUrl en builds EAS vía EXPO_PUBLIC_API_URL
 * sin editar app.json en cada deploy.
 */
const appJson = require('./app.json');

module.exports = ({ config }) => {
  const base = appJson.expo;
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL || base.extra?.apiUrl || null;

  return {
    ...config,
    ...base,
    extra: {
      ...base.extra,
      apiUrl,
    },
  };
};
