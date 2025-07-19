import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMeetingIndexes1752973953209 implements MigrationInterface {
    name = 'AddMeetingIndexes1752973953209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_meetings_user_status_created" ON "meetings" ("user_id", "status", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_meetings_status" ON "meetings" ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_meetings_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_meetings_user_status_created"`);
    }

}
