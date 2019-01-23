require('dotenv').config();
const http = require('http');
const { RTMClient } = require('@slack/client');
const Message = require('./src/Message');
const Theo = require('./src/Theo');
const theo = new Theo(process.env);

theo.on(Theo.READY, () => {
  const rtm = new RTMClient(process.env.SLACK_TOKEN);
  rtm.start();

  rtm.on('message', (event) => {
    const message = new Message(
      event.text,
      event.channel,
      event.user,
    );

    theo.emit(Theo.RECEIVED_MESSAGE, message)
  });

  theo.on(Theo.SEND_MESSAGE, (message) => {
    rtm.sendMessage(message.text, message.to);
  });

  console.log('RUNNING!');
});

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write('Hello World!');
  res.end();
});

server.listen(process.env.PORT);

if (process.env.KEEP_ALIVE_URL) {
  setInterval(() => {
    http.get(process.env.KEEP_ALIVE_URL);
  }, 60000);
}
