var canvas = document.querySelector("#canvas");
canvas.width = window.innerWidth - 424;
canvas.height = 600;
var ctx = canvas.getContext("2d");
ctx.font = "12px Arial";
//var socket = new WebSocket("ws://222.117.120.215:8080");
var socket = new WebSocket("ws://127.0.0.1:8080");
var frameCount = 0;

var input_id = document.querySelector("#input_id");
var button_id = document.querySelector("#button_id");
var range_hp = document.querySelector("#range_hp");
var range_mp = document.querySelector("#range_mp");
var member_info = document.querySelector("#member_info");

var members = {};
var ptcls = [];

var pdomains = [];
var pdomain = {
	x : 0,
	y : 0,
	radius : 100,
	name : "A",
	draw : function() {
		ctx.strokeStyle = "yellow";
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.stroke();
	}
}
pdomains.push(pdomain);

var thePtcl = null;
var camera = {
	x : 0,
	y : 0,
	tox : 0,
	toy : 0,
	scale : 1,
	init : function() {
		this.x = canvas.width * 0.5;
		this.y = canvas.height * 0.5;
		this.tox = this.x;
		this.toy = this.y;
	},
	update : function() {
		if(thePtcl !== null) {
			this.tox = -thePtcl.x + canvas.width * 0.5;
			this.toy = -thePtcl.y + canvas.height * 0.5;
		}
		this.x += (this.tox - this.x) * 1;
		this.y += (this.toy - this.y) * 1;
	},
	begin : function() {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.scale(this.scale, this.scale);		
	},
	end : function() {
		ctx.restore();
	}
};
var m_colors = {
	UXM : {r:0, g:0, b:255},
	SM : {r:0, g:255, b:0},
	DM : {r:255, g:0, b:0}
}
var toRGB = function(color) {
	return "rgb("+ color.r + "," + color.g + "," + color.b + ")"; 
}

var update = function() {
	for(var id in ptcls) {
		ptcls[id].update();
	}
	camera.update();
}

var draw = function() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	camera.begin();
	
	pdomain.draw();
	for(var id in ptcls) {
		ptcls[id].draw();
	}
	
	camera.end();
}

var animate = function() {
	webkitRequestAnimationFrame( animate );
	update();
	draw();
	frameCount += 1;
	if(frameCount % 5000 === 0) {
		var data = {
			type : "ping",
			frameCount : frameCount
		};
		socket.send(JSON.stringify(data));
	}
}

var addPtcl = function(id, info) {
	var theta = Math.random() * Math.PI * 2;
	var radius = 100;
	var ptcl = {};
	ptcl.id = id;
	ptcl.x = radius * Math.cos(theta);
	ptcl.y = radius * Math.sin(theta);
	ptcl.tox = ptcl.x;
	ptcl.toy = ptcl.y;
	ptcl.dir = Math.random() * Math.PI * 2;
	ptcl.todir = Math.random() * Math.PI * 2;
	//ptcl.points = createNGon(3, 20);
	ptcl.points = createBody();
	ptcl.info = info;
	ptcl.hp = 0;
	ptcl.mp = 0;
	ptcl.name = info["이름"];
	ptcl.gender = "f";
	if(info["성별"] === "남") {
		ptcl.gender = "m";
	}
	
	if(m_colors[info["소속"]] !== undefined) {
		ptcl.fillColor = toRGB(m_colors[info["소속"]]);
	}
	
	if(info["HP"] !== undefined) {
		ptcl.hp = parseFloat(info["HP"]);
	}
	
	if(info["MP"] !== undefined) {
		ptcl.mp = parseFloat(info["MP"]);
	}
	
	ptcl.update = function() {
		this.x += (this.tox - this.x) * 0.1;
		this.y += (this.toy - this.y) * 0.1;
		this.dir += (this.todir - this.dir) * 0.1;
	}
	
	ptcl.drawBody = function() {
		ctx.save();
			ctx.rotate(this.dir);
			ctx.beginPath();
			if(this.gender === "m") {
				ctx.arc(20, 0, 5, 0, Math.PI * 2);
			}
			else {
				ctx.arc(-20, 0, 5, 0, Math.PI * 2);
			}
			ctx.moveTo(this.points[0].x, this.points[0].y);
			for(var i = 1; i < this.points.length; i += 1) {
				ctx.lineTo(this.points[i].x, this.points[i].y);
			}
			ctx.lineTo(this.points[0].x, this.points[0].y);
			ctx.strokeStyle = "white";
			ctx.fillStyle = this.fillColor;
			ctx.fill();
			ctx.stroke();
		ctx.restore();
	}
	
	ptcl.drawInfo = function() {
		ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
		ctx.strokeRect(0, 10, 10 * 3, 5);
		ctx.strokeRect(0, 17, 10 * 3, 5);
		ctx.fillStyle = "red";
		ctx.fillRect(0, 10, this.hp * 3, 5);
		ctx.fillStyle = "blue";
		ctx.fillRect(0, 17, this.mp * 3, 5);
		ctx.fillStyle = "white";
		ctx.fillText(this.name, 0, 35);
	}
	
	ptcl.draw = function() {
		ctx.save();
			ctx.translate(this.x, this.y);
			this.drawBody();
			this.drawInfo();
		ctx.restore();
	}
	
	info.ptcl = ptcl;
	ptcls.push(ptcl);
	
	return ptcl;
}

