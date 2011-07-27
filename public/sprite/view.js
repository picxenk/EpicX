var canvas = document.querySelector("#canvas2d");
var ctx = canvas.getContext("2d");
var frameCount = 0;
var ptcls = [];
var thePtcl = null;
var socket = io.connect("ws://127.0.0.1:8000");

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

var createPtcl = function(img, sprite_info) {
    var ptcl = {};
    ptcl.id = 0;
    ptcl.img = img;
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
    ptcl.old_to_x = 0;
    ptcl.old_to_y = 0;
    
    ptcl.update = function() {
        this.x += (this.to_x - this.x) * 0.1;
        this.y += (this.to_y - this.y) * 0.1;
        this.angle += (this.to_angle - this.angle) * 0.1;
        this.scale += (this.to_scale - this.scale) * 0.1;
        
        if(this.frameCount % 4 == 0) {
            this.s_index += 1;
            if(this.s_index > 15) this.s_index = 0;
            
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
                        toy: this.to_y
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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle / 180 * Math.PI);
        ctx.scale(this.scale, this.scale);
        ctx.drawImage(this.img, 0 + this.s_index * 32, 0, 32, 32, 0 - 16, 0 - 16, 32, 32);
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
    
}

var draw = function() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    camera.begin(ctx);
    
    for(var i = 0; i < ptcls.length; i += 1) {
        ptcls[i].draw();
    }
    
    camera.end(ctx);
}

var animate = function() {
	webkitRequestAnimationFrame(animate);
    
    if(!ASSET.isReady) return;
    
	update();
	draw();
	frameCount += 1;
}

var addPtcl = function(sprite_src) {
    var ptcl = createPtcl(sprite_src);
    ptcl.id = ptcls.length;
    ptcls.push(ptcl);
}

var initView = function() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    animate();
}

var initSprite = function() {
    for(var i = 0; i < 10; i += 1) {
        addPtcl( ASSET.sprite_src['sheet_characters'] );
    }
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
    }
}

window.onkeyup = function(evt) {
    if(thePtcl === null) return;
    //console.log(evt.keyCode);
    switch(evt.keyCode) {
        case 37: // left
            thePtcl.dir_x = 0;
            return;
        case 38: // up
            thePtcl.dir_y = 0;
            return;
        case 39: // right
            thePtcl.dir_x = 0;
            return;
        case 40: // down
            thePtcl.dir_y = 0;
            return;
    }
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
});
