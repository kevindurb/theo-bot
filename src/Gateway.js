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

    // await this.reset();

    if (! await db.schema.hasTable('answers')) {
      await db.schema.createTable('answers', (table) => {
        table.increments();
        table.string('content');
        table.integer('usages');
        table.timestamps();
      });
    }

    if (! await db.schema.hasTable('keywords')) {
      await db.schema.createTable('keywords', (table) => {
        table.increments();
        table.string('word');
        table.timestamps();
      });
    }

    if (! await db.schema.hasTable('answer_keyword')) {
      await db.schema.createTable('answer_keyword', (table) => {
        table.integer('answer_id');
        table.integer('keyword_id');
        table.integer('score');
        table.timestamps();
      });
    }
  }

  first(result) {
    if (result) {
      return result[0];
    }
    return result;
  }

  addAnswer(content) {
    return this.db('answers').insert({
      content,
    });
  }

  getAnswerById(id) {
    return this.db
      .select()
      .from('answers')
      .where('id', id)
      .then(this.first);
  }

  getAnswers() {
    return this.db
      .select()
      .from('answers');
  }

  getKeyword(keyword) {
    return this.db
      .select()
      .from('keywords')
      .where('word', keyword)
      .then(this.first);
  }

  getKeywordsForAnswer(answerId) {
    return this.db
      .select()
      .from('keywords')
      .innerJoin('answer_keyword', 'answer_keyword.keyword_id', 'keywords.id')
      .where('answer_id', answerId);
  }

  addKeyword(word) {
    return this.db('keywords')
      .insert({ word })
      .returning('id');
  }

  async addKeywordToAnswer(keyword, answerId) {
    const answer = await this.getAnswerById(answerId);
    if (!answer) {
      throw new Error('Answer does not exist');
    }

    const existingKeyword = await this.getKeyword(keyword);
    let keywordId = existingKeyword ? existingKeyword.id : 0;
    if (!keywordId) {
      keywordId = await this.addKeyword(keyword);
    }

    return this.db('answer_keyword').insert({
      answer_id: parseInt(answer.id, 10),
      keyword_id: parseInt(keywordId, 10),
      score: 1,
    });
  }
}

module.exports = Gateway;
