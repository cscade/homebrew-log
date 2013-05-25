# homebrew-log

Want to keep track of all the details of the beers you brew? Comfortable with CouchDB and Node.js? Then this project might just be for you!

The goal of homebrew-log is to provide a centralized, authoritative, organized and powerful archive of all my home brewing log data. I like to keep good records, and I like to be able to refresh myself on how I brewed a beer last time, before I brew it again. homebrew-log works great in your browser and on iOS devices. I assume it works great on Android too.

## Features

* Store the key specs of your beers by name
* Record detailed data about how the batch was brewed, including
	* Batch Number (automatically incremented)
	* Batch Name
	* Batch Notes
	* Yeast strain
	* Fermentor type
	* Temp control
	* Date Brewed
* Track details of each batch as it proceeds, with data points for
	* Pitch
	* Temperature
	* Gravity (SG)
	* Additions
	* Dry Hopping
	* Racking
	* Packaging
	* General Notes
	* Tasting Notes
* Get details on the data points for each batch, both in [data view][data-view] and with [overlay temperature and gravity graphs][graph-view]
* Integrate with [BCS-460 & BCS-462][ecc] automation controllers to automatically record temperature data for batches, as they are in progress
* Upload attachments to batches
	* PDFs of brew day notes
	* Photo snapshots from your phone
	* Anything you want!

## Usage

The software is designed to run on a node.js server with a copy of couchdb. It can easily be configured to run on a virtual server out on the internet, with a free couch provider like iris couch for example. I run it on a server inside my house, but you can host it however you want!

#### Installation

* Clone the repository to your server environment
* Run `npm install` to install dependencies
* Edit `./config/config.json` with your server settings.
	* In particular, set the `database` name to whatever you like.
	* If you change it from `homebrew-log`, be sure to also change the reference in `./config/convey.json` to match.
* Create a new database in couch with the name you have chosen, ex. `homebrew-log`.
* Start with `node app.js`. All the database setup will be done automatically.

### License 

(The MIT License)

Copyright (c) 2011 Carson Christian &lt;cc@seekerbeer.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[data-view]: http://seekerbeer.com/shared-images/homebrew-log/05.png "05.png (1107×1049)"
[graph-view]: http://seekerbeer.com/shared-images/homebrew-log/06.png "06.png (1107×1049)"
[ecc]: http://www.embeddedcontrolconcepts.com/ "Welcome to Embedded Control Concepts"