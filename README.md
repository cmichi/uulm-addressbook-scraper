# Readme

Simple scraper for the [address book of the University Ulm]
(http://ab.uni-ulm.de). All addresses are scraped into a file 
`results.csv`.

	$ time node crawler.js > ./log

**Project status:** Quick hack. Works. Code should be prettified.
Takes ~15 min on a server with a 100 MiB/s connection.


# Nice to have

I would like to rewrite it using a distributed Master/Worker pattern. 
It should be possible to add a list of different
workers (`workers = [ ["localhost", "10.0.0.1", ..."] ]`).

The Master should dynamically delegate a list of URIs to scrape to 
the different workers. I think this will speed things up.


# License

	Copyright (c) 2013 
		
		Michael Mueller <http://micha.elmueller.net>

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
