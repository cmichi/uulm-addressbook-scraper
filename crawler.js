var request = require('ahr');
var jsdom = require("jsdom");
var fs = require("fs");

/* create alphabet */
var alphabet = ['Ü', 'Ä', 'Ö'];
for (var i = 65; i < 65 + 26; i++) {
	alphabet.push(String.fromCharCode(i));
}

alphabet = ['A', 'B'];

/* query each thing in alphabet. if return value == "too many results" pop
this element and insert a new one containing the query + each alphabet
char. */
var not_yet_returned = 0;

function worker(q) {
	if (not_yet_returned > 10) {
		console.log("timeout")
		setTimeout(500, worker(q));
	} else if (not_yet_returned <= 10) {
		handle(q);
	}
};

function handle(q) {
	console.log("handling " + q)
	not_yet_returned++;
	query_name(q, function(result) {
		console.log(result);
		not_yet_returned--;
		if (result === false) {
			/* populate with "foo" + [a, b, c, ...] */
			for (var a in alphabet) {
				worker(q + alphabet[a]);
			}
		} else {
			fs.appendFile('results.csv', csv(result), function (err) {
				if (err) throw err;
			});
		}
	});
}

function csv(json) {
	var out = "";
	for (var i in json) {
		for (var j in json[i]) {
			out += '"' + json[i][j] + '";';
		}
		out += "\n";
	}

	return out;
}

(function init() {
	for (var a in alphabet) {
		worker(alphabet[a]);
	}
})();


// rewrite all below!
String.prototype.trim = function() { return this.replace(/^\s+|\s+$/, ''); };

function getTdContent(content, nr, typ) {
	var i = 0;

	while (i != nr) {
		content = content.substr(content.indexOf("</tr>") + 5, content.length);
		i++;
	}

	content = content.substr(content.indexOf("<td") + 3, content.length);
	content = content.substr(content.indexOf("<td"), content.length);
	content = content.substr(0, content.indexOf("</tr"));
	content = content.replace("<td width=20%>", "");
	content = content.replace(/<\/td>/g, "");
	content = content.replace(/<td>/g, "");
	content = content.replace(/<\/tr>/g, "");
	content = content.replace(/<br>/g, "");
	content = content.replace(/\t/g, "");
	content = content.replace(/\n/g, "").trim();
	//content = content.replace(/\"/g, '"').trim();
	//content = content.replace(/'/g, '"').trim();

	if (typ == "telefon" || typ == "telefax") {
		nummern = content.split('+');
		var numbers = [];
		
		if (nummern.length > 2) {
			for (var i in nummern) {
				if (nummern[i].trim() != "")
					numbers.push(nummern[i]);
			}
			content = "";
			for (var i in numbers) {
				content += numbers[i];
				if (i < numbers.length - 1) content += ", ";
			}
		}
	}

	return content;
}

function parse(content) {
	var allData = [];
	content = content.substr(content.indexOf("<h2>Ihr Suchergebnis:</h2><br>") + 30);
	content = content.substr(0, content.indexOf("<hr />"));

	var pos = content.indexOf("<h3>");
	while (pos >= 0) {
			var currentOne = content.substr(0, content.indexOf("</table>") + 8).trim();
			var td = 0;
			var currentData = {}; 
			currentData.name = currentOne.substr(4, currentOne.indexOf("</h3>") - 4).replace("<h3>","");
			currentData.einrichtung = getTdContent(currentOne, td++);
			currentData.einrichtung = currentData.einrichtung.replace(/<a\b[^>]*>/i,"").replace(/<\/a>/i, "");

			currentData.gebaeude = getTdContent(currentOne, td++);
			currentData.email = getTdContent(currentOne, td++);
			currentData.email = currentData.email.replace(/<a\b[^>]*>/i,"").replace(/<\/a>/i, "");
			currentData.telefon = getTdContent(currentOne, td++, 'telefon');
			currentData.telefax = getTdContent(currentOne, td++, 'telefax');
			currentData.mobil = getTdContent(currentOne, td++);
			currentData.www = getTdContent(currentOne, td++);

			content = content.substr(content.indexOf("</table>") + 8, content.length);
			pos = content.indexOf("<h3>");
			allData.push(currentData);
	}
	return allData;
}

function query_name(term, cb) {
	request.get("http://ab.uni-ulm.de/ab/search.pl" 
		    , {group: "all", lang: "de", query: term}
		    , {timeout: 10000})
		.when(function (err, Xhr_Or_NodeResponse, data) {
			content = data.toString("utf8");
			//console.log(content);

			if (content.match(/Bitte genaueren Suchbegriff eingeben./gi)) {
				cb(false);
			} else {
				var data = parse(content);
				console.log("done with " + term);
				cb(data);
			}
	});
}


