const nlp = require('./nlp');

class Message {
  constructor(text, to, from) {
    this.text = text || '';
    this.to = to || '';
    this.from = from || '';
    this.data = nlp(text).normalize();
  }

  get isQuestion() {
    return !!this.questions.length;
  }

  get questions() {
    return this.data.sentences().isQuestion();
  }

  get topics() {
    return this.data.topics();
  }

  get terms() {
    return this.data.terms();
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
