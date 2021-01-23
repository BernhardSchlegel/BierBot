const TelegramBot = require('node-telegram-bot-api');
var bot;
var chatId;

module.exports.init = function(token, id) {
  bot = new TelegramBot(token, {polling: false});
  chatId = id;
};

module.exports.sendMessage = function(message) {
  bot.sendMessage(chatId, message);
};
