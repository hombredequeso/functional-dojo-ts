import { JustOne } from "justone";


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
    const ints: number[] = [1,23,987];

    const toStringDigits = (x: number): string[] => x.toString().split('');

    const mapped = ints.map(toStringDigits);
    const expected: string[][] = [['1'], ['2','3'], ['9', '8', '7']]

    expect(mapped).toEqual(expected);

    const flatMapped = ints.flatMap(toStringDigits);
    const expectedFlatMapped: string[] = ['1', '2','3', '9', '8', '7'];
    expect(flatMapped).toEqual(expectedFlatMapped);
  })

  test('justone', ()=> {
    const oneInt: JustOne<number> = new JustOne<number>(1);
    const numToString = (x: number): JustOne<string> => new JustOne<string>(x.toString());

    const newOneInt: JustOne<JustOne<string>> = oneInt.map(numToString);
    expect(newOneInt).toEqual(new JustOne(new JustOne('1')))


    const newOneIntFlat: JustOne<string> = oneInt.flatMap(numToString);
    expect(newOneIntFlat).toEqual(new JustOne('1'))
  })

  test('Option map - option is like an array, but with only 1 or 0 elements allowed', () => {
    const a: Option<number> = O.some(1);
    const certainNumsToString = (x: number): Option<string> => (x % 2) ? O.some(x.toString()): O.none;

    const result: Option<Option<string>> = O.map(certainNumsToString)(a)
    expect(result).toEqual(O.some(O.some('1')))

    expect(O.chain(certainNumsToString)(a))
      .toEqual(O.some('1'))

    expect(O.chain(certainNumsToString)(O.some(2)))
      .toEqual(O.none)

    expect(O.chain(certainNumsToString)(O.none))
      .toEqual(O.none)
  })


  test('task flatMap - task is like Promise, done consistently functionally', async () => {
    const a: Task<number> = T.of(1);
    const numToString = (x: number): Task<string> => T.of(x.toString());

    const result: Task<Task<string>> = T.map(numToString)(a)
    const executedResult: string = await(await result())();
    expect(executedResult).toEqual('1')

    const resultfm: Task<string> = T.chain(numToString)(a)
    expect(await resultfm()).toEqual('1')
  })


  interface Config {
    context: string
  }

  test('Reader flatMap', () => {
    const a: Reader<Config, number> = (config: Config) => 1;
    
    // numToString, has the Config injected into it - that's what Reader<Config is doing
    const numToString = (x: number): Reader<Config, string> => (r:Config) => x.toString()+r.context;
    const result: Reader<Config, Reader<Config, string>> = R.map(numToString)(a);

    const executedResult: string = result({context: 'contextA'})({context: 'contextB'});
    expect(executedResult).toEqual('1contextB');

    const resultfm: Reader<Config, string> = R.chain(numToString)(a);
    expect(resultfm({context: 'prod'})).toEqual('1prod')
  })

  type Error = string;

  test('Either', () => {
    const a: Either<string, number> = E.right(1);
    const numToString = (x: number): Either<Error, string> => (x % 2)? E.right(x.toString()): E.left("too even");
    const result: Either<Error, Either<Error, string>> = E.map(numToString)(a);
    expect(result).toEqual(E.right(E.right('1')))


    expect(E.chain(numToString)(E.right(1))).toEqual(E.right('1'))
    expect(E.chain(numToString)(E.left('already errored'))).toEqual(E.left('already errored'))
    expect(E.chain(numToString)(E.right(2))).toEqual(E.left('too even'))
  })
})