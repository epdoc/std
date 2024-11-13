import { msub } from '@epdoc/string';
import { expect } from 'jsr:@std/expect';
const msub1: msub.MSub = msub.createMSub({ open: '{[' });
// const msub2: msub.MSub = msub.createMSub({ open: '{{', uppercase: true });

const result1 = msub1.replace('My {[body]}', { body: 'nose' });
expect(result1).toBe('My nose');

// const result2 = msub2.replace('My {{BODY}}', { body: 'fingers' });
// expect(result2).toBe('My fingers');

const result3 = msub.init({ open: '<<' }).replace('My <<body>>', { body: 'eyes' });
expect(result3).toBe('My eyes');
