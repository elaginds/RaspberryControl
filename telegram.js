process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const Agent = require('socks5-https-client/lib/Agent');
const control = require('./control');
const config = require('./config');
const api = require('./api');

/* Бот, который все и делает
 * Инициализируется в  createTelegramBot*/
let bot = null;

/* Отправлять ли пришедшие данные INFO в чат
* изменяется в doCheck*/
let doCheck = false;

/* ID чата, приходит при каждом входящем запросе */
let chatId = null;

/* Информация по закачкам,
 * приходит из sendInfo */
let info = ['Нет активных закачек'];

/* Отправляем список завершенных закачек */
module.exports.sendCompleted = function(names, id) {
    if (!id) {
        return false;
    }

    createTelegramBot(id);

    bot.sendMessage(chatId, `Ура! завершилось скачивание: \n ${names.join('\n')}`);
};

/* Сохраняем список закачек в info,
 * если активно doCheck - отправляем в телеграмм */
module.exports.sendInfo = function(tr_info, id) {
    if (!id) {
        return false;
    }

    createTelegramBot(id);

    if (tr_info && tr_info.length) {

        const newTorrents = separateNewTorrents(tr_info);

        if (newTorrents.length) {
            bot.sendMessage(chatId, `Добавлен новый торрент: \n ${newTorrents.join('\n')}`);
        }

        info = tr_info;
    } else {
        info = ['Нет активных закачек'];
    }

    if (doCheck) {
        onInfo();
    }
};

/* Запускаем бота и вешаем реакцию на входящие сообщения */
module.exports.createTelegramBot = function(token) {
    if (!bot && token) {
        bot = new TelegramBot(token, createOptions());

        bot.on('message', (msg) => {
            chatId = msg['chat']['id'];

            if (msg.text.indexOf('/hello') === 0) {
                onHello();
            } else if (msg.text.indexOf('/hostname') === 0) {
                control.getHostname(sendAnswer);
            } else if (msg.text.indexOf('/wake') === 0) {
                control.getWake(msg.text.substr(6), sendAnswer);
            } else if (msg.text.indexOf('/temp') === 0) {
                control.getTemperature(sendAnswer);
            } else if (msg.text.indexOf('/mount') === 0) {
                control.mount(sendAnswer);
            }

        });
    }
};

function sendAnswer(data) {
    console.log('answer', data);
    bot.sendMessage(chatId, String(data));
}

/* Создаем настройку для подключения телеграмма */
function createOptions() {

    const options = {
        polling: true
    };

    if (config && config.proxy_host && config.proxy_port) {
        options.request = {
            agentClass: Agent,
                agentOptions: {
                    socksHost: config.proxy_host,
                    socksPort: config.proxy_port
                }
        };

        if (config.proxy_username && config.proxy_password) {
            options.request.socksUsername = config.proxy_username;
            options.request.socksPassword = config.proxy_password;
        }
    }

    return options;
}

/* ПРоверяет, появились ли новые закачки */
function separateNewTorrents(tr_info) {
    let newTorrents = [];

    tr_info.forEach(newItem => {
        let flag = false;
        info.forEach(oldItem => {
            const oldName = oldItem.substr(0, oldItem.indexOf(' '));
            const newName = oldItem.substr(0, newItem.indexOf(' '));
            if (oldName === newName) {
                flag = true;
            }
        });
        if (flag === false) {
            newTorrents.push(newItem);
        }
    });

    return newTorrents;
}

/* Получили /hello - отправляем сообщение,
 * нужно только чтобы запоминать ID чата без действий */
function onHello() {
    bot.sendMessage(chatId, 'Я тебя запомнил.');
}

/* Получили /info - отправили INFO в ответ */
function onInfo() {
    bot.sendMessage(chatId, info.join('\n'));
}

/* Получили /check - начали или закончили
 * периодически посылать в чат INFO */
function onCheck() {
    doCheck = !doCheck;

    bot.sendMessage(chatId, `${(doCheck ? 'НАЧАЛИ' : 'ЗАКОНЧИЛИ')} периодическую проверку`);
}

/* Получили /magnet - начали закачку по этой ссылки и прислали ответ в чат */
function onMagnet(magnet) {
    api.setMagnet(magnet)
        .then(body => {
            if (body && body.result === 'success') {
                bot.sendMessage(chatId, 'Торрент добавлен успешно');
            } else if (body && body.result){
                bot.sendMessage(chatId, `Ошибка - ${body.result}`);
            } else {
                bot.sendMessage(chatId, `Произошла неизвестная ошибка`);
            }
        });
}