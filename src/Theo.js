const EventEmitter = require('events');
const Message = require('./Message');
const Gateway = require('./Gateway');
const Config = require('./Config');
const dbFactory = require('./db');
const DadJokes = require('dadjokes-wrapper');

const MIN_ANSWER_SCORE = 2;

const JOKE = /tell me a joke/;
const ADD_ANSWER = /^theo config add answer: (.+)$/;
const REMOVE_ANSWER = /^theo config remove answer: (\d+)$/;
const LIST_ANSWERS = /^theo config list answers$/;
const LIST_KEYWORDS_FOR_ANSWER = /^theo config list keywords for answer: (\d+)$/;
const ADD_KEYWORD_TO_ANSWER = /^theo config add keyword: (\w+) to answer: (\d+)$/;

class Theo extends EventEmitter {
  constructor(env) {
    super();
    this.id = env.THEO_ID;
    this.db = dbFactory(env.DATABASE_URL);
    this.gateway = new Gateway(this.db);
    this.config = new Config(this.db);
    this.dj = new DadJokes();

    this.init = this.init.bind(this);

    this.gateway.init().then(this.init);
  }

  init() {
    this.on(Theo.RECEIVED_MESSAGE, this.handleMessage.bind(this));

    this.emit(Theo.READY);
  }

  handleMessage(message) {
    if (message.test(ADD_ANSWER)) {
      this.addAnswer(message);
    } else if (message.test(REMOVE_ANSWER)) {
      this.removeAnswer(message);
    } else if (message.test(LIST_ANSWERS)) {
      this.listAnswers(message);
    } else if (message.test(ADD_KEYWORD_TO_ANSWER)) {
      this.addKeywordToAnswer(message);
    } else if (message.test(LIST_KEYWORDS_FOR_ANSWER)) {
      this.listKeywordsForAnswer(message);
    } else if (message.test(JOKE)) {
      this.handleJoke(message);
    } else if (message.isQuestion) {
      this.handleQuestion(message);
    }
  }

  handleResponse(initialMessage, response) {
    if (response) {
      if (response instanceof Message) {
        this.emit(Theo.SEND_MESSAGE, response);
      } else {
        this.emit(Theo.SEND_MESSAGE, new Message(
          response,
          initialMessage.to,
        ));
      }
    }
  }

  async handleQuestion(message) {
    const terms = message.terms.out('array');
    const answer = await this.gateway.getAnswerByKeywords(terms);
    if (answer && answer.scoreSum >= MIN_ANSWER_SCORE) {
      this.handleResponse(message, answer.content);
    } else if (message.includes(`<@${this.id}>`)) {
      this.handleResponse(message, `Sorry I dont know the answer to that yet.`);
    }
  }

  async handleJoke(message) {
    const joke = await this.dj.randomJoke();
    this.handleResponse(message, joke);
  }

  async addAnswer(message) {
    const result = message.match(ADD_ANSWER);
    const answer = result[1];
    await this.gateway.addAnswer(answer);

    this.handleResponse(message, `Added answer: ${answer}`);
  }

  async removeAnswer(message) {
    const result = message.match(REMOVE_ANSWER);
    const answerId = result[1];
    await this.gateway.removeAnswer(answerId);

    this.handleResponse(message, `Removed answer: ${answerId}`);
  }

  async addKeywordToAnswer(message) {
    const result = message.match(ADD_KEYWORD_TO_ANSWER);
    const keyword = result[1];
    const answerId = result[2];
    await this.gateway.addKeywordToAnswer(keyword, answerId);

    this.handleResponse(message, `Added keword: ${keyword} to answer: ${answerId}`);
  }

  async listAnswers(message) {
    const answers = await this.gateway.getAnswers();

    answers.forEach((answer) => (
      this.handleResponse(message, `${answer.id} : ${answer.content}`)
    ));
  }

  async listKeywordsForAnswer(message) {
    const result = message.match(LIST_KEYWORDS_FOR_ANSWER);
    const answerId = result[1];
    const keywords = await this.gateway.getKeywordsForAnswer(parseInt(answerId, 10));

    keywords.forEach((keyword) => (
      this.handleResponse(message, `${keyword.id} : ${keyword.word} : ${keyword.score}`)
    ));
  }
}

Theo.RECEIVED_MESSAGE = 'RECEIVED_MESSAGE';
Theo.SEND_MESSAGE = 'SEND_MESSAGE';
Theo.READY = 'READY';

module.exports = Theo;
