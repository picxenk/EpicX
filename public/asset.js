var ASSET = {};
ASSET.isReady = false;
ASSET.loadCount = 0;
ASSET.sprite_urls = [
    './imgs/sheet_characters.png'
];
ASSET.sprite_src = {};
ASSET.init = function() {
    for(var i = 0; i < ASSET.sprite_urls.length; i += 1) {
        var url = ASSET.sprite_urls[i];
        var img = new Image();
        img.src = url;
        img.onload = function(e) {
            var arr = this.src.split('/');
            var name = arr[arr.length - 1].split('.')[0];
            console.log(name);
            ASSET.sprite_src[name] = this;
            ASSET.loadCount += 1;
            if(ASSET.loadCount === ASSET.sprite_urls.length) {
                ASSET.isReady = true;
                initSprite();
            }
        }
    }
}