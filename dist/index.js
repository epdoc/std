var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// /Users/jpravetz/node_modules/epdoc-util/dist/index.js
var require_dist = __commonJS((exports) => {
  var isBoolean = function(val) {
    return typeof val === "boolean";
  };
  var isString = function(val) {
    return typeof val === "string";
  };
  var isNumber = function(val) {
    return typeof val === "number" && !isNaN(val);
  };
  var isInteger = function(val) {
    return isNumber(val) && Number.isInteger(val);
  };
  var isPosInteger = function(val) {
    return isInteger(val) && val > 0;
  };
  var isPosNumber = function(val) {
    return typeof val === "number" && !isNaN(val) && val > 0;
  };
  var isNonEmptyString = function(val) {
    return typeof val === "string" && val.length > 0;
  };
  var isFunction = function(val) {
    return typeof val === "function";
  };
  var isDate = function(val) {
    return val instanceof Date;
  };
  var isValidDate = function(val) {
    return val instanceof Date && !isNaN(val.getTime());
  };
  var isArray = function(val) {
    return Array.isArray(val);
  };
  var isNonEmptyArray = function(val) {
    return Array.isArray(val) && val.length > 0;
  };
  var isRegExp = function(val) {
    return val instanceof RegExp;
  };
  var isNull = function(val) {
    return val === null ? true : false;
  };
  var isDefined = function(val) {
    return val !== undefined;
  };
  var isDict = function(val) {
    if (!isObject(val)) {
      return false;
    }
    return true;
  };
  var hasValue = function(val) {
    return val !== null && val !== undefined;
  };
  var isEmpty = function(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  };
  var isError = function(val) {
    return val instanceof Error;
  };
  var isObject = function(val) {
    return val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof RegExp);
  };
  var pick = function(obj, ...args) {
    const result = {};
    if (Array.isArray(args[0])) {
      args = args[0];
    }
    args.forEach((key) => {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    });
    return result;
  };
  var omit = function(obj, ...args) {
    if (Array.isArray(args[0])) {
      args = args[0];
    }
    const keys = Object.keys(obj).filter((key) => args.indexOf(key) < 0);
    const newObj = {};
    keys.forEach((k) => {
      newObj[k] = obj[k];
    });
    return newObj;
  };
  var isTrue = function(val) {
    if (typeof val === "number") {
      return val > 0 ? true : false;
    } else if (typeof val === "string") {
      return val.length && !REGEX.isFalse.test(val) ? true : false;
    } else if (typeof val === "boolean") {
      return val;
    }
    return false;
  };
  var isFalse = function(val) {
    if (typeof val === "number") {
      return val === 0 ? true : false;
    } else if (typeof val === "string") {
      return val.length && !REGEX.isTrue.test(val) ? true : false;
    } else if (typeof val === "boolean") {
      return val;
    }
    return false;
  };
  var asFloat = function(val, opts) {
    if (typeof val === "number") {
      return val;
    }
    let v;
    if (isNonEmptyString(val)) {
      let s;
      if (opts && opts.commaAsDecimal) {
        s = val.replace(/(\d)\.(\d)/g, "$1$2").replace(/(\d),/g, "$1.");
      } else {
        s = val.replace(/(\d),(\d)/g, "$1$2");
      }
      v = parseFloat(s);
    } else {
      v = NaN;
    }
    if (isNaN(v)) {
      if (opts && isNumber(opts.def)) {
        return opts.def;
      }
      return 0;
    }
    return v;
  };
  var asInt = function(val) {
    if (isNumber(val)) {
      return Number.isInteger(val) ? val : Math.round(val);
    } else if (isNonEmptyString(val)) {
      let v = parseFloat(val);
      if (isNumber(v)) {
        return Number.isInteger(v) ? v : Math.round(v);
      }
    }
    return 0;
  };
  var asRegExp = function(val) {
    if (isRegExp(val)) {
      return val;
    } else if (isDict(val) && isString(val.pattern)) {
      const keys = Object.keys(val);
      if (isString(val.flags) && keys.length === 2) {
        return new RegExp(val.pattern, val.flags);
      } else if (keys.length === 1) {
        return new RegExp(val.pattern);
      }
    }
  };
  var pad = function(n, width, z = "0") {
    const sn = String(n);
    return sn.length >= width ? sn : new Array(width - sn.length + 1).join(z) + sn;
  };
  var roundNumber = function(num, dec = 3) {
    const factor = Math.pow(10, dec);
    return Math.round(num * factor) / factor;
  };
  var deepCopy = function(a, opts) {
    if (a === undefined || a === null) {
      return a;
    } else if (typeof a === "number") {
      return a;
    } else if (typeof a === "string") {
      if (opts && opts.replace) {
        let r = a;
        Object.keys(opts.replace).forEach((b) => {
          const m = "{" + b + "}";
          if (r.includes(m)) {
            r = r.replace(m, opts.replace[b]);
          }
        });
        return r;
      } else {
        return a;
      }
    } else if (a instanceof Date || a instanceof RegExp) {
      return a;
    } else if (Array.isArray(a)) {
      const result = [];
      for (const b of a) {
        let r = deepCopy(b, opts);
        result.push(r);
      }
      return result;
    } else if (isObject(a)) {
      const re = opts && opts.detectRegExp ? asRegExp(a) : undefined;
      if (re) {
        return re;
      } else {
        const result2 = {};
        Object.keys(a).forEach((key) => {
          result2[key] = deepCopy(a[key], opts);
        });
        return result2;
      }
    }
    return a;
  };
  var deepEquals = function(a, b) {
    const aSet = _isSet(a);
    const bSet = _isSet(b);
    if (!aSet && !bSet) {
      return true;
    }
    if (!aSet || !bSet) {
      return false;
    }
    if (a === b || a.valueOf() === b.valueOf()) {
      return true;
    }
    if (Array.isArray(a) && a.length !== b.length) {
      return false;
    }
    if (a instanceof Date) {
      return false;
    }
    if (!(a instanceof Object)) {
      return false;
    }
    if (!(b instanceof Object)) {
      return false;
    }
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (kb.length === ka.length) {
      return ka.every((k) => {
        return deepEquals(a[k], b[k]);
      });
    }
    return false;
  };
  var _isSet = function(a) {
    if (a === null || a === undefined) {
      return false;
    }
    if (Array.isArray(a) && !a.length) {
      return false;
    }
    if (a instanceof Date) {
      return true;
    }
    if (a instanceof Object && !Object.keys(a).length) {
      return false;
    }
    return true;
  };
  var asError = function(...args) {
    let err;
    const msg = [];
    if (args.length) {
      args.forEach((arg) => {
        if (arg instanceof Error) {
          if (!err) {
            err = arg;
          }
          msg.push(err.message);
        } else if (isString(arg)) {
          msg.push(arg);
        } else {
          msg.push(String(arg));
        }
      });
      if (!err) {
        err = new Error(msg.join(" "));
      } else {
        err.message = msg.join(" ");
      }
    }
    return err;
  };
  var isClass = function(obj, name) {
    return isObject(obj) && obj.constructor.name === name;
  };
  var camelToDash = function(str) {
    return str.replace(REGEX.firstUppercase, ([first]) => first.toLowerCase()).replace(REGEX.allUppercase, ([letter]) => `-${letter.toLowerCase()}`);
  };
  var isType = function(val, ...types) {
    let util2 = new Util(val);
    return util2.isType(...types);
  };
  var util = function() {
    return new Util;
  };
  var utilObj = function(val, opts) {
    return new Util(val, opts);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Util = exports.utilObj = exports.util = exports.isType = exports.camelToDash = exports.isClass = exports.asError = exports.deepEquals = exports.deepCopy = exports.roundNumber = exports.pad = exports.asRegExp = exports.asInt = exports.asFloat = exports.isFalse = exports.isTrue = exports.omit = exports.pick = exports.isObject = exports.isError = exports.isEmpty = exports.hasValue = exports.isDict = exports.isDefined = exports.isNull = exports.isRegExp = exports.isNonEmptyArray = exports.isArray = exports.isValidDate = exports.isDate = exports.isFunction = exports.isNonEmptyString = exports.isPosNumber = exports.isPosInteger = exports.isInteger = exports.isNumber = exports.isString = exports.isBoolean = undefined;
  var REGEX = {
    isTrue: /^true$/i,
    isFalse: /^false$/i,
    customElement: /CustomElement$/,
    firstUppercase: /(^[A-Z])/,
    allUppercase: /([A-Z])/g,
    tr: /^\[tr\](.+)$/,
    html: /[&<>"'\/]/g,
    instr: /^\[([^\]]+)\](.*)$/,
    typeSplit: /\s*[,\|]{1}\s*/
  };
  exports.isBoolean = isBoolean;
  exports.isString = isString;
  exports.isNumber = isNumber;
  exports.isInteger = isInteger;
  exports.isPosInteger = isPosInteger;
  exports.isPosNumber = isPosNumber;
  exports.isNonEmptyString = isNonEmptyString;
  exports.isFunction = isFunction;
  exports.isDate = isDate;
  exports.isValidDate = isValidDate;
  exports.isArray = isArray;
  exports.isNonEmptyArray = isNonEmptyArray;
  exports.isRegExp = isRegExp;
  exports.isNull = isNull;
  exports.isDefined = isDefined;
  exports.isDict = isDict;
  exports.hasValue = hasValue;
  exports.isEmpty = isEmpty;
  exports.isError = isError;
  exports.isObject = isObject;
  exports.pick = pick;
  exports.omit = omit;
  exports.isTrue = isTrue;
  exports.isFalse = isFalse;
  exports.asFloat = asFloat;
  exports.asInt = asInt;
  exports.asRegExp = asRegExp;
  exports.pad = pad;
  exports.roundNumber = roundNumber;
  exports.deepCopy = deepCopy;
  exports.deepEquals = deepEquals;
  exports.asError = asError;
  exports.isClass = isClass;
  exports.camelToDash = camelToDash;
  exports.isType = isType;
  exports.util = util;
  exports.utilObj = utilObj;

  class Util {
    constructor(val, opts = {}) {
      this._path = [];
      this._throw = false;
      this._val = val;
      this._throw = opts.throw === true ? true : false;
      this._src = opts.src;
    }
    reset() {
      this._path = [];
      return this;
    }
    prop(...path) {
      return this.property(...path);
    }
    property(...path) {
      this._path = this._path.concat(this._resolvePath(...path));
      return this;
    }
    source() {
      if (!this._src) {
        return "object";
      }
      if (isString(this._src)) {
        return this._src;
      }
      return this._src.toString();
    }
    throw(v) {
      this._throw = v === true ? true : false;
      return this;
    }
    val() {
      return this.value();
    }
    value() {
      let val = this._val;
      if (this._path.length) {
        for (let i = 0, n = this._path.length;i < n; ++i) {
          const k = this._path[i];
          if (val && (k in val)) {
            val = val[k];
          } else {
            if (this._throw) {
              throw new Error(`Property ${this._path.join(".")} not found in ${this.source()}`);
            }
            return;
          }
        }
      }
      return val;
    }
    _resolvePath(...path) {
      let a = [];
      path.forEach((arg) => {
        if (isString(arg)) {
          arg = arg.replace(/\[(\w+)\]/g, ".$1");
          arg = arg.replace(/^\./, "");
          const args = arg.split(".");
          a = [...a, ...args];
        } else if (isArray(arg)) {
          a = [...a, ...arg];
        }
      });
      return a;
    }
    setVal(value) {
      this.setValue(this._val, value);
      return this;
    }
    setValue(object, value) {
      let a = [];
      if (this._path && this._path.length && isDict(object)) {
        let obj = object;
        const n = this._path.length;
        for (let i = 0;i < n; ++i) {
          const k = this._path[i];
          if (obj) {
            if (i >= n - 1) {
              if (isDict(obj)) {
                obj[k] = value;
              }
            } else {
              if (!(k in obj)) {
                obj[k] = {};
              }
              obj = obj[k];
            }
          }
        }
      }
      return this;
    }
    asBoolean() {
      return isTrue(this.value());
    }
    asInt() {
      return asInt(this.value());
    }
    asFloat() {
      return asFloat(this.value());
    }
    asString() {
      return String(this.value());
    }
    isDict() {
      return isDict(this.value());
    }
    isBoolean() {
      return isBoolean(this.value());
    }
    isString() {
      return isString(this.value());
    }
    isNumber() {
      return isNumber(this.value());
    }
    isPosNumber() {
      return isPosNumber(this.value());
    }
    isInteger() {
      return isInteger(this.value());
    }
    isNonEmptyString() {
      return isNonEmptyString(this.value());
    }
    isFunction() {
      return isFunction(this.value());
    }
    isDate() {
      return isDate(this.value());
    }
    isValidDate() {
      return isValidDate(this.value());
    }
    isArray() {
      return isArray(this.value());
    }
    isNonEmptyArray() {
      return isNonEmptyArray(this.value());
    }
    isRegExp() {
      return isRegExp(this.value());
    }
    isNull() {
      return isNull(this.value());
    }
    isDefined() {
      return isDefined(this.value());
    }
    hasValue() {
      return hasValue(this.value());
    }
    isEmpty() {
      return isEmpty(this.value());
    }
    isError() {
      return isError(this.value());
    }
    isObject() {
      return isObject(this.value());
    }
    isType(...types) {
      let v = this.value();
      let ts = [];
      for (const t of types) {
        if (isNonEmptyString(t)) {
          ts = [...ts, ...t.trim().split(REGEX.typeSplit)];
        } else if (isArray(t)) {
          for (const t1 of t) {
            if (isNonEmptyString(t1)) {
              ts = [...ts, ...t1.split(REGEX.typeSplit)];
            }
          }
        }
      }
      let ts2 = [];
      for (const t of ts) {
        if (isString(t)) {
          let s = t.trim();
          if (s.length) {
            ts2.push(s);
          }
        }
      }
      let errors = [];
      for (const t of ts2) {
        let fn = "is" + t.charAt(0).toUpperCase() + t.slice(1);
        if (isFunction(this[fn])) {
          if (this[fn](v)) {
            return true;
          }
        } else {
          errors.push(t);
        }
      }
      if (errors.length) {
        throw new Error(`Invalid type [${errors.join(",")}]`);
      }
      return false;
    }
  }
  exports.Util = Util;
});

