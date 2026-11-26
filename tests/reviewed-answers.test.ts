import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { gradeAnswer, type Question } from "../src/lib/study.ts";

const questions: Question[] = JSON.parse(readFileSync(new URL("../src/data/javascript.json", import.meta.url), "utf8")).questions;
const q = (n: number) => questions.find(q => q.number === n)!;
function code(n: number, alternate?: string) {
  const item = q(n);
  return item.exhibit.replace(/^\d{2}(?: |$)/gm, "").replace(/\[(\d+)\]/g, (_, i) => Number(i) === 1 && alternate ? alternate : item.pairs[Number(i) - 1].right);
}
function execute(source: string, vars: Record<string, unknown> = {}) {
  const logs: unknown[][] = [], alerts: string[] = [];
  const context = { console: { log: (...args: unknown[]) => logs.push(args) }, alert: (text: string) => alerts.push(text), ...vars };
  runInNewContext(source, context, { timeout: 1000 });
  return { context, logs: JSON.parse(JSON.stringify(logs)), alerts };
}
const values = (n: number) => q(n).pairs.map(p => p.right);

test("reviewed JavaScript output keys agree with execution, including typeof arrays", () => {
  assert.deepEqual(execute(code(2)).logs[0].map(String), values(2));
  assert.deepEqual(execute(code(3) + "\nconsole.log(array);").logs[0][0], [100,40,60,10]);
  assert.deepEqual(execute(code(4)).logs.map((a: unknown[]) => a[0]), ["undefined","string","object","number","object"]);
  assert.deepEqual(values(4), ["undefined","string","object","number","object"]);
  const option = q(5).options.find(o => o.id === q(5).correctIds[0])!.text;
  assert.deepEqual(execute(option + "\nconsole.log(significance(12.5, 3));").logs, [["12.500"]]);
  assert.deepEqual(execute(code(6) + "\nconsole.log(multiply(), getProduct());").logs.at(-1), [100, 6]);
  assert.deepEqual(execute(code(9) + "\nconsole.log(typeof flightDestination,typeof roundTrip,typeof onTime);").logs, [["string","number","boolean"]]);
  assert.deepEqual(execute(code(10) + "\nconsole.log(ceil,floor,round);").logs[0].map(String), values(10));
  assert.deepEqual(execute(code(11) + "\nconsole.log(date.getFullYear(),date.getMonth(),date.getDate());").logs, [[2017,0,1]]);
});

test("case-insensitive validation works with the repaired string-method blanks", () => {
  for (const [input, expected, success] of [["Hello WORLD","hello world",true],["different","hello world",false]] as const) {
    const result=execute(code(1)+"\nvalidate();",{document:{getElementById:(id: string)=> id==="tester" ? {value:input} : {innerHTML:expected}}});
    assert.deepEqual(result.alerts,success?["Success"]:[]);
  }
});

test("both accepted Date constructions work and month rollover is documented", () => {
  for (const construction of ["var date = new Date();","var date = new Date;"]) {
    // Controlled current date, safely away from DST and month-end boundaries.
    class FixedDate extends Date { constructor() { super(2026,0,15,12); } }
    const result=execute(code(7,construction)+"\nvar d=adjustMonth(2);console.log(d.getFullYear(),d.getMonth(),d.getDate());",{Date:FixedDate});
    assert.deepEqual(result.logs,[[2026,2,15]]);
    const matches=Object.fromEntries(q(7).pairs.map(p=>[p.id,p.right]));matches[q(7).pairs[0].id]=construction;
    assert.equal(gradeAnswer(q(7),[],matches),true);
  }
});

test("every-other-element loop terminates and sums exactly indices 0,2,4,6,8", () => {
  let i=0; const randoms=[.1,.2,.3,.4,.5,.6,.7,.8,.9,.99];
  const math=Object.create(Math);math.random=()=>randoms[i++];
  const result=execute(code(8)+"\nconsole.log(numbers.length,j);",{Math:math});
  assert.deepEqual(result.logs,[[25],[10,10]]);
  assert.deepEqual(values(8),["[]","push","j+2","numbers[j]"]);
});

test("weather, fuel, ticket age, and discount boundaries match requirements", () => {
  for (const [temperature,raining,fuelTank,expected] of [[66,false,.1,"Ride Bike"],[65,false,.5,"Take Train"],[70,true,.5,"Take Train"],[70,true,.51,"Drive your car"]]) {
    assert.deepEqual(execute(code(12)+"\nconsole.log(advice);",{temperature,raining,fuelTank}).logs,[[expected]]);
  }
  assert.deepEqual(execute(code(13)+"\nconsole.log(...[4,5,17,18,64,65].map(ticketPrice));").logs,[[0,10,10,20,20,0]]);
  assert.deepEqual(execute(code(14)+"\nconsole.log(getDiscount('Wednesday'),getDiscount('Friday'));").logs,[[.1,0]]);
});

test("completed loops skip null, stop at orange, and count down through zero", () => {
  const result=execute(code(15)+"\ndoWork(['apple',null,'pear','orange','after']);");
  assert.deepEqual(result.logs,[["apple"],["pear"]]);assert.deepEqual(result.alerts,["found"]);
  assert.deepEqual(execute(code(16)+"\ncountdown(3);").logs,[[3],[2],[1],[0]]);
  assert.deepEqual(execute(code(16)+"\ncountdown(0);").logs,[[0]]);
});

test("completed calendar handles all twelve months without switch fallthrough", () => {
  assert.deepEqual(execute(code(17)+"\nconsole.log(...Array.from({length:12},(_,i)=>getDaysInMonth(i)));").logs,[[31,28,31,30,31,30,31,31,30,31,30,31]]);
});

test("intentional assignment bug, Boolean expressions, and exception keys remain accurate", () => {
  assert.deepEqual(execute(code(18)+"\nconsole.log(isSafeDivide(4,0),isSafeDivide(4,2));").logs,[[true,true]]);
  const expressions=q(19).pairs.map(p=>p.left).join(",");
  assert.deepEqual(execute(code(19)+`\nconsole.log(${expressions});`).logs,[[true,false,true,true]]);
  assert.deepEqual(values(19),["True","False","True","True"]);
  const result=execute(code(21)+"\nunitTest('nonexistentFunction()');unitTest('1+1');");
  assert.deepEqual(result.alerts,["The function does not exist."]);
});
