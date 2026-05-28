export default ({ env }) => ({
  seo: {
    enabled: true,
  },
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        s3Options: {
          endpoint: env("R2_ENDPOINT"),
          accessKeyId: env("R2_ACCESS_KEY_ID"),
          secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
          region: "auto",
          params: {
            Bucket: env("R2_BUCKET"),
          },
        },
        // R2 does not support ACLs — must be null to skip them.
        params: {
          ACL: null,
          signedUrlExpires: 60 * 60,
        },
        baseUrl: env("R2_PUBLIC_URL"),
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
