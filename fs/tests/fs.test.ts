import { dateEx } from '@epdoc/datetime';
import { isArray, isDate, isValidDate } from '@epdoc/type';
import { expect } from 'jsr:@std/expect';
import { afterAll, beforeEach, describe, it, test } from 'jsr:@std/testing/bdd';
import os from 'node:os';
import path from 'node:path';
import { FSError } from '../error.ts';
import {
  DigestAlgorithm,
  fileConflictStrategyType,
  FileSpec,
  fileSpec,
  FolderSpec,
  folderSpec,
  fsSpec,
  isFilename,
  isFilePath,
  isFolderPath,
  type SafeCopyOpts,
} from '../mod.ts';

const pwd: string = import.meta.dirname as string;
const HOME = os.userInfo().homedir;
const TEST_FILES = ['fs.test.ts', 'fs2.test.ts', 'fs3.test.ts', 'fsbytes.test.ts'];
const TEST_FOLDERS = ['data', 'data1'];
const TEST_FOLDERS2 = [];

describe('FSSpec Tests Part 1', () => {
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

  describe('Section 1', () => {
    test('fsGetFolders', () => {
      return folderSpec(pwd)
        .getFolders()
        .then((resp) => {
          expect(isArray(resp)).toBe(true);
          return folderSpec(pwd).getFolders(/^data/);
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
      const fs0: FolderSpec = folderSpec(pwd);
      const fs1 = folderSpec(pwd);
      return fs0
        .getFolders()
        .then((resp) => {
          expect(isArray(resp)).toBe(true);
          return fs1.getFiles();
        })
        .then((resp: FileSpec[]) => {
          expect(isArray(resp)).toBe(true);
          expect(resp.length).toBe(TEST_FILES.length);
          const sortedFiles = FolderSpec.sortByFilename(resp);
          // console.log(resp.map((f) => f.filename));
          expect(sortedFiles[0].filename).toBe(TEST_FILES[0]);
          expect(sortedFiles[1].filename).toBe(TEST_FILES[1]);
          expect(sortedFiles[2].filename).toBe(TEST_FILES[2]);
          expect(sortedFiles[3].filename).toBe(TEST_FILES[3]);
          return sortedFiles;
        })
        .then((resp) => {
          expect(isArray(resp)).toBe(true);
          expect(resp.length).toBe(TEST_FILES.length + 0);
          resp = FolderSpec.sortByFilename(resp);
          // console.log(resp.map((f) => f.filename));
          expect(resp[0].filename).toBe(TEST_FILES[0]);
          expect(resp[1].filename).toBe(TEST_FILES[1]);
          expect(resp[2].filename).toBe(TEST_FILES[2]);
          expect(resp[3].filename).toBe(TEST_FILES[3]);
        });
    });
    it('getChildren', () => {
      const folder0: FolderSpec = folderSpec(pwd);
      const folder1 = folderSpec(pwd);
      return folder0
        .getChildren()
        .then((resp) => {
          expect(isArray(resp)).toBe(true);
          expect(isArray(folder0.files)).toBe(true);
          expect(isArray(folder0.folders)).toBe(true);
          return folder1.getChildren();
        })
        .then((all) => {
          expect(isArray(all)).toBe(true);
          expect(isArray(folder1.files)).toBe(true);
          expect(isArray(folder1.folders)).toBe(true);
          expect(folder1.files.length).toBe(TEST_FILES.length);
          expect(folder1.folders.length).toBe(TEST_FOLDERS.length + TEST_FOLDERS2.length);
          folder1.sortChildren();
          expect(folder1.folders[0].filename).toEqual(TEST_FOLDERS[0]);
          expect(folder1.folders[1].filename).toEqual(TEST_FOLDERS[1]);
        });
    });
    test('setExt', () => {
      const PATH = './mypath/to/file/sample.json';
      const EXPECTED = `${Deno.cwd()}/mypath/to/file/sample.rsc`;
      const fs = fileSpec(PATH);
      expect(fs.setExt('txt').extname).toEqual('.txt');
      expect(fs.setExt('rsc').path).toEqual(EXPECTED);
    });
    test('setBasename', () => {
      const PATH = './mypath/to/file/sample.less.json';
      const EXPECTED = `${Deno.cwd()}/mypath/to/file/sample.more.json`;
      const fs: FileSpec = fileSpec(PATH);
      fs.setBasename('sample.more');
      expect(fs.path).toEqual(EXPECTED);
      expect(fs.basename).toEqual('sample.more');
    });
    test('isDir', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fsSpec(pwd).getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FolderSpec).toBe(true);
          return fsSpec(pwd, 'data1').getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FolderSpec).toBe(true);
        });
    });
    test('fsExists', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fsSpec(pwd).getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FileSpec || resp instanceof FolderSpec).toBe(true);
          return fsSpec(pwd, 'data1').getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FileSpec || resp instanceof FolderSpec).toBe(true);
        });
    });
    test('fs dirExists', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fsSpec(pwd).getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FolderSpec).toBe(true);
          return fsSpec(pwd, 'data1').getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FolderSpec).toBe(true);
        });
    });
    test('fs fileExists', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fsSpec(pwd).getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FolderSpec).toBe(true);
          expect(resp instanceof FileSpec).toBe(false);
          return fsSpec(pwd, 'data1').getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FolderSpec).toBe(true);
          expect(resp instanceof FileSpec).toBe(false);
          return fsSpec(pwd, 'data1/sample.txt').getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FolderSpec).toBe(false);
          expect(resp instanceof FileSpec).toBe(true);
        });
    });
    test('fs Stats', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fsSpec(pwd).getResolvedType();
        })
        .then((fs) => {
          expect(fs instanceof FolderSpec).toBe(true);
          expect(fs.exists()).toBe(true);
          expect(fs instanceof FileSpec).toBe(false);
          expect(isValidDate(fs.createdAt())).toBe(true);
        });
    });
    test('fs getResolvedType', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fsSpec(pwd, 'data1/sample.txt').getResolvedType();
        })
        .then((fs) => {
          expect(fs instanceof FileSpec).toBe(true);
          expect((fs as FileSpec).size()).toBe(52);
        });
    });
    test('constructor with .folder', () => {
      return Promise.resolve()
        .then((_resp) => {
          expect(fsSpec(pwd).exists()).toBe(undefined);
          return fsSpec(pwd).getExists();
        })
        .then((resp) => {
          expect(resp).toBe(true);
          return fsSpec(pwd, 'data/.withdot').getExists();
        })
        .then((resp) => {
          expect(resp).toBe(true);
          return fsSpec(pwd, 'data/.withdot/dotsample.json').getExists();
        })
        .then((resp) => {
          expect(resp).toBe(true);
        });
    });
    test('constructor', () => {
      expect(fileSpec('home', 'file.json').basename).toBe('file');
      expect(fileSpec('/home', 'file.json').path).toBe('/home/file.json');
    });
    test('constructor with HOME', () => {
      const fs = new FileSpec().home().add('.folder').add('file.txt');
      expect(fs.path).toBe(path.resolve(HOME, '.folder', 'file.txt'));
      expect(fs.filename).toBe('file.txt');
    });
    test('guards', () => {
      expect(isFilename('hello')).toBe(true);
      expect(isFilePath('hello')).toBe(true);
      expect(isFilePath('~/xx/hello')).toBe(true);
      expect(isFolderPath('~/xx/hello')).toBe(true);
    });
    test('isType', () => {
      expect(fileSpec('file.json').isExtType('json')).toBe(true);
      expect(fileSpec('file.json').isExtType('jsson')).toBe(false);
      expect(fileSpec('file.JSON').isExtType('jsson', 'json')).toBe(true);
      expect(fileSpec('file.txt').isExtType('jsson', 'JSON')).toBe(false);
      expect(fileSpec('file.json').isExtType('jsson', 'JSON')).toBe(true);
      expect(fileSpec('file.json').isExtType(/^json$/)).toBe(true);
      expect(fileSpec('file.json').isExtType(/^JSON$/)).toBe(false);
      expect(fileSpec('file.json').isExtType(/^JSON$/i)).toBe(true);
      expect(fileSpec('file.json').isJson()).toBe(true);
      expect(fileSpec('file.JSON').isJson()).toBe(true);
      expect(fileSpec('file.JSON').isPdf()).toBe(false);
      expect(fileSpec('file.JSON').isTxt()).toBe(false);
      expect(fileSpec('file.JSON').isXml()).toBe(false);
      expect(fileSpec('file.PDF').isPdf()).toBe(true);
      expect(fileSpec('file.pdf').isPdf()).toBe(true);
      expect(fileSpec('file.xml').isXml()).toBe(true);
      expect(fileSpec('file.TXT').isTxt()).toBe(true);
      expect(fileSpec('file.TXT').isNamed('file')).toBe(true);
      expect(fileSpec('file.TXT').isNamed('TXT')).toBe(false);
    });
    test('getPdfDate', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data', '.withdot/text_alignment.pdf');
        })
        .then((resp) => {
          expect(resp instanceof FileSpec).toBe(true);
          if (resp instanceof FileSpec) {
            return resp.getPdfDate();
          }
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
      const fs = fileSpec(pwd, 'xxx.jpg');
      fs.setExt('.txt');
      expect(fs.extname).toEqual('.txt');
      fs.setExt('pdf');
      expect(fs.extname).toEqual('.pdf');
      fs.setExt('jpg');
      expect(fs.extname).toEqual('.jpg');
      fs.setExt('.jpg');
      expect(fs.extname).toEqual('.jpg');
    });
    test('newError string', () => {
      const opts = { code: 'EEXISTS', path: 'my/path/to/file.txt', cause: 'readFile' };
      const err = new FSError('my message', opts);
      // @ts-ignore xxx
      expect(err.code).toEqual(opts.code);
      expect(err.message).toEqual('my message');
      expect(err.path).toEqual(opts.path);
      expect(err.cause).toEqual(opts.cause);
    });
  });
  describe('digest', () => {
    test.skip('checksum', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').checksum();
        })
        .then((resp) => {
          expect(resp).toBe('cacc6f06ae07f842663cb1b1722cafbee9b4d203');
        });
    });
    test('digest sha1', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').digest();
        })
        .then((resp) => {
          expect(resp).toBe('cacc6f06ae07f842663cb1b1722cafbee9b4d203');
        });
    });
    test('digest sha256', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').digest(DigestAlgorithm.sha256);
        })
        .then((resp) => {
          expect(resp).toBe('8046c06d368ab746568e7af455af4d80c543bde005c7655a33e5fb009ca5cd3f');
        });
    });
    test('digest sha512', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').digest(DigestAlgorithm.sha512);
        })
        .then((resp) => {
          expect(resp).toBe(
            'db22c7cec11a4ab069d90313723da4f2b46e67f2cfb588a8af86cb4c0aa186b7bd43ce3b5fd60912da2bac8f00aac49c61d211c4d30a7d6aa1ef70da6bed9fce',
          );
        });
    });
    test('digest md5Sha1', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').digest(DigestAlgorithm.md5Sha1);
        })
        .then((resp) => {
          expect(resp).toBe('baf56296a07d4fd879fd9001146d1cc7cacc6f06ae07f842663cb1b1722cafbee9b4d203');
        });
    });
    test('digest ripemd', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').digest(DigestAlgorithm.ripemd);
        })
        .then((resp) => {
          expect(resp).toBe('802f1b408a5700b090cfd829568496bc74ca2d06');
        });
    });
    test('digest ripemd160', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').digest(DigestAlgorithm.ripemd160);
        })
        .then((resp) => {
          expect(resp).toBe('802f1b408a5700b090cfd829568496bc74ca2d06');
        });
    });
    test('digest blake2s256', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').digest(DigestAlgorithm.blake2s256);
        })
        .then((resp) => {
          expect(resp).toBe('054fbfd5c184cf6765a3a14275c0f965bde56405bc7894aa92aba99e841a9482');
        });
    });
    test('digest blake2b512', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'data1/sample.txt').digest(DigestAlgorithm.blake2b512);
        })
        .then((resp) => {
          expect(resp).toBe(
            'ef09fb6becf651c57fe7ddd9be382820c0d96b5798f9391b23c4d00ab16ef3ecba2b9f9a661f9424b1e406134e82a809636449f31fbd6360102a10374e8181e8',
          );
        });
    });
  });
  describe.skip('Section 2', () => {
    test('fsEqual', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, 'fs.test.ts').filesEqual(fileSpec(pwd, 'fs.test.ts'));
        })
        .then((resp) => {
          expect(resp).toBe(true);
          return fileSpec('./tests/fs.test.ts').filesEqual('./tests/data1/sample.txt');
        })
        .then((resp) => {
          expect(resp).toBe(false);
          return fileSpec('./tests/data1/sample.txt').filesEqual('./tests');
        })
        .then((resp) => {
          expect(resp).toBe(false);
        });
    });
  });
  describe.skip('Section 3', () => {
    test('fsEnsureDir fsitem.Remove', () => {
      return Promise.resolve()
        .then((_resp) => {
          return folderSpec('./tests').ensureDir();
        })
        .then((_resp) => {
          return folderSpec('./tests/data1/tmp1').ensureDir();
        })
        .then((_resp) => {
          return fsSpec('./tests/data1/tmp1').getResolvedType();
        })
        .then((resp) => {
          expect(resp instanceof FolderSpec).toBe(true);
          return fsSpec('./tests/data1/tmp1').remove();
        })
        .then((resp) => {
          expect(resp).toBeUndefined();
          return fsSpec('./tests/data1/tmp1').getIsFolder();
        })
        .then((resp) => {
          expect(resp).toBe(false);
        });
    });
  });
  describe.skip('Section 4', () => {
    test('fsEnsureDir no file', () => {
      return Promise.resolve()
        .then((_resp) => {
          return folderSpec('./tests/data1/tmp.txt').ensureDir();
        })
        .then((_resp) => {
          return fsSpec('./tests/data1/tmp.txt').getIsFolder();
        })
        .then((resp) => {
          expect(resp).toBe(true);
          return fsSpec('./tests/data1/tmp.txt').remove();
        })
        .then((resp) => {
          expect(resp).toBeUndefined();
          return fsSpec('./tests/data1/tmp.txt').getExists();
        })
        .then((resp) => {
          expect(resp).toBe(false);
          return fsSpec('./tests/data1/tmp.txt').getIsFolder();
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
          return fsSpec(pwd, 'data2').getIsFolder();
        })
        .then((resp) => {
          expect(resp).toEqual(true);
          return fsSpec(pwd, 'data2/folder-sample').getIsFolder();
        })
        .then((resp) => {
          expect(resp).toEqual(true);
          return fsSpec(pwd, 'data2/folder-sample/sample2.txt').getIsFile();
        })
        .then((resp) => {
          expect(resp).toEqual(true);
          return fileSpec(pwd, 'data2/folder-sample/sample2.txt').filesEqual(
            fileSpec(pwd, 'data1/folder-sample/sample2.txt'),
          );
        })
        .then((resp) => {
          expect(resp).toBe(true);
          return fsSpec(pwd, 'data2').moveTo(fsSpec(pwd, 'data3'));
        })
        .then((resp) => {
          expect(resp).toBeUndefined();
          return fsSpec(pwd, 'data2').getIsFolder();
        })
        .then((resp) => {
          expect(resp).toEqual(false);
          return fsSpec(pwd, 'data3').getIsFolder();
        })
        .then((resp) => {
          expect(resp).toEqual(true);
          return fsSpec(pwd, 'data3').remove({ recursive: true });
        })
        .then((resp) => {
          expect(resp).toBeUndefined();
          return fsSpec(pwd, 'data3').getIsFolder();
        })
        .then((resp) => {
          expect(resp).toBe(false);
        });
    });

    test('safeCopy', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fsSpec(pwd, 'data').getResolvedType();
        })
        .then((srcFolderSpec) => {
          expect(srcFolderSpec).toBeInstanceOf(FolderSpec);
          const dest = new FolderSpec(pwd, 'data2');
          return (srcFolderSpec as FolderSpec).safeCopy(dest);
        })
        .then(async () => {
          expect(await fsSpec(pwd, 'data2').getIsFolder()).toBe(true);
          expect(await fsSpec(pwd, 'data2', 'folder-sample').getIsFolder()).toBe(true);
          expect(await fsSpec(pwd, 'data2', 'folder-sample', 'sample2.txt').getIsFile()).toBe(true);
        })
        .then(() => {
          return fileSpec(pwd, 'data2/folder-sample/sample2.txt').filesEqual(
            fileSpec(pwd, 'data1/folder-sample/sample2.txt'),
          );
        })
        .then((resp) => {
          expect(resp).toBe(true);
        });
    });

    test('safeCopy conflict', () => {
      return Promise.resolve()
        .then((_resp) => {
          return fsSpec(pwd, 'data1').getResolvedType();
        })
        .then((resp) => {
          const opts: SafeCopyOpts = {
            conflictStrategy: { type: fileConflictStrategyType.renameWithNumber, limit: 5 },
          };
          if (resp instanceof FileSpec || resp instanceof FolderSpec) {
            return resp.safeCopy(folderSpec(pwd, 'data2'), opts);
          }
          return Promise.resolve();
        })
        .then(async () => {
          expect(await fsSpec(pwd, 'data2').getIsFolder()).toBe(true);
          expect(await fsSpec(pwd, 'data2-01').getIsFolder()).toBe(false);
        });
    });

    test('json', async () => {
      const SRC = 'data1/folder-sample/sample.json';
      const DEST = 'data1/folder-sample/sample-copy.json';
      const json = await fileSpec(pwd, SRC).readJson();
      await fileSpec(pwd, DEST).writeJson(json);
      expect(await fsSpec(pwd, DEST).getIsFile()).toEqual(true);
      const json2 = await fileSpec(pwd, DEST).readJson();
      expect(json2).toEqual(json);
    });
    test('json err', () => {
      const SRC = 'data/.withdot/broken.json';
      return Promise.resolve()
        .then((_resp) => {
          return fileSpec(pwd, SRC).readJson();
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
      const json2 = await fileSpec(pwd, SRC2).readJson();
      const json = await fileSpec(pwd, SRC).deepReadJson(opts);
      expect(json2).toEqual(json);
    });

    test('write utf8', async () => {
      const sin = 'here is a line of text';
      const DEST = 'data1/folder-sample/output.txt';
      await fileSpec(pwd, DEST).write(sin);
      expect(await fsSpec(pwd, DEST).getIsFile()).toEqual(true);
      const s = await fileSpec(pwd, DEST).readAsString();
      expect(s).toEqual(sin);
    });
    test('write lines', async () => {
      const lines = ['this', 'is', 'line 2'];
      const DEST = 'data1/folder-sample/output.txt';
      await fileSpec(pwd, DEST).write(lines);
      expect(await fsSpec(pwd, DEST).getIsFile()).toEqual(true);
      const s = await fileSpec(pwd, DEST).readAsString();
      expect(s).toEqual(lines.join('\n'));
    });

    test('readAsString', async () => {
      const SRC = 'data/sample.txt';
      const result = 'This is sample.txt. \nDo not edit or move this file.\n';
      const str = await fileSpec(pwd, SRC).readAsString();
      console.log(str);
      expect(str).toEqual(result);
    });
    test('path resolve', () => {
      const _SRC = 'data/sample.json';
      const _result = 'This is sample.txt.\\nDo not edit or move this file.';
      const fsitem = new FileSpec('/', 'the', 'path', 'goes', 'right.here.txt');
      expect(fsitem.path).toEqual('/the/path/goes/right.here.txt');
      expect(fsitem.dirname).toEqual('/the/path/goes');
      expect(fsitem.extname).toEqual('.txt');
      expect(fsitem.basename).toEqual('right.here');
      expect(fsitem.isExtType('txt')).toEqual(true);
      expect(fsitem.isTxt()).toEqual(true);
      expect(fsitem.isJson()).toEqual(false);
      expect(fsitem.isExtType('json', 'txt')).toEqual(true);
      expect(fsitem.isExtType('json', 'pdf')).toEqual(false);
      expect(fsitem.isExtType('txt', 'pdf')).toEqual(true);
    });

    it('readAsLines', async () => {
      const filePath = path.join(pwd as string, 'data/test-files', 'continuation_sample.txt');
      const fsItem = new FileSpec(filePath);

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
});
