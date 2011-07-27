var GS = {};

GS.loadJSON = function(url, callback, n) {
	var req = new XMLHttpRequest();
	req.onreadystatechange = function(evt) {
		if(req.readyState === 4) {
			if(req.status === 200) {
				if(n !== undefined) {
					var json = JSON.parse(req.responseText);
					var data = GS.realignData(json, n);
					callback(data);
				}
				else {
					callback(req.responseText);
				}
			}
			else {
				console.log("error loading json");
			}
		}
	}
	req.open("GET", url, true);
	req.send(null);
}

GS.realignData = function(result, n) {
	GS.fields = [];	
	var col = {};
	var row = {};
	var list = [];
	var reX = /\D+/;
	var reY = /\d+/;
	var yIndex = "2";
	for(var i = 0; i < result.feed.entry.length; i += 1) {
		var item = result.feed.entry[i];
		var t = item.title.$t;		
		if(i < n) {
			col[t.match(reX)] = item.content.$t;
			GS.fields.push(item.content.$t);
		}
		else {
			var x = t.match(reX)[0];
			var y = t.match(reY)[0];
			if(y != yIndex) {
				list.push(row);
				yIndex = y;
				row = {};
			}
			row[col[x]] = item.content.$t;	
		}
	}
	list.push(row);
	return list;
}