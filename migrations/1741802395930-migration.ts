import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1741802395930 implements MigrationInterface {
    name = 'Migration1741802395930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "server" ADD "isRepeat" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "song" DROP CONSTRAINT "FK_c3dd6b6a7f18467e76d9940531b"`);
        await queryRunner.query(`ALTER TABLE "auto_play_buffer" DROP CONSTRAINT "FK_db8662b4b20e514592aba952d24"`);
        await queryRunner.query(`ALTER TABLE "server" ADD CONSTRAINT "UQ_e0f36e315481d640cc1f8e749b7" UNIQUE ("guildId")`);
        await queryRunner.query(`ALTER TABLE "song" ADD CONSTRAINT "FK_c3dd6b6a7f18467e76d9940531b" FOREIGN KEY ("serverGuildId") REFERENCES "server"("guildId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auto_play_buffer" ADD CONSTRAINT "FK_db8662b4b20e514592aba952d24" FOREIGN KEY ("serverGuildId") REFERENCES "server"("guildId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auto_play_buffer" DROP CONSTRAINT "FK_db8662b4b20e514592aba952d24"`);
        await queryRunner.query(`ALTER TABLE "song" DROP CONSTRAINT "FK_c3dd6b6a7f18467e76d9940531b"`);
        await queryRunner.query(`ALTER TABLE "server" DROP CONSTRAINT "UQ_e0f36e315481d640cc1f8e749b7"`);
        await queryRunner.query(`ALTER TABLE "auto_play_buffer" ADD CONSTRAINT "FK_db8662b4b20e514592aba952d24" FOREIGN KEY ("serverGuildId") REFERENCES "server"("guildId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "song" ADD CONSTRAINT "FK_c3dd6b6a7f18467e76d9940531b" FOREIGN KEY ("serverGuildId") REFERENCES "server"("guildId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "server" DROP COLUMN "isRepeat"`);
    }

}
