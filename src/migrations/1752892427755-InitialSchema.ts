import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1752892427755 implements MigrationInterface {
    name = 'InitialSchema1752892427755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "action_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "meeting_id" uuid NOT NULL, "speaker_number" integer, "description" text NOT NULL, "assignee" character varying, "due_date" TIMESTAMP, "priority" character varying NOT NULL DEFAULT 'medium', "status" character varying NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a84b168b001636b379312104ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "meetings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "duration" integer, "file_size" integer, "file_path" character varying NOT NULL, "summary" character varying, "status" character varying NOT NULL DEFAULT 'active', "user_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_aa73be861afa77eb4ed31f3ed57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_segments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transcription_id" uuid NOT NULL, "speaker_number" integer NOT NULL, "text" text NOT NULL, "start_time" integer NOT NULL, "end_time" integer NOT NULL, "confidence" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e803bb6a14a5120e1e4fff48f91" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transcriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "meeting_id" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'completed', "full_text" text NOT NULL, "summary" character varying, "confidence" integer, "language" character varying NOT NULL DEFAULT 'en', "word_count" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cba8a0264bdf2680c0d93fc7d17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "action_items" ADD CONSTRAINT "FK_8f5712e4d1a50ebf15896257021" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_segments" ADD CONSTRAINT "FK_fa3ef40419a1cb09ec01168105e" FOREIGN KEY ("transcription_id") REFERENCES "transcriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transcriptions" ADD CONSTRAINT "FK_25f6ba925f13ecd2edc3c5e5a40" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transcriptions" DROP CONSTRAINT "FK_25f6ba925f13ecd2edc3c5e5a40"`);
        await queryRunner.query(`ALTER TABLE "chat_segments" DROP CONSTRAINT "FK_fa3ef40419a1cb09ec01168105e"`);
        await queryRunner.query(`ALTER TABLE "action_items" DROP CONSTRAINT "FK_8f5712e4d1a50ebf15896257021"`);
        await queryRunner.query(`DROP TABLE "transcriptions"`);
        await queryRunner.query(`DROP TABLE "chat_segments"`);
        await queryRunner.query(`DROP TABLE "meetings"`);
        await queryRunner.query(`DROP TABLE "action_items"`);
    }

}
