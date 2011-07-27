var canvas = document.querySelector("#canvas2d");
var ctx = canvas.getContext("2d");
var frameCount = 0;
var ptcls = [];
var thePtcl = null;
var bullets = [];
var socket = io.connect("ws://222.117.120.215:8000");
//var socket = io.connect("ws://172.16.2.248");
var angleMap = { a270: 0, a315: 1, a0: 2, a45: 3, a90: 4, a135: 5, a180: 6, a225: 7 };

var camera = {
    x : 0,
    y : 0,
    to_x : 0,
    to_y : 0,
    zoom : 1,
    to_zoom : 1,
    angle : 0,
    to_angle : 0,
    update : function() {
        this.x += (this.to_x - this.x) * 0.1;
        this.y += (this.to_y - this.y) * 0.1;
        this.zoom += (this.to_zoom - this.zoom) * 0.1;
        this.angle += (this.to_angle - this.angle) * 0.1;
    },
    begin : function(ctx) {
        ctx.save();ctx.translate(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
        ctx.rotate(this.angle);
        ctx.translate(-this.x * this.zoom, -this.y * this.zoom);
        ctx.scale(this.zoom, this.zoom);
    },
    end : function(ctx) {
        ctx.restore();
    }
};

var fireBullet = function(pid, ox, oy, angle, lifespan) {
    var bullet = {};
    bullet.pid = pid;
    bullet.lifespan = lifespan;
    bullet.speed = 5;
    bullet.x = ox;
    bullet.y = oy;
    bullet.dir = angle / 180 * Math.PI;
    bullet.vx = bullet.speed * Math.cos(bullet.dir);
    bullet.vy = bullet.speed * Math.sin(bullet.dir);
    bullet.update = function() {
        this.x += this.vx;
        this.y += this.vy;
        if(this.lifespan > 0) {
            this.lifespan -= 1;
            if(this.lifespan === 0) {
                var i = bullets.indexOf(this);
                bullets.splice(i, 1);
            }
        }
        
        // collision
        for(var i = 0; i < ptcls.length; i += 1) {
            var ptcl = ptcls[i];
            if(this.pid !== ptcl.id) {
                var dx = this.x - ptcl.x;
                var dy = this.y - ptcl.y;
                var d = Math.sqrt(dx * dx + dy * dy);
                if(d < 10) {
                    console.log("hit by " + this.pid);
                }
            }
        }
    }
    bullet.draw = function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.restore();
    }
    bullets.push(bullet);
}

var createPtcl = function(img, sprite_info) {
    var ptcl = {};
    ptcl.id = 0;
    ptcl.img = img;
    ptcl.sprite_info = sprite_info['main'];
    ptcl.x = 0;
    ptcl.y = 0;
    ptcl.to_x = ptcl.x;
    ptcl.to_y = ptcl.y;
    ptcl.to_angle = 0;
    ptcl.angle = ptcl.to_angle;
    ptcl.to_scale = 1;
    ptcl.scale = ptcl.to_scale;
    ptcl.frameCount = 0;
    
    ptcl.s_index = 0;
    ptcl.dir_x = 0;
    ptcl.dir_y = 0;
    ptcl.dir = 0;
    ptcl.old_to_x = 0;
    ptcl.old_to_y = 0;
    ptcl.pose = sprite_info['main']['poses'][4];
    ptcl.frame = ptcl.pose[0];
    
    ptcl.update = function() {
        this.x += (this.to_x - this.x) * 0.1;
        this.y += (this.to_y - this.y) * 0.1;
        this.angle += (this.to_angle - this.angle) * 0.1;
        this.scale += (this.to_scale - this.scale) * 0.1;
        
        if(this.frameCount % 4 == 0) {
            if(this.dir_x || this.dir_y) {
                this.s_index += 1;
                var theta = Math.atan2(this.dir_y, this.dir_x) / Math.PI * 180;
                if(theta < 0) theta += 360;
                var aIndex = (angleMap['a'+theta]);
                this.pose = sprite_info['main']['poses'][aIndex];
                this.dir = theta;
            }
            if(this.s_index % 2 === 0) {
                this.frame = this.pose[0];
            }
            else {
                this.frame = this.pose[1];
            }
            if(thePtcl === this) {
                this.to_x += this.dir_x * 10;
                this.to_y += this.dir_y * 10;
                
                var dx = this.to_x - this.old_to_x;
                var dy = this.to_y - this.old_to_y;
                var d = Math.sqrt(dx * dx + dy * dy);
                if(d > 1) {
                    var data = {
                        id: this.id,
                        tox: this.to_x,
                        toy: this.to_y,
                        dir_x: this.dir_x,
                        dir_y: this.dir_y
                    };
                    socket.emit('update', data); 
                }
                this.old_to_x = this.to_x;
                this.old_to_y = this.to_y;
            }
        }
        
        this.frameCount += 1;
    }
    ptcl.draw = function() {
        var si = this.sprite_info;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle / 180 * Math.PI);
        ctx.scale(this.scale, this.scale);
        ctx.drawImage(this.img, 0 + this.frame * 32, 0, si.tw, si.th, 0 - si.tw / 2, 0 - si.th / 2, si.tw, si.th);
        ctx.restore();
    }
    
    return ptcl;
}

