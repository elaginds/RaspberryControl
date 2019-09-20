let config = require('./config');
const telegram = require('./telegram');
const exec = require('child_process').exec;
let child;

const get_temp = 'vcgencmd measure_temp';
const get_hostname = 'hostname';
const get_wake = 'wakeonlan';


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

module.exports.getWake = function(name, callback) {
    if (!name || !config.macAdresses || !config.macAdresses[name]) {
        callback('Нет такого компьютера в настройках');
    } else {
        runScript(`${get_wake} ${config.macAdresses[name]}`, callback);
    }
};

module.exports.getHostname = function(callback) {
    runScript(get_hostname, callback);
};

function runScript(text, callback) {
    console.log(text);

    child = exec(text, function (error, stdout, stderr) {
        if (error) {
            callback(error);
        } else if (stderr) {
            callback(stderr);
        } else if (stdout) {
            callback(stdout)
        }

        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
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