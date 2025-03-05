import 'dotenv/config';

class Config {
  get token(): string {
    return process.env.TOKEN;
  }

  get defaultPrefix(): string {
    return process.env.DEFAULT_PREFIX;
  }

  get clientId(): string {
    return process.env.CLIENT_ID;
  }

  get guildId(): string {
    return process.env.GUILD_ID;
  }

  get isDev(): boolean {
    return process.env.IS_DEV === 'true';
  }

  get database() {
    return {
      userName: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      domain: process.env.DATABASE_DOMAIN,
      port: +process.env.DATABASE_PORT,
      name: process.env.DATABASE_NAME,
    };
  }

  get youtubeCookie() {
    return process.env.YT_COOKIE;
  }
}
export const config = new Config();
