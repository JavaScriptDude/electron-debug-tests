/*
  nodeErrPerf.js
  Use node.js version 4 or up
  Usage: node nodeErrPerf.js <class> <read-stack>
  @author: Timothy C. Quinn

  - This code is to test out the performance of Error creation on node.js
  - Please only use this in Node.js 4 or up as it uses ES6 features
  - This code utilizes call stack randomization in order to bypass any
      possible stack processing optimizations that may exist in V8

    performance hit of getCallerInfo:
    - No caller: 3.279/100000 = 0.033ms
    - w/ caller: 6.690/100000 = 0.067ms
    - Cost: 0.034ms

    Also, setting: in node args: --stack-trace-limit=20

  tests to run:
      node ./nodeErrPerf.js 'Error no stack' Error false &
      node ./nodeErrPerf.js 'Error w/ stack' Error true &
      node ./nodeErrPerf.js 'MyErr no stack' MyErr false &
      node ./nodeErrPerf.js 'MyErr w/ stack' MyErr true &
      node ./nodeErrPerf.js 'Dog no getCaller' 'Dog' false false
      node ./nodeErrPerf.js 'Dog w/ getCaller' 'Dog' false true

  tests to run = setting stack trace limit globally:
      node --stack-trace-limit=20 ./nodeErrPerf.js 'Error no stack (limit 20)' Error false &
      node --stack-trace-limit=20 ./nodeErrPerf.js 'Error w/ stack (limit 20)' Error true &
      node --stack-trace-limit=2 ./nodeErrPerf.js 'Error no stack (limit 2)' Error false &
      node --stack-trace-limit=2 ./nodeErrPerf.js 'Error w/ stack (limit 2)' Error true &


*/
'use strict'
var util = require('util')

const ITERATIONS=100000


function doTests(){

    var tName,clazz,getStack,getCaller;

    if(process.argv.length < 4){throw new Error('Need two or three args passed')}
    tName = process.argv[2]
    clazz = process.argv[3]
    if(process.argv.length > 4){
        getStack = process.argv[4]
    }
    if(process.argv.length > 5){
        getCaller = process.argv[5]
    }
// console.log(`
//     process.argv = ${process.argv}
//     tName = ${tName}
//     clazz = ${clazz}
//     getStack = ${getStack}
//     getCaller = ${getCaller}
// `)
    var timer = new Timer(),iCt=0;
    for(var i=0;i<ITERATIONS;i++){
        var o,stk
        if(clazz === 'Error' || clazz === 'MyErr'){
            o = nextFunc()(20,`new ${clazz}('test',123,${getCaller})`, getCaller)
            if(getStack){
                stk = o.stack
                iCt = stk.length>1500?iCt+1:iCt-1
// console.log(`stk = ${stk}`)
            }
        } else if(clazz === 'Dog'){
// console.log(`new Dog('test',false,${getCaller})`); process.exit(0)
            o = nextFunc()(20,`new Dog('test',false,${getCaller})`)
        } else {
            throw new Error(`Unexpected class: ${clazz}`)
        }
    }

    console.log(`\n[${tName}] time: ${timer.elapsed(5)}`)

    process.exit(0)
}

// Test classes:
class MyErr extends Error {
    constructor(msg,code,getCaller){
        super(msg)
        this.code=code
        if(getCaller){
            var cs = getCallerInfo()
// console.log(`cs = ${cs}`)
        }
    }
}

class Animal {
    constructor(name) {
        this.name = name;
    }
}

class Dog extends Animal {
    constructor(name,likesCats,getCaller) {
        super(name);
        this.likesCats = likesCats
        if(getCaller){
            var cs = getCallerInfo()
// console.log(`cs = ${cs}`)
        }
    }
}

// Helpers
class Timer {
    constructor() {this.start();}
    start() {this.startT=process.hrtime();}
    elapsed(prec) {
        prec=!prec||!isNaN(prec)?3:prec;
        var endT=process.hrtime(this.startT);
        return endT[0]+'.'+(new String(endT[1])).substring(0,prec);
    }
}

function nRand(){
    return (new String(Math.random())).replace(/\./g,"").substring(1).substring(0,1)
}

// This is the funky call stack randomization stuff
var sFuncBody = "global.%s = function %s(c,ev){if(c===0){return eval(ev)}else{return nextFunc()(--c,ev)} }"
for(let i=0;i<10;i++){
    var sFN=`f${i}`
    eval(util.format(sFuncBody,sFN,sFN))
}
function nextFunc(){return eval('f'+nRand(1))}

// Returns CallSite object for caller
// Wanted to test performance of this function
function getCallerInfo(j) {
    var cs,v,noterr={};
    j=j||{}
    var saveLimit = Error.stackTraceLimit;
    var savePrepare = Error.prepareStackTrace;
    j.depth = ( ( (v=j.depth) === undefined ) || v<0)?1:v
    Error.stackTraceLimit = j.depth+1;
    Error.captureStackTrace(noterr, getCallerInfo);
    Error.prepareStackTrace = function (_, stack) {
        cs = stack[j.depth];
    };
    noterr.stack;
    Error.stackTraceLimit = saveLimit;
    Error.prepareStackTrace = savePrepare;
    return cs;
}

doTests()
