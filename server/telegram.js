const TelegramBot = require('node-telegram-bot-api');
const token = '1575820883:AAFftxksUQhChNjwjq9IIG4uqsjP-_A4TuM';
const bot = new TelegramBot(token, {polling: false});
const myChatId = '1103961555';

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
  bot.sendMessage(chatId, 'Received your message');
});

var sendMessage = function(message) {
  bot.sendMessage(myChatId, message);
};
