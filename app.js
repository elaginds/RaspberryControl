const http = require("http");
const control = require('./control');

http.createServer(function(request,response){

    response.end("Hello NodeJS!");

}).listen(3002, "127.0.0.1",function(){
    console.log("Сервер начал прослушивание запросов на порту 3002");

    control.start();
});