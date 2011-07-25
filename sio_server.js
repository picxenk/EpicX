/** IMPORT MODULES **/
require.paths.unshift(__dirname + '/server')
var http = require('http');
var fs = require('fs');
var io = require('socket.io');
var mongo = require('mongodb');
var static = require('node-static');
var EpicX = require('epicx').EpicX;

/** READ CONFIG **/
var count = 0;
var ids = [];
var config = {};
var encoding = 'utf-8';
var config_file_name = 'config.json';
try {
    config = JSON.parse(fs.readFileSync(config_file_name, encoding).toString());
} catch(err) {
    if (err.errno == 9) {
        console.error(config_file_name + ' - file does not exist, please make the config file');
    } else {
        console.error(err);
    }
    return;
}

/** INIT SERVICES **/
var db = new mongo.Db(config.db, new mongo.Server(config.mongo_host, config.mongo_port, {}), {});
db.addListener('error', function(error) {
    console.log('[Error]: connection to MongoDB');
});

var file = new(static.Server)(config.public_path);
var http_server = http.createServer(function(req, res) {
    req.addListener('end', function() {
        file.serve(req, res);
    });
});
io = io.listen(http_server);
http_server.listen(config.http_port, config.host_ip);
console.log('[Message]: HTTP file server running at http://' + config.host_ip + ':' + config.http_port);


/** START EpicX WEBSOCKET SERVER + DB **/
db.open(function(c_db) {
    var epicx = new EpicX(db);

    io.sockets.on('connection', function(con) {
        epicx.connect(con);
        con.on('close', function() {epicx.close(con)});
        con.on('message', function(msg) {epicx.run(con, msg)});
    });

    io.sockets.on('error', function(){
        console.log(Array.prototype.join.call(arguments, ", "));
    });

    io.sockets.on('disconnected', function(con) {
        console.log(con.id+"discon");
    });
});
