'use strict'

/*
  nodeErrPerf.js

  - This code is to test out the performance of Error creation on node.js
  - Please only use this in Node.js 4 or up as it uses ES6 features
  - This code utilizes call stack randomization in order to bypass any
      possible stack processing optimizations that may exist in V8

  tests to run:
      node ./nodeErrPerf.js Error false &
      node ./nodeErrPerf.js Error true &
      node ./nodeErrPerf.js MyErr false &
      node ./nodeErrPerf.js MyErr true &
      node ./nodeErrPerf.js Dog &

*/
var util = require('util')
var clazz,getStack;
const ITERATIONS=10000

function doTests(){

    if(process.argv.length < 3){q$.qErr('Need 1 or two args passed')}
        clazz = process.argv[2]
    if(process.argv.length > 3){
        getStack = process.argv[3]
    }



    var timer = new Timer(),iCt=0;
    for(var i=0;i<ITERATIONS;i++){
        var o,stk
        if(clazz === 'Error'){
            o = nextFunc()(10,"new Error('test',123)")
            if(getStack){
                stk = o.stack
                iCt = stk.length>1500?iCt+1:iCt-1
                // console.log(`stk.length = ${stk.length}`)
            }
        } else if(clazz === 'MyErr'){
            o = nextFunc()(10,"new MyErr('test',123)")
            if(getStack){
                stk = o.stack
                iCt = stk.length>2500?iCt+1:iCt-1
                // console.log(`stk.length = ${stk.length}`)
            }
        } else if(clazz === 'Dog'){
            o = nextFunc()(10,"new Dog('test',123)")
        } else {
            throw new Error(`Unexpected class: ${clazz}`)
        }
    }

    console.log(`\nclazz: ${clazz}, getStack: ${getStack}, time: ${timer.elapsed(5)}`)

    process.exit(0)
}

// Test classes:
class MyErr extends Error {
    constructor(msg,code){
        super(msg)
        this.code=code
    }
}

class Animal {
    constructor(name) {
        this.name = name;
    }
}

class Dog extends Animal {
    constructor(name,likesCats) {
        super(name);
        this.likesCats = likesCats
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


doTests()
