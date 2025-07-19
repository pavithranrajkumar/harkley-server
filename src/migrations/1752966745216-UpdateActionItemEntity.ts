import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateActionItemEntity1752966745216 implements MigrationInterface {
  name = 'UpdateActionItemEntity1752966745216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "action_items" DROP COLUMN "speaker_number"`);
    await queryRunner.query(`ALTER TABLE "action_items" DROP COLUMN "assignee"`);
    await queryRunner.query(`ALTER TABLE "action_items" ADD "speaker" character varying`);

    // Add created_by as nullable first, then update existing records, then make it NOT NULL
    await queryRunner.query(`ALTER TABLE "action_items" ADD "created_by" character varying`);

    // Update existing action items to have a default created_by value
    // We'll use the meeting's userId as the created_by value
    await queryRunner.query(`
            UPDATE "action_items" 
            SET "created_by" = (
                SELECT "user_id" 
                FROM "meetings" 
                WHERE "meetings"."id" = "action_items"."meeting_id"
            )
        `);

    // Now make created_by NOT NULL
    await queryRunner.query(`ALTER TABLE "action_items" ALTER COLUMN "created_by" SET NOT NULL`);

    await queryRunner.query(`DROP INDEX "public"."IDX_meetings_user_status"`);
    await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "status" SET DEFAULT 'processing'`);
    await queryRunner.query(`CREATE INDEX "IDX_action_items_created_by" ON "action_items" ("created_by") `);
    await queryRunner.query(`CREATE INDEX "IDX_action_items_speaker" ON "action_items" ("speaker") `);
    await queryRunner.query(`CREATE INDEX "IDX_meetings_user_status" ON "meetings" ("user_id", "status") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_meetings_user_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_action_items_speaker"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_action_items_created_by"`);
    await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "status" SET DEFAULT 'active'`);
    await queryRunner.query(`CREATE INDEX "IDX_meetings_user_status" ON "meetings" ("status", "user_id") `);
    await queryRunner.query(`ALTER TABLE "action_items" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "action_items" DROP COLUMN "speaker"`);
    await queryRunner.query(`ALTER TABLE "action_items" ADD "assignee" character varying`);
    await queryRunner.query(`ALTER TABLE "action_items" ADD "speaker_number" integer`);
  }
}
