let config = require('./config');
const telegram = require('./telegram');
// const util = require('util');
// const { exec } = util.promisify(require('child_process').exec);
// const { spawn } = require( 'child_process' );
const nrc = require('node-run-cmd');

const get_temp = 'hostname';
// const get_temp = 'vcgencmd measure_temp';


module.exports.start = function() {
    if (!verifyConfig()) {
        return false;
    }

    telegram.createTelegramBot(config.telegramid);

    return true;
};

module.exports.getTemperature = function(callback) {
    runScript(get_temp, callback);
};

function runScript(text, callback) {
    console.log(text, callback);
    nrc.run(text, {}).then( (data) => {
        console.log('nrc -> ', data);
        callback(data);
    });
}

/* Проверка конфига и подстройка возможных параметров */
function verifyConfig() {
    if (!config) {
        console.error('НЕТ ФАЙЛА КОНФИГУРАЦИИ');
        config = {};
    }

    if (!config.telegramid) {
        console.warn('Нет ID бота Telegram, он работать не будет');
    }

    return true;
}