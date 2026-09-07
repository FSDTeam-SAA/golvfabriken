import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9002",
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              backendUrl: (process.env.MEDUSA_BACKEND_URL || "http://localhost:9002") + "/static",
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/sync",
    },
    {
      resolve: "./src/modules/ops",
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/payment-klarna",
            id: "klarna",
            options: {
              baseUrl: process.env.KLARNA_API_BASE_URL || "https://api.playground.klarna.com",
              username: process.env.KLARNA_USERNAME,
              password: process.env.KLARNA_PASSWORD,
            },
          },
        ],
      },
    },
  ],
})
