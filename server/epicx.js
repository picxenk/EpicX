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
        //this.createUser(con);

        con.send(JSON.stringify(data));
        console.log(this.log_header+'send: '+JSON.stringify(data));
    },

    /** Run for message **/
    run: function(con, msg) {
        var message = JSON.parse(new Buffer(msg));
        var data;

        switch(message.type) {
			case 'login':
				this.msg_login(con, message);
				return;
				break;
            case 'update':
                data = this.msg_update(message);
                break;
            case 'chat':
                data = this.msg_chat(message);
                break;
			case 'refresh':
				this.msg_refresh(message);
				break;
            default:
				console.log(this.log_header+'DO NOT UNDERSTOOD: '+message.type);
				data = {type:'error', message:'type is not defined'};
                break;
        }
        con.broadcast(JSON.stringify(data));
        console.log(this.log_header+'RUN END: '+JSON.stringify(data));
    },

    /** Message : login **/
    msg_login: function(con, message) {
        console.log(this.log_header+'RUN(LOGIN)'+message.id);
		
		var user = this.getUserInfo(message.id, function(user) {
			var data = {
				type: 'loggedin',
				id: user.id,
				tox: user.tox,
				toy: user.toy,
				todir: user.todir,
				hp: user.hp,
				mp: user.mp,
			}
			con.send(JSON.stringify(data));
		});

    },

    /** Message : update **/
    msg_update: function(message) {
        console.log(this.log_header+'RUN(UPDATE)'+message.tox+'-'+message.toy);

        var data = {
            type: 'update',
            id: message.id,
            tox: parseFloat(message.tox),
            toy: parseFloat(message.toy),
			todir: parseFloat(message.todir),
			hp: parseFloat(message.hp),
			mp: parseFloat(message.mp),
        };
        this.updateUser(message);
        return data;
    },

    /** Message : chat **/
    msg_chat: function(message) {
        console.log(this.log_header+'RUN(CHAT)');
        var data = {
            type: 'chat',
            msg: message.msg,
        };
        this.logChat(message);
        return data;
    },
    /** Message : refresh **/
    msg_refresh: function(message) {
        console.log(this.log_header+'RUN(REFRESH)');
        return;
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
    createUser: function(userID) {  
        var userData = {
            //id: this.ids[con.id],
			id: userID,
            hp: 0,
            mp: 0,
			tox: 0,
			toy: 0,
			todir: 0,
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

    /** DB : log chat message **/
    logChat: function(message) {
        var chatData = {
            //id: this.ids[con.id],
			id: message.id,
			msg: message.msg,
            //date: ,
        };
        this.db.collection('chats', function(err, collection) {
            collection.insert(chatData, {safe:true}, function(err, obj) {
                if (err) console.warn(err.message);
            });
            console.log('[DB]INSERT CHAT: '+chatData.id);
        });
    },

    /** DB : get user info **/
	getUserInfo: function(userID, callback) {
		var epicx = this;
		this.db.collection('users', function(err, collection) {
			collection.findOne({id: userID}, {}, function(err, userObject) {
				var user;
				if (err) console.warn(err.message);
				if (userObject != null) {
					user = userObject;
				} else {
					epicx.createUser(userID);
					user = {
						id: userID,
						tox: 100,
						toy: 100,
						todir: 0,
					}
				}
				callback(user);
				console.log('[DB]get user info: '+user.id);
			});
		});
	},

    /** DB : update user information **/
    updateUser: function(user) {
        var query = {id: user.id};
        var sort = [['_id', 'asc']];
        var update = {$set: {
			tox: parseFloat(user.tox), 
			toy: parseFloat(user.toy), 
			todir: parseFloat(user.todir), 
			hp: parseFloat(user.hp),
			mp: parseFloat(user.mp),
		}};
        this.db.collection('users', function(err, collection) {
            collection.findAndModify(query, sort, update, {}, function(err, obj) {
                if (err) console.warn(err.message);
            });
            console.log('[DB]UPDATE for: '+query.id);
        });
    },
};

exports.EpicX = EpicX;
