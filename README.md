# Discord bot

Install link: https://discord.com/oauth2/authorize?client_id=727482461977575424&permissions=8&integration_type=0&scope=bot

## Available commands
1. **Join** - join in voice channel
2. **Leave** - leave a voice channel
3. **Play** - play audio
4. **Skip** - skip the current track
5. **NowPlaying** - display information about the current track
6. **Clear** - clear the queue
7. **Queue** - display the queue
8. **Move** - move tracks in the queue
9. **Prefix** - set a prefix for command messages
10. **Pause** - pause the current track
11. **Resume** - resume playing the current track
12. **Autoplay** - enable/disable autoplay mode (continue the queue with recommendations)

### Environment
| Name|Default Value|Description|
|----|----|----|
|TOKEN||Discord bot token|
|DEFAULT_PREFIX||Default prefix|
|CLIENT_ID||Bot client ID|
|IS_DEV|true|Development mode|
|DATABASE_USERNAME||Username for bot to access PostgreSQL database|
|DATABASE_PASSWORD||Password for bot to access PostgreSQL database|
|DATABASE_DOMAIN||Database domain|
|DATABASE_PORT|5432|Database port|
|DATABASE_NAME|discord|Database name|
|YT_COOKIE||Cookie from YouTube "browse" request|
|POSTGRES_USER|admin|Database login username|
|POSTGRES_PASSWORD|admin|Database login password|
|POSTGRES_DB|discord|Database name|
|PGADMIN_DEFAULT_EMAIL||Email for logging into pgAdmin|
|PGADMIN_DEFAULT_PASSWORD||Password for logging into pgAdmin|

### Requirements
**Nodejs**: 22.14.0 or above
**Python**: 2.7
**ffmpeg**: any

### Development
1. Run `docker-compose up -d` in `local-database` directory
2. Fill environment values
2. Run `pnpm start`

### Build 
1. Fill environment values
2. Run `docker-compose up -d`
