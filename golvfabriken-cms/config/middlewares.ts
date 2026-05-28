export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            'https://media.golvfabriken.se',
            'https://media-staging.golvfabriken.se',
            'https://6af4bc7f4683fd93044ad6ee56ce3f60.r2.cloudflarestorage.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'https://media.golvfabriken.se',
            'https://media-staging.golvfabriken.se',
            'https://6af4bc7f4683fd93044ad6ee56ce3f60.r2.cloudflarestorage.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'sameorigin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
