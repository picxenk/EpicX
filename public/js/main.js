var config = {
    'ws_ip': '127.0.0.1',
    'ws_port': 8080,
};
var canvas = document.querySelector("#canvas");
canvas.width = 800;
canvas.height = 400;
var ctx = canvas.getContext("2d");
var ptcls = {};
var me = null;
var my_id = "";

var addPtcl = function(name) {
	var ptcl = {};
	ptcl.name = name;
	ptcl.x = 0;
	ptcl.y = canvas.height * 0.5;
	ptcl.vx = 0;
	ptcl.vy = 0;
	ptcl.tox = ptcl.x;
	ptcl.toy = ptcl.y;
	ptcl.update = function() {
		this.vx += (this.tox - this.x) * 0.1;
		this.x += this.vx * 0.1;
		this.vx *= 0.9;
		this.vy += (this.toy - this.y) * 0.1;
		this.y += this.vy * 0.1;
		this.vy *= 0.9;
		if(this.x > canvas.width) this.x = 0;
	}
	ptcl.draw = function() {
		ctx.beginPath();
		ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
		ctx.strokeStyle = "white";
		ctx.stroke();
		ctx.fillStyle = "white";
		ctx.fillText(name, this.x, this.y);
	}
	ptcls[name] = ptcl;
	
	return ptcl;
}

var update = function() {
	for(var name in ptcls) {
		ptcls[name].update();
	}
}

var draw = function() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	for(var name in ptcls) {
		ptcls[name].draw();
	}
}

canvas.onmousedown = function(evt) {
	evt.preventDefault();
	if(me != null) {
		me.tox = evt.offsetX;
		me.toy = evt.offsetY;
		
		var data = {
			type: "update",
			id: my_id,
			tox: evt.offsetX,
			toy: evt.offsetY
		};
		socket.send(JSON.stringify(data));
	}
}

var animate = function() {
	webkitRequestAnimationFrame( animate );
	update();
	draw();
}

var init = function() {
	//me = addPtcl("epic");
}

init();
animate();

var socket = new WebSocket('ws://'+ config.ws_ip + ':' + config.ws_port);
socket.onopen = function(evt) {
  //socket.send(JSON.stringify(me));
};
socket.onmessage = function(evt) { 
	console.log(evt.data);
	var data = JSON.parse(evt.data);
	switch(data.type) {
		case "welcome" :
			me = addPtcl(data.id);
			my_id = data.id;
			break;
		case "update" :
			console.log(evt.data);
			if(ptcls[data.id] === undefined) {
				addPtcl(data.id);
			}
			else {
				ptcls[data.id].tox = data.tox;
				ptcls[data.id].toy = data.toy;
			}
			break;
	}
}
socket.onclose = function(event) { console.log('closed') }; 
