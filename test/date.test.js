const { DateUtil } = require('../src/date-util');

describe('date-util', function () {
  // Yes I know this only works in Costa Rica timezone
  // I'll fix it later, maybe
  it('toISOLocaleString', function (done) {
    var d = new Date('1997-11-25T12:13:14.456Z');
    expect(new DateUtil(d).toISOLocaleString()).toEqual('1997-11-25T06:13:14.456-06:00');
    expect(new DateUtil(d).toISOLocaleString(true)).toEqual('1997-11-25T06:13:14.456-06:00');
    expect(new DateUtil(d).toISOLocaleString(false)).toEqual('1997-11-25T06:13:14-06:00');
    done();
  });
  it('julianDate', function (done) {
    var d = new Date('1997-11-25T12:13:14.456Z');
    expect(new DateUtil(d).julianDate()).toEqual(2450778);
    done();
  });
});
