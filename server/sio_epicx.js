var EpicX = function(db, callback) {
    this.db = db;
    this.log_header = '[EpicX]'
    this.con = null;
    // this.count = 0;
    // this.ids = [];
};

EpicX.prototype = {
    send: function(type, data) {
        this.con.emit(type, data);
    },

    broadcast: function(type, data) {
        this.con.broadcast.emit(type, data);
    },

    connect: function(con) {
        this.con = con;
        console.log(this.log_header+'connection:'+con.id);
        var data = { msg: 'Welcome to paradise' };
        this.send('welcome', data); 
    },

    /** Message : login **/
    msg_login: function(con, message) {
        console.log(this.log_header+'RUN(LOGIN)'+message.id);
		
		var user = this.getUserInfo(message.id, function(user) {
			var data = {
				// type: 'loggedin',
				id: user.id,
				tox: user.tox,
				toy: user.toy,
				// todir: user.todir,
				// hp: user.hp,
				// mp: user.mp,
			}
			// con.send(JSON.stringify(data));
            con.emit('loggedin', data);
		});

    },

    /** Message : update **/
    msg_update: function(con, message) {
        // console.log(this.log_header+'RUN(UPDATE)'+message.tox+'-'+message.toy);
        console.log(message);

        var data = {
            // type: 'update',
            id: message.id,
            tox: parseFloat(message.tox),
            toy: parseFloat(message.toy),
            dir_x: parseFloat(message.dir_x),
            dir_y: parseFloat(message.dir_y),
			// todir: parseFloat(message.todir),
			// hp: parseFloat(message.hp),
			// mp: parseFloat(message.mp),
        };
        this.updateUser(message);
        con.broadcast.emit('update', data);
    },

    /** Message : chat **/
    msg_chat: function(message) {
        console.log(this.log_header+'RUN(CHAT)');
        var data = {
            id: message.id,
            type: 'chat',
            msg: message.msg,
        };
        //this.logChat(message);
        return data;
    },
    /** Message : refresh **/
    msg_refresh: function(message) {
        console.log(this.log_header+'RUN(REFRESH)');
        return;
    },
    msg_fire: function(con, data) {
        con.broadcast.emit('fire', data);
        console.log(data);
    },
    msg_hit: function(con, data) {
        con.broadcast.emit('hit', data);
        con.emit('hit', data);
        console.log(data);
    },

    /** When websocket connection is closed **/
    close: function(con) {
        console.log(this.log_header + con.id + ' closed');
        var data = {
            type: "closed",
            id: this.ids[con.id]
        };
        console.log(this.log_header+JSON.stringify(data));
        con.broadcast.emit(JSON.stringify(data));
    },

    /** DB : insert new user **/
    createUser: function(userID) {  
        var userData = {
			id: userID,
            hp: 0,
            mp: 0,
			tox: 0,
			toy: 0,
			todir: 0,
        };
        var users = this.db.collection('users');
        users.insert(userData);
    },

    /** DB : log chat message **/
    logChat: function(message) {
        var chatData = {
            //id: this.ids[con.id],
			id: message.id,
			msg: message.msg,
            //date: ,
        };
        var chats = this.db.collection('chats');
        chats.insert(chatData);
    },

    /** DB : get user info **/
	getUserInfo: function(userID, callback) {
        var users = this.db.collection('users');
        users.findOne({id: userID}, function(err, user) {
            if (!err && user) {
                callback(user);
            } else {
                var userData = {
                    id: userID,
                    hp: 0,
                    mp: 0,
                    tox: 0,
                    toy: 0,
                    todir: 0,
                };
                users.insert(userData);
                callback(userData);
            }
            console.log(user);
        });
	},

    /** DB : update user information **/
    updateUser: function(user) {
        var toQuery = {id: user.id};
        var toUpdate = {$set: {
			tox: parseFloat(user.tox), 
			toy: parseFloat(user.toy), 
			todir: parseFloat(user.todir), 
			hp: parseFloat(user.hp),
			mp: parseFloat(user.mp),
		}};
        var users = this.db.collection('users');
        users.findAndModify({query: toQuery, update: toUpdate}, function(err, obj) {
            if (err) console.error(err);
            console.log(obj);
        });
    },
};

exports.EpicX = EpicX;
