const TelegramBot = require('node-telegram-bot-api');
const token = 'replace me with token from database';
const bot = new TelegramBot(token, {polling: false});
const chatId = 'replace me with chatId from database';

var sendMessage = function(message) {
  bot.sendMessage(chatId, message);
};
