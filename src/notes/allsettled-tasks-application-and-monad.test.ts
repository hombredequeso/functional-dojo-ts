import { array, task } from 'fp-ts'
import { cons } from 'fp-ts/lib/ReadonlyNonEmptyArray';
import { Task } from 'fp-ts/lib/Task';

import { pipe } from 'fp-ts/lib/function';

// Make the console log's more readable
// Console logs are used to demonstrate the order of execution of the delayedPromise's

const jestConsole = console;

beforeEach(() => {
  global.console = require('console');
});

afterEach(() => {
  global.console = jestConsole;
});

const delayedPromise = (result: number, delay: number) => new Promise<number>((resolve) => {
  setTimeout(() => {
    console.log(`resolved ${result} after ${delay}ms`);
    resolve(result)
  }, delay)});



describe('equivalent of promise.allsettled using fp-ts', () => {
  test('promise.allsettled', async () => {
    console.log('\npromise.allsettled');

    // build up an array of Task<T>'s,
    // which return a number, increasing in value. But resolve time is mixed up
    const arrayOfTasks: Task<number>[] = [
      ()=> delayedPromise(1, 100),
      ()=> delayedPromise(2, 10),
      ()=> delayedPromise(3, 400),
      ()=> delayedPromise(4, 1),
    ];

    // Turn it into a Task<T[]>, specifying tasks can run in parallel
    const result: Task<number[]> = array.sequence(task.ApplicativePar)(arrayOfTasks)

    // In a real program, executing the task is only something done once at the edge of the program.
    // The console logs for the delayedPromise's will demonstrate that they are running in parallel.
    // Yet, the result will be an array of the results in the order of the original array.
    const executedResult: number[] = await result();

    expect(executedResult).toStrictEqual([1,2,3,4]);
  })
})


describe('applicative to array of', () => {

  test('applicative for an add operation', async () => {
    console.log('\napplicative for an add operation');

    const t1: Task<number> = () => delayedPromise(1, 100);
    const t2: Task<number>  = () => delayedPromise(2, 10);

    const add = (a: number) => (b: number) => a + b;
    const aa: Task<(x: number)=>number> = pipe(t1, task.map(add));
    const bb: Task<number> = pipe(aa, task.ap(t2));

    const result = await bb();
    expect(result).toBe(3);
  })

  test('applicative to create an array of Tasks', async () => {
    console.log('\napplicative to array of');

    const t1: Task<number> = () => delayedPromise(1, 100);
    const t2: Task<number>  = () => delayedPromise(2, 10);

    const toArray = <T>(a: T) => (b: T): T[] => [a,b];

    const aa: Task<(x: number)=>number[]> = pipe(t1, task.map(toArray));
    const bb: Task<number[]> = pipe(aa, task.ap(t2));

    const result = await bb();
    expect(result).toStrictEqual([1,2]);
  })

  test('Create an array using monad operations, which order Task/Promise execution', async () => {
    console.log('\ndone the monadic way');
    const t1: Task<number> = () => delayedPromise(1, 100);
    const t2: Task<number>  = () => delayedPromise(2, 10);

    const toArray = <T>(a: T) => (b: T): T[] => [a,b];


    const aa2: Task<(x: number)=>number[]> = pipe(t1, task.map(toArray));
    const bb2: Task<number[]> = pipe(aa2, task.flatMap(aa => pipe(t2, task.map(t => aa(t)))));


    const result = await bb2();
    expect(result).toStrictEqual([1,2]);
  })
})