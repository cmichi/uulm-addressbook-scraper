var Client = require('mysql').Client,
    client = new Client();

client.port = '/Applications/MAMP/tmp/mysql/mysql.sock';
client.user = 'root';
client.password = 'root';

client.database = 'scrape';
client.host = 'localhost';

client.connect();

client.query("DELETE FROM tasks");

var alphabet = ['Ü', 'Ä', 'Ö'];

for (var i = 65; i < 65 + 26; i++) {
	alphabet.push(String.fromCharCode(i));
}

for (var i = 0; i < alphabet.length; i++) {
	for (var j = 0; j < alphabet.length; j++) {
		client.query("INSERT INTO tasks SET term = ?, done = ?", [alphabet[j] + alphabet[i], 0]);
	}
}


var eliminateCombos = ['ZZ', 'XX', 'YY', 'PP', 'WW', 'UU', 'GG', 'KK', 'LL', 'PP', 'YQ', 'QY', 'BB', 'CC', 'DD',
    'EE', 'FF', 'GG', 'HH', 'KK', 'MM', 'ÄÄ', 'ÜÜ', 'ÖÖ', 'NN', 'QQ', 'RR', 'SS', 'TT', 'VV', 'YX', 'XY', 'YZ',
    'ÄÜ', 'ÄÖ', 'ÖÄ', 'ÜÄ', 'ÄÜ', 'XÜ', 'ÄZ', 'WX', 'YÜ', 'QÜ', 'YÄ', 'ÄY', 'ÖX', 'ÜX', 'ÜÖ', 'WQ', 'QW', 'ÖÜ', 
    'ÜÖ', 'ÄÜ'];

for (var p = 0; p < eliminateCombos.length; p++) {
	client.query("DELETE FROM tasks WHERE term LIKE ?", [eliminateCombos[p]]);
}
