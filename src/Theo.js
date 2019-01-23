const EventEmitter = require('events');
const Message = require('./Message');
const Gateway = require('./Gateway');
const dbFactory = require('./db');

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
    console.log(message);
    console.log(message.questions.out('text'));
    // TODO: this
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
}

Theo.RECEIVED_MESSAGE = 'RECEIVED_MESSAGE';
Theo.SEND_MESSAGE = 'SEND_MESSAGE';
Theo.READY = 'READY';

module.exports = Theo;
