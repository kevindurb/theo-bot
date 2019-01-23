class Gateway {
  constructor(db) {
    this.db = db;
  }

  async reset() {
    const db = this.db;
    if (await db.schema.hasTable('answers')) {
      await db.schema.dropTable('answers');
    }
    if (await db.schema.hasTable('keywords')) {
      await db.schema.dropTable('keywords');
    }
    if (await db.schema.hasTable('answer_keyword')) {
      await db.schema.dropTable('answer_keyword');
    }
  }

  async init() {
    const db = this.db;

    await this.reset();

    if (! await db.schema.hasTable('answers')) {
      db.schema.createTable('answers', (table) => {
        table.increments();
        table.string('content');
        table.integer('usages');
        table.timestamps();
      });
    }

    if (! await db.schema.hasTable('keywords')) {
      db.schema.createTable('keywords', (table) => {
        table.increments();
        table.string('word');
        table.timestamps();
      });
    }

    if (! await db.schema.hasTable('answer_keyword')) {
      db.schema.createTable('answer_keyword', (table) => {
        table.integer('answer_id');
        table.integer('keyword_id');
        table.integer('score');
        table.timestamps();
      });
    }
  }
}

module.exports = Gateway;
