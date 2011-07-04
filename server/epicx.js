var EpicX = function(db, callback) {
    this.db = db;
    this.count = 0;
    this.ids = [];
    this.log_header = '[EpicX]'
};

EpicX.prototype = {
    connect: function(con) {
        this.count++;
        this.ids[con.id] = this.count;
        console.log(this.log_header+'connection:'+con.id + ' with id: '+this.count);
        var data = {
            type: 'welcome',
            id: this.ids[con.id]
        };
        this.createUser(con);

        con.send(JSON.stringify(data));
        console.log(this.log_header+'send: '+JSON.stringify(data));
    },

    /** Run for message **/
    run: function(con, msg) {
        var message = JSON.parse(new Buffer(msg));
        var data;

        switch(message.type) {
            case "update":
                data = this.msg_update(message);
                break;
            default:
                break;
        }
        con.broadcast(JSON.stringify(data));
        console.log(this.log_header+'run end'+JSON.stringify(data));
    },

    /** Message : update **/
    msg_update: function(message) {
        console.log(this.log_header+'run update');

        var data = {
            type: 'update',
            id: message.id,
            tox: parseFloat(message.tox),
            toy: parseFloat(message.toy)
        };
        this.updatePosition(message);
        return data;
    },

    /** When websocket connection is closed **/
    close: function(con) {
        console.log(this.log_header + con.id + ' closed');
        var data = {
            type: "closed",
            id: this.ids[con.id]
        };
        console.log(this.log_header+JSON.stringify(data));
        con.broadcast(JSON.stringify(data));
    },

    /** DB : insert new user **/
    createUser: function(con) {  
        var userData = {
            id: this.ids[con.id],
            hp: 100,
            mp: 100,
            pox: 0,
            poy: 0,
        };
        this.db.collection('users', function(err, collection) {
            collection.insert(userData, {safe:true}, function(err, obj) {
                if (err) console.warn(err.message);
                if (err && err.message.indexOf('E11000 ') !== -1) {
                    console.log('[DB]user already exist');
                }
            });
            console.log('[DB]insert new user: '+userData.id);
        });
    },

    /** DB : update user postion **/
    updatePosition: function(user) {
        var query = {id: user.id};
        var sort = [['_id', 'asc']];
        var update = {$set: {pox: parseFloat(user.tox), poy: parseFloat(user.toy)}};
        this.db.collection('users', function(err, collection) {
            collection.findAndModify(query, sort, update, {}, function(err, obj) {
                if (err) console.warn(err.message);
            });
            console.log('[DB]update position for: '+query.id);
        });
    },
};

exports.EpicX = EpicX;
