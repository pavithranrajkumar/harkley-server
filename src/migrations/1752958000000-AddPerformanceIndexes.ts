import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1752958000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1752958000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Indexes for meetings table - most critical for performance
    await queryRunner.query(`CREATE INDEX "IDX_meetings_user_id" ON "meetings" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_meetings_user_status" ON "meetings" ("user_id", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_meetings_created_at" ON "meetings" ("created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_meetings_user_created" ON "meetings" ("user_id", "created_at" DESC)`);

    // Indexes for transcriptions table
    await queryRunner.query(`CREATE INDEX "IDX_transcriptions_meeting_id" ON "transcriptions" ("meeting_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transcriptions_status" ON "transcriptions" ("status")`);

    // Indexes for action_items table
    await queryRunner.query(`CREATE INDEX "IDX_action_items_meeting_id" ON "action_items" ("meeting_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_action_items_status" ON "action_items" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_action_items_priority" ON "action_items" ("priority")`);

    // Indexes for chat_segments table
    await queryRunner.query(`CREATE INDEX "IDX_chat_segments_transcription_id" ON "chat_segments" ("transcription_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_chat_segments_start_time" ON "chat_segments" ("start_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_chat_segments_transcription_start" ON "chat_segments" ("transcription_id", "start_time")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`DROP INDEX "IDX_chat_segments_transcription_start"`);
    await queryRunner.query(`DROP INDEX "IDX_chat_segments_start_time"`);
    await queryRunner.query(`DROP INDEX "IDX_chat_segments_transcription_id"`);

    await queryRunner.query(`DROP INDEX "IDX_action_items_priority"`);
    await queryRunner.query(`DROP INDEX "IDX_action_items_status"`);
    await queryRunner.query(`DROP INDEX "IDX_action_items_meeting_id"`);

    await queryRunner.query(`DROP INDEX "IDX_transcriptions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_transcriptions_meeting_id"`);

    await queryRunner.query(`DROP INDEX "IDX_meetings_user_created"`);
    await queryRunner.query(`DROP INDEX "IDX_meetings_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_meetings_user_status"`);
    await queryRunner.query(`DROP INDEX "IDX_meetings_user_id"`);
  }
}
