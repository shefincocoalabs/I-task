module.exports = (app) => {
    const chats = require('../controllers/chat.controller.js');
    app.get('/chat',chats.chat);
    app.get('/chats',chats.getChat);
} 