import { JustOne } from 'justone';


import * as A from 'fp-ts/lib/Array'
import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';


import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { string } from 'fp-ts';
import { Reader } from 'fp-ts/lib/Reader';
import * as R from 'fp-ts/lib/Reader';

describe('javascript array', () => {
  test('array map', () => {
    const ints: number[] = [1,2,3];
    const add1 = (x: number) => x + 1;

    const newInts = ints.map(add1);

    expect(newInts).toEqual([2,3,4]);
  })

  test('promise then is pretend "map"', async () => {
    const intP: Promise<number> = Promise.resolve(1);
    const add1 = (x: number) => x + 1;

    const newIntP: Promise<number> = intP.then(add1);


    expect(await newIntP).toEqual(2);

  })

  test('justone', ()=> {
    const oneInt: JustOne<number> = new JustOne<number>(1);
    const add1 = (x: number) => x + 1;

    const newOneInt = oneInt.map(add1);

    expect(newOneInt).toEqual(new JustOne<number>(2))
  })
})


describe('map using functional format', () => {
  test('array', () => {
    const a: number[] = [1,2,3]
    const add1 = (x: number) => x + 1;
    const result: number[] = A.map(add1)(a);

    expect(result).toEqual([2,3,4]);
  })

  test('task map - task is like Promise, done consistently functionally', async () => {
    const a: Task<number> = T.of(1);
    const numToString = (x: number): string => x.toString();

    const result: Task<string> = T.map(numToString)(a)

    const executedResult: string = await result();

    expect(executedResult).toEqual('1')
  })

  test('Option map - option is like an array, but with only 1 or 0 elements allowed', () => {
    const a: Option<number> = O.some(1);
    const numToString = (x: number): string => x.toString();
    const result: Option<string> = O.map(numToString)(a)
    expect(result).toEqual(O.some('1'))

    const b: Option<number> = O.none;
    const resultb: Option<string> = O.map(numToString)(b)
    expect(resultb).toEqual(O.none)
  })

  // The trick here, is to think that the 'wrapper' is all of Either<string,
  // In other words, the parallel with earlier data structures is like:
  // Array<T>, Task<T>, Option<T>, Either<Error, T> 
  // So don't think of the Error as anything more than part of the wrapper
  test('Either map', () => {
    const a: Either<string, number> = E.right(1);
    const numToString = (x: number): string => x.toString();
    const result: Either<string, string> = E.map(numToString)(a);
    expect(result).toEqual(E.right('1'))

    const b: Either<string, number> = E.left('ERROR');
    const resultb: Either<string, string> = E.map(numToString)(b);
    expect(resultb).toEqual(E.left('ERROR'))
  })

  interface Config {
    context: string
  }

  // Here, the wrapper is not a data structure - it is a function.
  test('Reader map', () => {
    const a: Reader<Config, number> = (config: Config) => 1;
    const numToString = (x: number): string => x.toString();
    const result: Reader<Config, string> = R.map(numToString)(a);

    const executedResult: string = result({context: 'prod'});
    expect(executedResult).toEqual('1');
  })
})