declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TOKEN: string;
      DEFAULT_PREFIX: string;
      CLIENT_ID: string;
      GUILD_ID: string;
      IS_DEV: string;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_DOMAIN: string;
      DATABASE_PORT: string;
      DATABASE_NAME: string;
      YT_COOKIE: string;
      HIGH_WATER_MARK: string;
    }
  }
}

export {};
