/**
 * Simple Crawler for the uulm-addressbook <http://ab.uni-ulm.de/>.
 * We use the data as demodata for our software project.
 *
 * Written by <michael-4.mueller@uni-ulm.de>, 02.2011
 */

var request = require('ahr');
var jsdom = require("jsdom");

var alphabet = ['Ü', 'Ä', 'Ö'];


for (var i = 65; i < 65 + 26; i++) {
	alphabet.push(String.fromCharCode(i));
}

var Client = require('mysql').Client,
client = new Client();
//client.debug = true;

client.user = 'root';
client.password = 'root';
client.database = 'scrape';
client.port = '/Applications/MAMP/tmp/mysql/mysql.sock';
client.host = 'localhost';
///console.log(client);


client.connect();

//console.log(client.ping());
//client.query("INSERT INTO tasks SET term = ?, done = ?", [alphabet[0], 1]);

function eliminate() {
	var eliminateCombos = ['ZZ', 'XX', 'YY', 'PP', 'WW', 'UU', 'GG', 'KK', 'LL', 'PP', 'YQ', 'QY', 'BB', 'CC', 'DD',
	    'EE', 'FF', 'GG', 'HH', 'KK', 'MM', 'ÄÄ', 'ÜÜ', 'ÖÖ', 'NN', 'QQ', 'RR', 'SS', 'TT', 'VV', 'YX', 'XY', 'YZ',
	    'ÄÜ', 'ÄÖ', 'ÖÄ', 'ÜÄ', 'ÄÜ', 'XÜ', 'ÄZ', 'WX'];

	for (var i = 0; i < searchDomains.length; i++) {
		for (var p = 0; p < eliminateCombos.length; p++) {
			if (searchDomains[i] == eliminateCombos[p]) 
				searchDomains.pop(i);
		}
	}
}
//console.log(searchDomains);


//console.log("'Name';'Einrichtung';'Gebaeude';'E-Mail';'Telefon';'Telefax';'Mobil';'WWW';");

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


function callit(term) {
	request.get("http://ab.uni-ulm.de/ab/search.pl", {group: "all", lang: "de", query: term}, {timeout: 10000})
	//request.get("http://localhost:8888/scrape.html", {group: "all", lang: "de", query: term}, {timeout: 10000})
	.when(function (err, Xhr_Or_NodeResponse, data) {
		content = data.toString("utf8");

		if (content.match(/Bitte genaueren Suchbegriff eingeben./gi)) {
			client.query("UPDATE tasks SET done = 1 WHERE term = '" + term + "'");
			//console.log("<== " + term);
			for (var j = 0; j < alphabet.length; j++) {
				client.query("INSERT INTO tasks SET term = ?, done = ?", [term + alphabet[j], 0]);
				//console.log("==> " + term + alphabet[j]);
			}
			console.log('--> published new tasks for ' + term);
		} else {
			content = content.substr(content.indexOf("<h2>Ihr Suchergebnis:</h2><br>") + 30);
			content = content.substr(0, content.indexOf("<hr />"));

			var pos = content.indexOf("<h3>");
			while (pos >= 0) {
					var currentOne = content.substr(0, content.indexOf("</table>") + 8).trim();
					var td = 0;
					var currentData = {}; 
					currentData.name = currentOne.substr(4, currentOne.indexOf("</h3>") - 4).replace("<h3>","");
					currentData.einrichtung = getTdContent(currentOne, td++);
					currentData.gebaeude = getTdContent(currentOne, td++);
					currentData.email = getTdContent(currentOne, td++);
					currentData.telefon = getTdContent(currentOne, td++, 'telefon');
					currentData.telefax = getTdContent(currentOne, td++, 'telefax');
					currentData.mobil = getTdContent(currentOne, td++);
					currentData.www = getTdContent(currentOne, td++);

					//currentData.www = currentData.www.replace("'", '"');
					//console.log(currentData.www);
//client.debug = true;
					client.query('INSERT INTO scrapes ' + 
						     'SET `name` = ?, einrichtung = ?, gebaeude = ?,' +
					     	     'email = ?, telefon = ?, telefax = ?, mobil = ?, www = ?',
						[currentData.name,  currentData.einrichtung, currentData.gebaeude,
						currentData.email, currentData.telefon, currentData.telefax, currentData.mobil,
						currentData.www]);

					//allData.push(currentData);
					content = content.substr(content.indexOf("</table>") + 8, content.length);
					pos = content.indexOf("<h3>");
				}

				client.query("UPDATE tasks SET done = 1 WHERE term = '" + term + "'");
				console.log("done with " + term);
				//outputAsCsv(allData, false);
		}



	});
}

function outputAsCsv(json, withHeader) {
	for (var i in json) {
		var outp = "";
		for (var j in json[i]) {
			outp += json[i][j] != '' ? "'" + json[i][j] + "';" : ";";
			//console.log("'" + json[i] + '";');
		}
		console.log(outp);
	}
}

// max 10 tasks
client.query("SELECT * FROM tasks WHERE done = 0 LIMIT 100",
	function selectCb(err, results, fields) {
			if (err) {
			throw err;
		}

		//console.log(results);
		//console.log(fields);
		//client.end();
		for (var i in results) {
			console.log("going for " + results[i].term);
			callit(results[i].term);
		}
	}
);

//callit("ME");

