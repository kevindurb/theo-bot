const EventEmitter = require('events');
const Message = require('./Message');
const Gateway = require('./Gateway');
const dbFactory = require('./db');

const ADD_ANSWER = /^theo config add answer: (.+)$/;
const LIST_ANSWERS = /^theo config list answers$/;
const LIST_KEYWORDS_FOR_ANSWER = /^theo config list keywords for answer: (\d+)$/;
const ADD_KEYWORD_TO_ANSWER = /^theo config add keyword: (\w+) to answer: (\d+)$/;

class Theo extends EventEmitter {
  constructor(env) {
    super();
    this.db = dbFactory(env.DATABASE_URL);
    this.gateway = new Gateway(this.db);

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
    } else if (message.test(LIST_ANSWERS)) {
      this.listAnswers(message);
    } else if (message.test(ADD_KEYWORD_TO_ANSWER)) {
      this.addKeywordToAnswer(message);
    } else if (message.test(LIST_KEYWORDS_FOR_ANSWER)) {
      this.listKeywordsForAnswer(message);
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
    // TODO: look to see if i should answer it, then answer it
    this.handleResponse(message, 'Sorry i dont know how to answer that yet!');
  }

  async addAnswer(message) {
    const result = message.match(ADD_ANSWER);
    const answer = result[1];
    await this.gateway.addAnswer(answer);

    this.handleResponse(message, `Added answer: ${answer}`);
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
