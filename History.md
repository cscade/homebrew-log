## 0.6.2 - 2013-06-09

* bugfixes
	* seriously. missed a comma

## 0.6.1 - 2013-06-09

* bugfixes
	* add missing yeast method descriptor

## 0.6.0 - 2013-05-25

* changes
	* update all dependencies
	* change default development environment port to 3000

## 0.5.7 - 2013-02-21

* fix a potential race condition that could cause log update cycles to overlap and fail
* add linting via grunt/jshint
* add environment based logging

## 0.5.6 - 2013-02-20

* extend interface to support BJCP judging notes and scores

## 0.5.5 - 2012-12-24

* default to off for automatically generated points in details

## 0.5.4 - 2012-11-22

* added display of gravities, calculated attenuation, and calculated abv to batch details tab
* support for file attachments to batches

## 0.5.3 - 2012-11-21

* fix temp probe 0 being ignored
* fix database interference on simultaneous bcs logs

## 0.5.0 - 2012-11-20

* improved navigation
* improved database model (to upgrade, restart multiple times until tweak indicates no changes)
* batch numbers, batch number based navigation
* BCS-460 automation controller support
	* auto-log temperatures to any number of batches on user-defined interval
	* logging begins automatically on application restart
	* logs occur on even intervals
* improved user experience for iPhone/iPad
* include SG in plots

## 0.4.0 - 2012-11-07

* open project
* remove ssl
* remove from internet
* use ampl.View framework
* temperature charting
* remove branding
* many mobile optimizations

## 0.2.3 - 2012-11-04

* mobile improvements

## 0.2.2 - 2012-11-04

* fix express.basicauth

## 0.2.1 - 2012-11-04

* switch to express.basicauth

## 0.2.0 - 2012-11-04

* beer in a glass SRM representation
* integrated BJCP database
* update bootstrap to 2.2.1
* recipes are now called beers
* now possible to create a beer without xml file, xml still supported
* beer detail interface is now broken down into tabs
* removed resourceful dependency
* added tweak for database upgrades
* added config, cradle library

## 0.1.5 - 2012-09-08

* Add batch number (global) to batch metadata

## 0.1.4 - 2012-09-08

* Improve time displays in batch details to include offset vs. pitch as well as offset vs. now