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
    if (await db.schema.hasTable('answerKeyword')) {
      await db.schema.dropTable('answerKeyword');
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
      await db.schema.createTable('answerKeyword', (table) => {
        table.integer('answerId');
        table.integer('keywordId');
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

  async removeAnswer(id) {
    await this.db('answers')
      .where('id', id)
      .del();
    await this.db('answerKeyword')
      .where('answerId', id)
      .del();
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
      .innerJoin('answerKeyword', 'answerKeyword.keywordId', 'keywords.id')
      .where('answerId', answerId);
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

    return this.db('answerKeyword').insert({
      answerId: parseInt(answer.id, 10),
      keywordId: parseInt(keywordId, 10),
      score: 1,
    });
  }

  async getAnswerByKeywords(words) {
    return this.db
      .select('answers.id', 'answers.content', this.db.raw('SUM(answer_keyword.score) as score_sum'))
      .from('answers')
      .innerJoin('answerKeyword', 'answers.id', 'answerKeyword.answerId')
      .innerJoin('keywords', 'keywords.id', 'answerKeyword.keywordId')
      .whereIn('keywords.word', words)
      .groupBy('answers.id')
      .orderBy('scoreSum', 'desc')
      .limit(1)
      .then(this.first);
  }
}

module.exports = Gateway;
