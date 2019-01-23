const nlp = require('./nlp');

class Message {
  constructor(text, to, from) {
    this.text = text || '';
    this.to = to || '';
    this.from = from || '';
    this.data = nlp(text);
  }

  get questions() {
    return this.data.sentences().isQuestion();
  }
}

module.exports = Message;
