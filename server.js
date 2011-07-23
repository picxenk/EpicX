/** CONFIG **/
var config = {
    //'host_ip': '10.1.32.156',
    'host_ip': '127.0.0.1',
    'http_port': 8000,
    'ws_port': 8080,
    'public_path': './public',

    'mongo_host': 'localhost',
    'mongo_port': 27017,
    'db': 'epicx',
	'debug': false,
};

/** REQUIRED MODULES **/
require.paths.unshift(__dirname + '/server');
var http = require('http'),
    ws = require('websocket-server'),
    mongo = require('mongodb'),
    static = require('node-static'),
    EpicX = require('epicx').EpicX;
	count = 0,
	ids = [];

/** INIT SERVICES **/
var db = new mongo.Db(config.db, new mongo.Server(config.mongo_host, config.mongo_port, {}), {});
db.addListener('error', function(error) {
    console.log('[Error]: connection to MongoDB');
});
var server = ws.createServer({debug: config.debug});
var file = new(static.Server)(config.public_path);
var http_server = http.createServer(function(req, res) {
    req.addListener('end', function() {
        file.serve(req, res);
    });
});

/** START HTTP FILE SERVER **/
http_server.listen(config.http_port, config.host_ip);
console.log('[Message]: HTTP file server running at http://' + config.host_ip + ':' + config.http_port);

/** START EpicX WEBSOCKET SERVER + DB **/
db.open(function(c_db) {
    var epicx = new EpicX(db);

    server.on('connection', function(con) {
        epicx.connect(con);
        con.on('close', function() {epicx.close(con)});
        con.on('message', function(msg) {epicx.run(con, msg)});
    });

    server.on('error', function(){
        console.log(Array.prototype.join.call(arguments, ", "));
    });

    server.on('disconnected', function(con) {
        console.log(con.id+"discon");
    });
    server.listen(config.ws_port);
    console.log('[Message]: WebSocket server running at http://' + config.host_ip + ':' + config.ws_port);
});
