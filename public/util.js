var pointOnCurve = function(sp, cp, ep, t) {
    var v = {};
    v.x = sp.x + t * (2 * (1 - t) * (cp.x - sp.x) + t * (ep.x - sp.x));
    v.y = sp.y + t * (2 * (1 - t) * (cp.y - sp.y) + t * (ep.y - sp.y));
    return v;
}

var buildQCurve = function(sp, cp, ep, step) {
    var vs = [];
    for(var i = 0; i < step; i += 1) {
        var t = i / (step - 1);
        var v = pointOnCurve(sp, cp, ep, t);
        vs.push(v);
    }
    return vs;
}

var buildCurve = function(hs, step)
{
    if (hs.length < 3) return null;

    var vs = [];

    // the first segment
    var v0 = hs[0];
    var v1 = {
        x : (hs[0].x + hs[1].x) * 0.5,
        y : (hs[0].y + hs[1].y) * 0.5,
    };
    
    for (var i = 0; i < step; i += 1)
    {
        var t = i / step;
        var v = {
            x : (1 - t) * v0.x + t * v1.x,
            y : (1 - t) * v0.y + t * v1.y
        };
        vs.push(v);
    }   

    for (var i = 1; i < hs.length - 1; i += 1)
    {
        var v0 = {
            x : (hs[i - 1].x + hs[i].x) * 0.5,
            y : (hs[i - 1].y + hs[i].y) * 0.5
        };
        var v1 = hs[i];
        var v2 = {
            x : (hs[i].x + hs[i + 1].x) * 0.5,
            y : (hs[i].y + hs[i + 1].y) * 0.5
        };
        for (var j = 0; j < step; j += 1)
        {
            var t = j / step;
            var v = pointOnCurve(v0, v1, v2, t);
            vs.push(v);
        }
    }

    // the last segment
    var v0 = {
        x : (hs[hs.length - 2].x + hs[hs.length - 1].x) * 0.5,
        y : (hs[hs.length - 2].y + hs[hs.length - 1].y) * 0.5
    };
    var v1 = hs[hs.length - 1];
    for (var i = 0; i < step; i += 1)
    {
        var t = i / (step - 1);
        var v = {
            x : (1 - t) * v0.x + t * v1.x,
            y : (1 - t) * v0.y + t * v1.y
        };
        vs.push(v);
    }

    return vs;
}

var drawVS = function(ctx, vs) {
    ctx.beginPath();
    ctx.moveTo(vs[0].x, vs[0].y);
    for(var i = 1; i < vs.length; i += 1) {
        ctx.lineTo(vs[i].x, vs[i].y);
    }
    ctx.stroke();
}

var random = function(min, max) {
    return min + (max - min) * Math.random();
}

var srandom = function() {
    return (Math.random() - 0.5) * 2;
}

var rgba = function(r, g, b, a) {
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}

var hsla = function(h, s, l, a) {
    return "hsla(" + h + "," + s + "%," + l + "%," + a + ")";
}