var createNGon = function(n, r) {
	var pts = [];
	var theta = Math.PI * 2 / n;
	for(var i = 0; i < n; i += 1) {
		var x = r * Math.cos(theta * i);
		var y = r * Math.sin(theta * i);
		pts.push({x:x, y:y});
	}
	return pts;
}

var createBody = function(n, r) {
	var pts = [
		{x: -20, y: 10},
		{x: 20, y: 0},
		{x: -20, y: -10},
	];
	return pts;
}

var init = function(data) {
	for(var i in data) {
		var id = data[i]["GMail"].split("@")[0].trim();
		members[id] = data[i];
		addPtcl(id, data[i]);
	}
	camera.init();
	//thePtcl = ptcls[0];
	animate();
}

var init2 = function(data) {
	for(var i = 0; i < 30; i += 1) {
		var id = i;
		var data = {};
		data["소속"] = "UXM";
		members[id] = data;
		addPtcl(id, data);
	}
	thePtcl = ptcls[0];
	animate();
}

var sendUpdateMessage = function() {
	var data = {
		type : "update",
		id : thePtcl.id,
		tox : thePtcl.tox,
		toy : thePtcl.toy,
		todir : thePtcl.todir,
		hp : thePtcl.hp,
		mp : thePtcl.mp
	};
	socket.send(JSON.stringify(data));
}

var selectPtcl = function(x, y) {
	x = x - camera.x;
	y = y - camera.y;
	for(var i = 0; i < ptcls.length; i += 1) {
		var ptcl = ptcls[i];
		var dx = ptcl.x - x;
		var dy = ptcl.y - y;
		var d = Math.sqrt(dx*dx + dy*dy);
		if(d < 20) {
			//console.log(ptcl);
			return ptcl;
		}
	}
	return null;
}

canvas.onmousedown = function(evt) {
	evt.preventDefault();
	
	var ptcl = selectPtcl(evt.offsetX, evt.offsetY);
	if(ptcl != null) {
		showMemberInfo(ptcl.info);
	}
	else if(thePtcl !== null) {
		var dirx = evt.offsetX - canvas.width * 0.5;
		var diry = evt.offsetY - canvas.height * 0.5;
		thePtcl.tox += dirx;
		thePtcl.toy += diry;
		var dx = thePtcl.tox - thePtcl.x;
		var dy = thePtcl.toy - thePtcl.y;
		var theta = Math.atan2(dy, dx);
		
		var d_theta = (theta - thePtcl.todir);
		var sign = d_theta > 0 ? 1 : d_theta === 0 ? 0 : -1;
		if(Math.abs(d_theta) > Math.PI) thePtcl.dir += Math.PI * 2 * sign;
		thePtcl.todir = theta;
		
		sendUpdateMessage();
	}
}

range_hp.onchange = function(evt) {
	if(thePtcl != null) {
		thePtcl.hp = parseFloat(evt.target.value);
		sendUpdateMessage();
	}
}

range_mp.onchange = function(evt) {
	if(thePtcl != null) {
		thePtcl.mp = parseFloat(evt.target.value);
		sendUpdateMessage();
	}
}

/*
var fillUp = function() {
	for(var id in members) {
		var data = {
			type: "login",
			id: id
		};
		socket.send(JSON.stringify(data));
	}
}
*/

var showMemberInfo = function(info) {
	var html = "";
	for(var x in info) {
		var line = '<div class="m-prop"><b>%title%</b> : %content%</div>'; 
		line = line.replace("%title%", x);
		line = line.replace("%content%", info[x]);
		html += line;
	}
	member_info.innerHTML = html;
}

button_id.onclick = function() {
	var id = input_id.value;
	
	// login process
	var data = {
		type: "login",
		id: id
	};
	console.log(data.id);
	socket.send(JSON.stringify(data));
		
	if(members[id] !== undefined) {
		thePtcl = members[id].ptcl;
		range_hp.value = thePtcl.hp;
		range_mp.value = thePtcl.mp;
		
		showMemberInfo(members[id]);
	}
}


socket.onopen = function(evt) {
  //socket.send(JSON.stringify(me));
};

socket.onmessage = function(evt) { 
	console.log(evt.data);
	var data = JSON.parse(evt.data);
	switch(data.type) {
		case "welcome" :
			//me = addPtcl(data.id);
			//my_id = data.id;
			console.log("welcomed");
			break;
		case "loggedin" :
			if(members[data.id] !== undefined) {
				thePtcl = members[data.id].ptcl;
				thePtcl.tox = thePtcl.x = data.tox;
				thePtcl.toy = thePtcl.y = data.toy;
				thePtcl.todir = thePtcl.dir = data.todir;
				thePtcl.hp = range_hp.value = parseFloat(members[data.id]["HP"]);
				thePtcl.mp = range_mp.value = parseFloat(members[data.id]["MP"]);
			}
			else {
				thePtcl = null;
			}
			break;
		case "update" :
			if(members[data.id] === undefined) {
				//addPtcl(data.id);
				console.log("does not exist");
			}
			else {
				members[data.id].ptcl.tox = data.tox;
				members[data.id].ptcl.toy = data.toy;
				members[data.id].ptcl.todir = data.todir;
				members[data.id].ptcl.hp = data.hp;
				members[data.id].ptcl.mp = data.mp;
			}
			break;
	}
}
socket.onclose = function(event) { console.log('closed') }; 

GS.loadJSON("https://spreadsheets.google.com/feeds/cells/0AgNA5QSGhdCgdHJFbUFLTnllTi1qOXBkZU1iUThfakE/od7/public/basic?hl=en_US&alt=json", init, 26);