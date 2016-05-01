/*************************************************************************
 * Copyright(c) 2012-2016 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var should = require('should');
var timeutil = require('../index');

describe('time-util test',function() {
  
  it('formatMS test',function(done) {
    should(timeutil.formatMS(3454)).equal('3.454s');
    should(timeutil.formatMS(32397843)).equal('8h59m57.843s');
    should(timeutil.formatMS(130054)).equal('2m10.054s');
    should(timeutil.formatMS(41234)).equal('41.234s');
    done();
  });

  // Yes I know this only works during daylight savings in PT zone
  // I'll fix it later, maybe
  it('toISOLocaleString test',function(done) {
    var d = new Date('1997-11-25T12:13:14.456Z');
    should(d.toISOLocaleString()).equal('1997-11-25T04:13:14.456-08:00');
    should(d.toISOLocaleString(true)).equal('1997-11-25T04:13:14-08:00');
    done();
  });
  
});