// src/date-util.ts
var import_epdoc_util = __toESM(require_dist(), 1);
function dateUtil(date) {
  return new DateUtil(date);
}

class DateUtil {
  _date;
  _invalidDateString = "Invalid Date";
  constructor(date) {
    this._date = date ? new Date(date) : new Date;
  }
  toISOLocaleString(showMs = true) {
    this.validate();
    const d = this._date;
    let s = String(d.getFullYear()) + "-" + import_epdoc_util.pad(d.getMonth() + 1, 2) + "-" + import_epdoc_util.pad(d.getDate(), 2) + "T" + import_epdoc_util.pad(d.getHours(), 2) + ":" + import_epdoc_util.pad(d.getMinutes(), 2) + ":" + import_epdoc_util.pad(d.getSeconds(), 2);
    if (showMs !== false) {
      s += "." + import_epdoc_util.pad(d.getMilliseconds(), 3);
    }
    s += DateUtil.tz(d.getTimezoneOffset());
    return s;
  }
  validate() {
    if (!import_epdoc_util.isValidDate(this._date)) {
      throw new Error(this._invalidDateString);
    }
  }
  julianDate() {
    this.validate();
    return Math.floor(this._date.getTime() / 86400000 + 2440587.5);
  }
  static tz(m) {
    return (m < 0 ? "+" : "-") + import_epdoc_util.pad(Math.abs(m) / 60, 2) + ":" + import_epdoc_util.pad(Math.abs(m) % 60, 2);
  }
  googleSheetsDate() {
    this.validate();
    const d = this._date;
    const tNull = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0));
    return ((d.getTime() - tNull.getTime()) / 60000 - d.getTimezoneOffset()) / 1440;
  }
}
// src/duration-util.ts
var import_epdoc_util2 = __toESM(require_dist(), 1);
function isFormatMsOptions(val) {
  if (import_epdoc_util2.isDict(val) && import_epdoc_util2.isString(val.d) && import_epdoc_util2.isString(val.h) && import_epdoc_util2.isString(val.m) && import_epdoc_util2.isString(val.s) && import_epdoc_util2.isString(val.ms)) {
    return true;
  }
  return false;
}
function durationUtil(ms, opts) {
  return new DurationUtil(ms, opts);
}
function isFormatName(val) {
  if (import_epdoc_util2.isNonEmptyString(val)) {
    if (val === "hms" || val === ":" || val === "long") {
      return true;
    }
  }
  return false;
}

