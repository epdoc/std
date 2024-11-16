import { dateEx } from '@epdoc/datetime';
import { isArray, isDate, isValidDate } from '@epdoc/type';
import { expect } from 'jsr:@std/expect';
import { afterAll, beforeEach, describe, it, test } from 'jsr:@std/testing/bdd';
import os from 'node:os';
import path from 'node:path';
import { FSSpec, fsSpec, FSStats, isFilename, isFilePath, isFolderPath, type SafeCopyOpts } from '../mod.ts';
import { fileConflictStrategyType } from './../types.ts';

const pwd: string = import.meta.dirname as string;
const HOME = os.userInfo().homedir;
const TEST_FILES = ['fs.test.ts', 'fs2.test.ts', 'fs3.test.ts', 'fsbytes.test.ts'];
const TEST_FOLDERS = ['data', 'data1'];
const _TEST_FOLDERS2 = ['.withdot', 'folder-sample', 'test-files'];

describe('fsitem', () => {
  beforeEach(async () => {
    const fs = fsSpec(pwd, 'data');
    await fsSpec(pwd, 'data1').remove({ recursive: true });
    await fs.copyTo(fsSpec(pwd, 'data1'));
    await fsSpec(pwd, 'data2').remove({ recursive: true });
    await fsSpec(pwd, 'data2-01').remove({ recursive: true });
    await fsSpec(pwd, 'data2-02').remove({ recursive: true });
    await fsSpec(pwd, 'data2-03').remove({ recursive: true });
    await fsSpec(pwd, 'data3').remove({ recursive: true });
  });

  afterAll(async () => {
    await fsSpec(pwd, 'data1').remove({ recursive: true });
    await fsSpec(pwd, 'data2').remove({ recursive: true });
    await fsSpec(pwd, 'data2-01').remove({ recursive: true });
    await fsSpec(pwd, 'data2-02').remove({ recursive: true });
    await fsSpec(pwd, 'data2-03').remove({ recursive: true });
    await fsSpec(pwd, 'data3').remove({ recursive: true });
  });

  test('fsGetFolders', () => {
    return fsSpec(pwd)
      .getFolders()
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        return fsSpec(pwd).getFolders();
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(resp.length).toBe(TEST_FOLDERS.length);
        // console.log(resp.map((f) => f.filename));
        resp = resp.sort();
        expect(resp[1].filename).toBe(TEST_FOLDERS[0]);
        expect(resp[0].filename).toBe(TEST_FOLDERS[1]);
        // expect(resp[2].filename).toBe(TEST_FOLDERS[2]);
      });
  });
  test('fsGetFiles', () => {
    const fs0: FSSpec = fsSpec(pwd);
    const fs1 = fsSpec(pwd);
    return fs0
      .getFolders()
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        return fs1.getFiles();
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(resp.length).toBe(TEST_FILES.length);
        resp = FSSpec.sortByFilename(resp);
        // console.log(resp.map((f) => f.filename));
        expect(resp[0].filename).toBe(TEST_FILES[0]);
        expect(resp[1].filename).toBe(TEST_FILES[1]);
        expect(resp[2].filename).toBe(TEST_FILES[2]);
        expect(resp[3].filename).toBe(TEST_FILES[3]);
        return resp;
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(resp.length).toBe(TEST_FILES.length + 0);
        resp = FSSpec.sortByFilename(resp);
        // console.log(resp.map((f) => f.filename));
        expect(resp[0].filename).toBe(TEST_FILES[0]);
        expect(resp[1].filename).toBe(TEST_FILES[1]);
        expect(resp[2].filename).toBe(TEST_FILES[2]);
        expect(resp[3].filename).toBe(TEST_FILES[3]);
      });
  });
  it('getChildren', () => {
    const fs0: FSSpec = fsSpec(pwd);
    const fs1 = fsSpec(pwd);
    return fs0
      .getChildren()
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(isArray(fs0.files)).toBe(true);
        expect(isArray(fs0.folders)).toBe(true);
        return fs1.getChildren();
      })
      .then((resp) => {
        expect(isArray(resp)).toBe(true);
        expect(isArray(fs1.files)).toBe(true);
        expect(isArray(fs1.folders)).toBe(true);
        expect(fs1.files.length).toBe(TEST_FILES.length);
        expect(fs1.folders.length).toBe(2);
        fs1.sortChildren();
        expect(fs1.folders[0].filename).toMatch(/^data$/);
      });
  });
  test('setExt', () => {
    const PATH = './mypath/to/file/sample.json';
    const EXPECTED = './mypath/to/file/sample.rsc';
    const fs = fsSpec(PATH);
    expect(fs.setExt('txt').extname).toEqual('.txt');
    expect(fs.setExt('rsc').path).toEqual(EXPECTED);
  });
  test('setBasename', () => {
    const PATH = './mypath/to/file/sample.less.json';
    const EXPECTED = './mypath/to/file/sample.more.json';
    const fs = fsSpec(PATH);
    fs.setBasename('sample.more');
    expect(fs.path).toEqual(EXPECTED);
    expect(fs.basename).toEqual('sample.more');
  });
  test('isDir', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd).isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec(pwd, 'data1').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fsExists', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd).exists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec(pwd, 'data1').exists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs dirExists', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd).dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec(pwd, 'data1').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs fileExists', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd).fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsSpec(pwd, 'data1').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsSpec(pwd, 'data1/sample.txt').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('fs Stats', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd).getStats();
      })
      .then((stats) => {
        expect(stats instanceof FSStats).toBe(true);
        expect(stats.exists()).toBe(true);
        expect(stats.isDirectory()).toBe(true);
        expect(stats.isFile()).toBe(false);
        expect(isValidDate(stats.createdAt())).toBe(true);
        expect(stats.size).toBe(256);
      });
  });
  test('constructor with .folder', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd).dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec(pwd, 'data/.withdot').dirExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec(pwd, 'data/.withdot/dotsample.json').fileExists();
      })
      .then((resp) => {
        expect(resp).toBe(true);
      });
  });
  test('constructor', () => {
    expect(fsSpec('home', 'file.json').basename).toBe('file');
    expect(fsSpec('/home', 'file.json').path).toBe('/home/file.json');
  });
  test('constructor with HOME', () => {
    const fs = new FSSpec().home().add('.folder').add('file.txt');
    expect(fs.path).toBe(path.resolve(HOME, '.folder', 'file.txt'));
    expect(fs.filename).toBe('file.txt');
    expect(fs.parts[0]).toEqual(HOME);
    expect(fs.parts[1]).toEqual('.folder');
    expect(fs.parts[2]).toEqual('file.txt');
  });
  test('guards', () => {
    expect(isFilename('hello')).toBe(true);
    expect(isFilePath('hello')).toBe(true);
    expect(isFilePath('~/xx/hello')).toBe(true);
    expect(isFolderPath('~/xx/hello')).toBe(true);
  });
  test('isType', () => {
    expect(fsSpec('file.json').isType('json')).toBe(true);
    expect(fsSpec('file.json').isType('jsson')).toBe(false);
    expect(fsSpec('file.JSON').isType('jsson', 'json')).toBe(true);
    expect(fsSpec('file.txt').isType('jsson', 'JSON')).toBe(false);
    expect(fsSpec('file.json').isType('jsson', 'JSON')).toBe(true);
    expect(fsSpec('file.json').isType(/^json$/)).toBe(true);
    expect(fsSpec('file.json').isType(/^JSON$/)).toBe(false);
    expect(fsSpec('file.json').isType(/^JSON$/i)).toBe(true);
    expect(fsSpec('file.json').isJson()).toBe(true);
    expect(fsSpec('file.JSON').isJson()).toBe(true);
    expect(fsSpec('file.JSON').isPdf()).toBe(false);
    expect(fsSpec('file.JSON').isTxt()).toBe(false);
    expect(fsSpec('file.JSON').isXml()).toBe(false);
    expect(fsSpec('file.PDF').isPdf()).toBe(true);
    expect(fsSpec('file.pdf').isPdf()).toBe(true);
    expect(fsSpec('file.xml').isXml()).toBe(true);
    expect(fsSpec('file.TXT').isTxt()).toBe(true);
    expect(fsSpec('file.TXT').isNamed('file')).toBe(true);
    expect(fsSpec('file.TXT').isNamed('TXT')).toBe(false);
  });
  test('getPdfDate', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd, 'data', '.withdot/text alignment.pdf').getPdfDate();
      })
      .then((resp) => {
        expect(isValidDate(resp)).toBe(true);
        if (isDate(resp)) {
          Deno.env.set('TZ', 'America/Costa_Rica');
          expect(new Date(resp).toISOString()).toBe('2018-02-01T00:00:00.000Z');
          expect(dateEx(resp).toISOLocalString()).toBe('2018-01-31T18:00:00.000-06:00');
        }
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  });
  test('ext', () => {
    const fs = fsSpec(pwd, 'xxx.jpg');
    fs.setExt('.txt');
    expect(fs.extname).toEqual('.txt');
    fs.setExt('pdf');
    expect(fs.extname).toEqual('.pdf');
    fs.setExt('jpg');
    expect(fs.extname).toEqual('.jpg');
    fs.setExt('.jpg');
    expect(fs.extname).toEqual('.jpg');
  });
  test('checksum', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd, 'data1/sample.txt').checksum();
      })
      .then((resp) => {
        expect(resp).toBe('cacc6f06ae07f842663cb1b1722cafbee9b4d203');
      });
  });
  test('newError string', () => {
    const fs = new FSSpec('my/path/to/file.txt');
    const err = fs.newError(23, 'my message');
    // @ts-ignore xxx
    expect(err.code).toEqual(23);
    expect(err.message).toEqual('my message: my/path/to/file.txt');
    expect(fs.parts.length).toEqual(1);
    expect(fs.parts[0]).toEqual('my/path/to/file.txt');
  });
  test('newError Error', () => {
    const fs = new FSSpec('my/path/to', 'file.txt');
    const err0 = new Error('hello');
    const err = fs.newError(err0);
    // @ts-ignore xxx
    expect(err.code).toBeUndefined();
    const val = path.resolve('my/path/to', 'file.txt');
    expect(err.message).toEqual('hello: ' + val);
    expect(fs.parts.length).toEqual(2);
    expect(fs.parts[0]).toEqual('my/path/to');
    expect(fs.parts[1]).toEqual('file.txt');
  });
  test('fsEqual', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd, 'fs.test.ts').filesEqual(fsSpec(pwd, 'fs.test.ts'));
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec('./tests/fs.test.ts').filesEqual('./tests/data1/sample.txt');
      })
      .then((resp) => {
        expect(resp).toBe(false);
        return fsSpec('./tests/data1/sample.txt').filesEqual('./tests');
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });
  test('fsEnsureDir fsitem.Remove', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec('./tests').ensureDir();
      })
      .then((_resp) => {
        return fsSpec('./tests/data1/tmp1').ensureDir();
      })
      .then((_resp) => {
        return fsSpec('./tests/data1/tmp1').isDir();
      })
      .then((_resp) => {
        expect(_resp).toBe(true);
        return fsSpec('./tests/data1/tmp1').remove();
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsSpec('./tests/data1/tmp1').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });
  test('fsEnsureDir no file', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec('./tests/data1/tmp.txt').ensureDir();
      })
      .then((_resp) => {
        return fsSpec('./tests/data1/tmp.txt').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec('./tests/data1/tmp.txt').remove();
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsSpec('./tests/data1/tmp.txt').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });
  test('fsCopy fsitem.Move', () => {
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd, 'data1').copyTo(fsSpec(pwd, 'data2'), { preserveTimestamps: true });
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsSpec(pwd, 'data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data2/folder-sample').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data2/folder-sample/sample2.txt').isFile();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data2/folder-sample/sample2.txt').filesEqual(
          fsSpec(pwd, 'data1/folder-sample/sample2.txt'),
        );
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec(pwd, 'data2').moveTo(fsSpec(pwd, 'data3'));
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsSpec(pwd, 'data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(false);
        return fsSpec(pwd, 'data3').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data3').remove({ recursive: true });
      })
      .then((resp) => {
        expect(resp).toBeUndefined();
        return fsSpec(pwd, 'data3').isDir();
      })
      .then((resp) => {
        expect(resp).toBe(false);
      });
  });

  test('safeCopy', () => {
    return Promise.resolve()
      .then((_resp) => {
        const opts: SafeCopyOpts = {
          ensureParentDirs: true,
        };
        return fsSpec(pwd, 'data1').safeCopy(fsSpec(pwd, 'data2'), opts);
      })
      .then((resp) => {
        expect(resp).toBe(true);
        return fsSpec(pwd, 'data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data2/folder-sample').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data2/folder-sample/sample2.txt').isFile();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data2/folder-sample/sample2.txt').filesEqual(
          fsSpec(pwd, 'data1/folder-sample/sample2.txt'),
        );
      })
      .then((resp) => {
        expect(resp).toBe(true);
        const opts: SafeCopyOpts = {
          ensureParentDirs: false,
          conflictStrategy: { type: fileConflictStrategyType.renameWithNumber, limit: 5 },
        };
        return fsSpec(pwd, 'data1').safeCopy(fsSpec(pwd, 'data2'), opts);
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data2').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
        return fsSpec(pwd, 'data2-01').isDir();
      })
      .then((resp) => {
        expect(resp).toEqual(true);
      });
  });

  test('json', async () => {
    const SRC = 'data1/folder-sample/sample.json';
    const DEST = 'data1/folder-sample/sample-copy.json';
    const json = await fsSpec(pwd, SRC).readJson();
    await fsSpec(pwd, DEST).writeJson(json);
    expect(await fsSpec(pwd, DEST).isFile()).toEqual(true);
    const json2 = await fsSpec(pwd, DEST).readJson();
    expect(json2).toEqual(json);
  });
  test('json err', () => {
    const SRC = 'data/.withdot/broken.json';
    return Promise.resolve()
      .then((_resp) => {
        return fsSpec(pwd, SRC).readJson();
      })
      .then((_resp) => {
        expect(true).toBe(false);
      })
      .catch((err) => {
        expect(err.message).toContain('Bad control character in string literal in JSON at position 120');
      });
  });

  test('deep json', async () => {
    const opts = { pre: '{{', post: '}}', includeUrl: true };
    const SRC = 'data1/folder-sample/sample-nested.json';
    const SRC2 = 'data1/folder-sample/sample-compare.json';
    const json2 = await fsSpec(pwd, SRC2).readJson();
    const json = await fsSpec(pwd, SRC).deepReadJson(opts);
    expect(json2).toEqual(json);
  });

  test('write utf8', async () => {
    const sin = 'here is a line of text';
    const DEST = 'data1/folder-sample/output.txt';
    await fsSpec(pwd, DEST).write(sin);
    expect(await fsSpec(pwd, DEST).isFile()).toEqual(true);
    const s = await fsSpec(pwd, DEST).readAsString();
    expect(s).toEqual(sin);
  });
  test('write lines', async () => {
    const lines = ['this', 'is', 'line 2'];
    const DEST = 'data1/folder-sample/output.txt';
    await fsSpec(pwd, DEST).write(lines);
    expect(await fsSpec(pwd, DEST).isFile()).toEqual(true);
    const s = await fsSpec(pwd, DEST).readAsString();
    expect(s).toEqual(lines.join('\n'));
  });

  test('readAsString', async () => {
    const SRC = 'data/sample.txt';
    const result = 'This is sample.txt. \nDo not edit or move this file.\n';
    const str = await fsSpec(pwd, SRC).readAsString();
    console.log(str);
    expect(str).toEqual(result);
  });
  test('path resolve', () => {
    const _SRC = 'data/sample.json';
    const _result = 'This is sample.txt.\\nDo not edit or move this file.';
    const fsitem = new FSSpec('/', 'the', 'path', 'goes', 'right.here.txt');
    expect(fsitem.path).toEqual('/the/path/goes/right.here.txt');
    expect(fsitem.dirname).toEqual('/the/path/goes');
    expect(fsitem.extname).toEqual('.txt');
    expect(fsitem.basename).toEqual('right.here');
    expect(fsitem.isType('txt')).toEqual(true);
    expect(fsitem.isTxt()).toEqual(true);
    expect(fsitem.isJson()).toEqual(false);
    expect(fsitem.isType('json', 'txt')).toEqual(true);
    expect(fsitem.isType('json', 'pdf')).toEqual(false);
    expect(fsitem.isType('txt', 'pdf')).toEqual(true);
  });

  it('readAsLines', async () => {
    const filePath = path.join(pwd as string, 'data/test-files', 'continuation_sample.txt');
    const fsItem = new FSSpec(filePath);

    const lines = await fsItem.readAsLines('\\');

    expect(lines).toEqual([
      'This is a line',
      'This is a continued line that spans multiple lines',
      'This is a normal line',
      'Another continued line example',
      'Final line',
    ]);
  });
});
