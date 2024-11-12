import { msub } from '@epdoc/string';
const obj1 = ['instance', 'string'];
console.log(msub.replace('This ${0} of ${1} actually belongs in the string', obj1));
//This instance of string actually belongs in the string
const obj2 = { s: 'instance' };
console.log(msub.replace('This ${s} of ${0} actually belongs in the string', obj2));
// This instance of ${0} actually belongs in the string
