const nlp = require('./nlp');

class Message {
  constructor(text, to, from) {
    this.text = text || '';
    this.to = to || '';
    this.from = from || '';
    this.data = nlp(text);
  }

  get isQuestion() {
    return !!this.questions.length;
  }

  get questions() {
    return this.data.sentences().isQuestion();
  }

  includes(fragment) {
    return this.text.includes(fragment);
  }

  test(regex) {
    return regex.test(this.text);
  }

  match(regex) {
    return this.text.match(regex);
  }
}

module.exports = Message;
