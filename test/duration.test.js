const { DurationUtil } = require('../src/duration-util');

describe('duration-util', function () {
  it('toString test', function (done) {
    console.log(new DurationUtil(-4443454).long());
    console.log(new DurationUtil(-4443454).format());
    console.log(new DurationUtil(-4443454).short());
    console.log(new DurationUtil(-4443454).sep(':'));
    console.log(new DurationUtil(982440990).noms().long());
    console.log(new DurationUtil(982440990).noms().short());
    console.log(new DurationUtil(982440990).noms().sep(':'));
    console.log(new DurationUtil(982440990).long());
    console.log(new DurationUtil(982440990).format());
    console.log(new DurationUtil(982440990).sep(':'));
    console.log(new DurationUtil(3454).format());
    console.log(new DurationUtil(455).format());
    console.log(new DurationUtil(1).format());
    console.log(new DurationUtil(0).format());
    // expect(new DurationUtil (3.45455).precision(3).toString()).toEqual('3.455');
    // expect(new DurationUtil(3.454).precision(2).toString()).toEqual('3.45');
    // expect(new DurationUtil(32397.843).toString()).toEqual('8h59m57.843s');
    // should(timeutil.formatMS(130054)).equal('2m10.054s');
    // should(timeutil.formatMS(41234)).equal('41.234s');
    done();
  });

  // it('formatMS test',function(done) {
  //   should(timeutil.formatMS(3454)).equal('3.454s');
  //   should(timeutil.formatMS(32397843)).equal('8h59m57.843s');
  //   should(timeutil.formatMS(130054)).equal('2m10.054s');
  //   should(timeutil.formatMS(41234)).equal('41.234s');
  //   done();
  // });
  //
  // it('formatMS test',function(done) {
  //   timeutil.setFormatMsOptions( { h: ':', m: ':' } );
  //   should(timeutil.formatMS(3454)).equal('3.454s');
  //   should(timeutil.formatMS(32397843)).equal('8:59:57.843s');
  //   should(timeutil.formatMS(130054)).equal('2:10.054s');
  //   should(timeutil.formatMS(41234)).equal('41.234s');
  //   done();
  // });
});