var resizeCanvas = function(width, height) {
    canvas.width = width;
    canvas.height = height;
    draw();
}

var update = function() {

    camera.update();
    
    for(var i = 0; i < ptcls.length; i += 1) {
        ptcls[i].update();
    }
    
    for(var i = 0; i < bullets.length; i += 1) {
        bullets[i].update();
    }
}

var draw = function() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    camera.begin(ctx);
    
    for(var i = 0; i < ptcls.length; i += 1) {
        ptcls[i].draw();
    }
    
    for(var i = 0; i < bullets.length; i += 1) {
        bullets[i].draw();
    }
    
    camera.end(ctx);
}

var animate = function() {
	//webkitRequestAnimationFrame(animate);
    
    if(!ASSET.isReady) return;
    
	update();
	draw();
	frameCount += 1;
}

var addPtcl = function(sprite_src) {
    var sprite_info = {
        main : {
            tw: 32,
            th: 32,
            poses: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13], [14, 15]]
        }
    };    
    var ptcl = createPtcl(sprite_src, sprite_info);
    ptcl.id = ptcls.length;
    ptcls.push(ptcl);
}

var initView = function() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    //animate();
    setInterval(animate, 1000 / 60);
}

var initSprite = function() {
    for(var i = 0; i < 10; i += 1) {
        addPtcl( ASSET.sprite_src['sheet_characters'] );
    }
    /*
    addPtcl( ASSET.sprite_src['sheet_characters'] );
    thePtcl = ptcls[0];
    */
}

window.onresize = function(evt) {
    resizeCanvas(window.innerWidth, window.innerHeight);
}
    
window.onkeydown = function(evt) {
    if(thePtcl === null) return;
    //console.log(evt.keyCode);
    switch(evt.keyCode) {
        case 37: // left
            thePtcl.dir_x = -1;
            return;
        case 38: // up
            thePtcl.dir_y = -1;
            return;
        case 39: // right
            thePtcl.dir_x = 1;
            return;
        case 40: // down
            thePtcl.dir_y = 1;
            return;
        case 32: // space
            fireBullet(thePtcl.id, thePtcl.x, thePtcl.y, thePtcl.dir, 100);
            var data = {
                id: thePtcl.id,
                x: thePtcl.x,
                y: thePtcl.y,
                dir: thePtcl.dir,
                lifespan: 100
            }
            socket.emit('fire', data);
            return;
    }
}

window.onkeyup = function(evt) {
    if(thePtcl === null) return;
    //console.log(evt.keyCode);
    switch(evt.keyCode) {
        case 37: // left
            thePtcl.dir_x = 0;
            break;
        case 38: // up
            thePtcl.dir_y = 0;
            break;
        case 39: // right
            thePtcl.dir_x = 0;
            break;
        case 40: // down
            thePtcl.dir_y = 0;
            break;
    }

    var data = {
        id: thePtcl.id,
        tox: thePtcl.to_x,
        toy: thePtcl.to_y,
        dir_x: thePtcl.dir_x,
        dir_y: thePtcl.dir_y
    };
    socket.emit('update', data);
}

document.querySelector('#button_id').onclick = function(e) {
    var id = document.querySelector('#input_id').value;
    socket.emit('login', {id: id});
}

socket.on('loggedin', function(data) {
    console.log('loagged in: ' + data.id);
    thePtcl = ptcls[parseInt(data.id)];
});

socket.on('update', function(data) {
    var ptcl = ptcls[parseInt(data.id)];
    ptcl.to_x = data.tox;
    ptcl.to_y = data.toy;
    ptcl.dir_x = data.dir_x;
    ptcl.dir_y = data.dir_y;
});

socket.on('fire', function(data) {
    fireBullet(data.id, data.x, data.y, data.dir, data.lifespan);
});