import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1741181710746 implements MigrationInterface {
    name = 'Migration1741181710746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "song" ("id" SERIAL NOT NULL, "songType" text NOT NULL, "url" text NOT NULL, "title" text NOT NULL, "author" text NOT NULL, "thumbnailUrl" text, "duration" text NOT NULL, "ordinal" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "serverGuildId" text, CONSTRAINT "PK_baaa977f861cce6ff954ccee285" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "server" ("guildId" text NOT NULL, "prefix" text NOT NULL DEFAULT 's', "textChannel" text, "voiceChannel" text, "isAutoplay" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_e0f36e315481d640cc1f8e749b7" UNIQUE ("guildId"), CONSTRAINT "PK_e0f36e315481d640cc1f8e749b7" PRIMARY KEY ("guildId"))`);
        await queryRunner.query(`CREATE TABLE "auto_play_buffer" ("id" SERIAL NOT NULL, "url" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "serverGuildId" text, CONSTRAINT "PK_d5e59b92c8f2d407dc014f34bd9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "song" ADD CONSTRAINT "FK_c3dd6b6a7f18467e76d9940531b" FOREIGN KEY ("serverGuildId") REFERENCES "server"("guildId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auto_play_buffer" ADD CONSTRAINT "FK_db8662b4b20e514592aba952d24" FOREIGN KEY ("serverGuildId") REFERENCES "server"("guildId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auto_play_buffer" DROP CONSTRAINT "FK_db8662b4b20e514592aba952d24"`);
        await queryRunner.query(`ALTER TABLE "song" DROP CONSTRAINT "FK_c3dd6b6a7f18467e76d9940531b"`);
        await queryRunner.query(`DROP TABLE "auto_play_buffer"`);
        await queryRunner.query(`DROP TABLE "server"`);
        await queryRunner.query(`DROP TABLE "song"`);
    }

}