class DurationUtil {
  static OPTS = {
    hms: { d: "d", h: "h", m: "m", s: "s", ms: "", compact: true, decimal: "." },
    ":": { d: "d", h: ":", m: ":", s: "", ms: "", compact: true, decimal: "." },
    long: {
      d: "day",
      h: "hour",
      m: "minute",
      s: "second",
      ms: "millisecond",
      compact: false,
      sep: ", ",
      decimal: "."
    }
  };
  _opts = DurationUtil.OPTS[":"];
  _decimal;
  _ms = 0;
  constructor(ms, formatting) {
    this._ms = ms;
    if (isFormatName(formatting)) {
      this.options(formatting);
    } else {
      this.options(":").options(formatting);
    }
  }
  options(formatting) {
    if (isFormatName(formatting)) {
      this._opts = import_epdoc_util2.deepCopy(DurationUtil.OPTS[formatting]);
    } else if (import_epdoc_util2.isDict(formatting)) {
      Object.keys(DurationUtil.OPTS.long).forEach((key) => {
        if (formatting.hasOwnProperty(key)) {
          this._opts[key] = formatting[key];
        }
      });
    }
    return this;
  }
  format(formatting) {
    this.options(formatting);
    let ms = this._ms;
    if (ms < 0) {
      ms = -ms;
    }
    const opts = this._opts;
    if (!import_epdoc_util2.isString(opts.ms)) {
      ms = Math.round(ms / 1000) * 1000;
    }
    const time = {
      d: Math.floor(ms / 86400000),
      h: Math.floor(ms / 3600000) % 24,
      m: Math.floor(ms / 60000) % 60,
      s: Math.floor(ms / 1000) % 60,
      ms: Math.floor(ms) % 1000
    };
    if (opts.compact) {
      let res = opts.s;
      if (import_epdoc_util2.isString(opts.ms)) {
        res = opts.decimal + import_epdoc_util2.pad(time.ms, 3) + opts.s;
      }
      if (time.d) {
        return time.d + opts.d + import_epdoc_util2.pad(time.h, 2) + opts.h + import_epdoc_util2.pad(time.m, 2) + opts.m + import_epdoc_util2.pad(Math.floor(time.s), 2) + res;
      } else if (time.h) {
        return time.h + opts.h + import_epdoc_util2.pad(time.m, 2) + opts.m + import_epdoc_util2.pad(Math.floor(time.s), 2) + res;
      } else if (time.m || !import_epdoc_util2.isNonEmptyString(opts.s)) {
        return time.m + opts.m + import_epdoc_util2.pad(Math.floor(time.s), 2) + res;
      }
      return String(time.s) + res;
    } else {
      return Object.entries(time).filter((val) => val[1] !== 0).map(([key, val]) => {
        if (import_epdoc_util2.isString(opts[key])) {
          return `${val} ${opts[key]}${val !== 1 ? "s" : ""}`;
        }
      }).filter((val) => import_epdoc_util2.isNonEmptyString(val)).join(opts.sep);
    }
  }
}
export {
  isFormatName,
  isFormatMsOptions,
  durationUtil,
  dateUtil,
  DurationUtil,
  DateUtil
};
