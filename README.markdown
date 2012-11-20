# homebrew-log

This project is my ongoing quest to create a web-based, authorative, simple, and complete logging system for all my home brews. It's for my own use, but free to use for others who may find it useful.

![Main Screen][img]

## Usage

The software is designed to run on a local node.js server with a local copy of couchdb. It can easily be configured to run on a virtual server out on the internet, with a free couch provider like iris couch for example.

Clone the repository to your server environment, then run `npm install` to install dependencies.

## Features

* Create multiple beers with key specs, and optionally attach BeerXML data
* Create multiple batches of each beer
* Store relevant data about how the batch was brewed, including
	* Bath Number
	* Batch Name
	* Batch Notes
	* Yeast strain
	* Fermentor type
	* Temp control
	* Brewed Date
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
* Review batch data after the fact, both in data view and with overlay temperature graphs
* Integration with BCS-460 & BCS-462 automation controllers to automatically record temperature data for batches

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

[img]: http://seekerbeer.com/shared-images/homebrew-log/01.png "01.png (1107×1051)"