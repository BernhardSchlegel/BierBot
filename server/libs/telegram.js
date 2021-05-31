const TelegramBot = require('node-telegram-bot-api');
var bot;
var chatIds;

module.exports.init = function(token, chatId) {
  bot = new TelegramBot(token, {polling: false});
  chatIds = chatId.split(',');
};

module.exports.sendMessage = function(message) {
  chatIds.forEach(chatId => {
    bot.sendMessage(chatId, message);
  });
};
