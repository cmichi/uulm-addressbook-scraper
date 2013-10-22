var fs = require("fs");
var http = require("http");

/* create alphabet */
var alphabet = ['Ü', 'Ä', 'Ö'];
for (var i = 65; i < 65 + 26; i++) {
	alphabet.push(String.fromCharCode(i));
}

//alphabet = ['A', 'B', 'C', 'D'];
//alphabet = ['A', 'B'];

/* query each thing in alphabet. if return value == "too many results" pop
this element and insert a new one containing the query + each alphabet
char. */
var not_yet_returned = 0;
var queue = [];
var worker_interval;
var limit = 15;

function worker(q) {
	if (queue.length === 0 && not_yet_returned === 0)
		clearInterval(worker_interval);

	if (not_yet_returned > limit) {
		return;
	} else if (not_yet_returned > 0 && not_yet_returned <= limit) {
		for (i = 0; i < limit - not_yet_returned; i++) {
			if (queue.length === 0) continue;
			handle(queue.pop());
		}
	}
};


function handle(q) {
	console.log("handling " + q)
	not_yet_returned++;
	query_name(q, function(result) {
		//console.log(result);
		not_yet_returned--;
		if (result === false) {
			/* populate with "foo" + [a, b, c, ...] */
			for (var a in alphabet) {
				queue.push(q + alphabet[a]);
			}
		} else {
			if (result.length > 0) {
				fs.appendFile('results.csv', csv(result), function (err) {
					if (err) throw err;
				});
			}
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

function query_name(term, cb) {
	var uri = "http://ab.uni-ulm.de/ab/search.pl?group=all&lang=de&query=" + term;
	var body = []
	http.get(uri, function(res) {
		res.on('data', function (chunk) {
			body.push(chunk);
		});

		res.on('end', function () {
			var content = body.join();

			if (content.match(/Bitte genaueren Suchbegriff eingeben./gi)) {
				console.log("specify term for " + term);
				cb(false);
			} else if (content.match(/Kein Eintrag vorhanden./gi)) {
				console.log("no results for " + term);
				cb([]);
			} else {
				var data = parse(content);
				console.log("done with " + term + " (" + data.length + ")");
				cb(data);
			}
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});;
}

(function init() {
	var headings = '"Name";"Einrichtung";"Gebaeude";"E-Mail";"Telefon";"Telefax";"Mobil";"WWW";\n';
	fs.writeFile('results.csv', headings, function (err) {
		if (err) throw err;
	});

	for (var a in alphabet) {
		queue.push(alphabet[a]);
	}
	worker_interval = setInterval(worker, 2000);
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
		// the name is separated through "last, first, etc.".  switch this.
		currentData.name = currentData.name.split(", ").reverse().join(" ");


		currentData.einrichtung = getTdContent(currentOne, td++);
		currentData.einrichtung = currentData.einrichtung.replace(/<a\b[^>]*>/i,"").replace(/<\/a>/i, "");

		currentData.gebaeude = getTdContent(currentOne, td++);
		currentData.email = getTdContent(currentOne, td++);
		currentData.email = currentData.email.replace(/<a\b[^>]*>/i,"").replace(/<\/a>/i, "");

		currentData.telefon = getTdContent(currentOne, td++, 'telefon');
		currentData.telefax = getTdContent(currentOne, td++, 'telefax');
		currentData.mobil = getTdContent(currentOne, td++);
		currentData.www = getTdContent(currentOne, td++);
		currentData.www = currentData.www.replace(/<a\b[^>]*>/i,"").replace(/<\/a>/i, "");

		content = content.substr(content.indexOf("</table>") + 8, content.length);
		pos = content.indexOf("<h3>");
		allData.push(currentData);
	}
	return allData;
}



