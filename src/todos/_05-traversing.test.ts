
import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';
import * as Ot from 'fp-ts/lib/OptionT';

import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';

import * as A from 'fp-ts/lib/Array'

import { pipe } from 'fp-ts/lib/function';
import { array } from 'fp-ts';

import {Apply2} from 'fp-ts/lib/Apply'
import { Applicative } from 'fp-ts/lib/ReadonlyNonEmptyArray';

describe('sequencing', () => {
  test('sequence(Applicative)', () => {
    const arrayOfOptions: Array<Option<number>> = [O.some(1), O.some(2)];

    const optionalArray: Option<Array<number>> = A.sequence(O.Applicative)(arrayOfOptions);

    expect(optionalArray).toEqual(O.some([1, 2]));
  })

  test('sequenceOption', () => {
    const arrayOfOptions: Array<Option<number>> = [O.some(1), O.some(2)];

    const optionalArray: Option<readonly number[]> = O.sequenceArray(arrayOfOptions);

    expect(optionalArray).toEqual(O.some([1, 2]));
  })

  test('but even one none results in total none', () => {
    const arrayOfOptions: Array<Option<number>> = [O.some(1), O.some(2), O.none];

    const optionalArray: Option<readonly number[]> = O.sequenceArray(arrayOfOptions);

    expect(optionalArray).toEqual(O.none);
  })

  test('more likely what you want something like...', () => {

    const arrayOfOptions: Array<Option<number>> = [O.some(1), O.some(2), O.none];

    const numberArray = A.compact(arrayOfOptions);

    expect(numberArray).toEqual([1,2]);

    // or, reduce can do the same thing, although is probably more likely to be useful is you are also
    // doing something more than just adding to the end of the arrya.

    const appendIfSome = <T>(acc: T[], valO: Option<T>) => pipe(valO, O.match(()=>acc, (val) => acc.concat([val])));
    const numberArray2 = pipe(
      arrayOfOptions,
      A.reduce([] as number[], appendIfSome)
    );

    expect(numberArray2).toEqual([1,2]);
  })

  test('sequence is more useful for ', async () => {
    const arrayOfTasks: Array<Task<number>> = [];
    const taskOfArray: Task<readonly number[]> = T.sequenceArray(arrayOfTasks)
    expect(await taskOfArray()).toEqual([])
  })

  type Error = string;
  test('Or Eithers and Tasks 1', async () => {
    const arrayOfTasks: Array<TaskEither<Error, number>> = [TE.of(1), TE.of(2)];
    const taskOfArray: Task<readonly Either<Error, number>[]> = T.sequenceArray(arrayOfTasks)
    expect(await taskOfArray()).toEqual([E.right(1),E.right(2)])
  })

  test('Or Eithers and Tasks 2', async () => {
    const arrayOfTasks: Array<TaskEither<Error, number>> = [
      TE.of(1), 
      T.of(E.left('failure')) 
    ];

    const taskOfArray: Task<readonly Either<Error, number>[]> = T.sequenceArray(arrayOfTasks)
    expect(await taskOfArray()).toEqual([E.right(1),E.left('failure')])
  })

});

const parseNumber = (s: string): Option<number> => {
  const parseResult = parseInt(s);
  return (!Number.isNaN(parseResult))? O.some(parseResult) : O.none;
}

describe('traversing', () => {
  test('traverse #1', () => {
    const a: Array<string> = ['1', '2', 'whatevs', '3']

    const z: Option<number[]> = A.traverse(O.Applicative)(parseNumber)(a);

    expect(z).toEqual(O.none);
  })
})

type Point = {x: number, y: number};

describe('what is an applicative', () => {
  test('Applicative knows what to do when you have a function stuck in a structure/wrapper/context', () => {

    const makePoint = (x: number) => (y: number): Point => ({x, y});

    const apiInput = {
      xInput: 1,
      yInput: 2
    };

    // const makePointA = (xO: Option<number>) => (y: Option<number>): Option<Point> => O.of(makePoint)
    const optionX: Option<number> = O.of(1);
    const optionY: Option<number> = O.of(2);

    const optionalPoint: Option<Point> = pipe(
      optionX,                // Option<number>
      O.map(makePoint),       // Option<number => Point>
      O.ap(optionY)           // Option<Point>              // This is the critical line. ***
    )

    // Note how, at the critical line, we both our function and the next parameter are both wrapped up?
    // Option<number => Point>, Option<Point>
    // Now we want take the point out of the Option, and apply it the function which is also wrapped up in an Option
    // (apply, see what I did there!)
    // Compare it to O.map.
    // O.map know how to deal with a bit of wrapped up data, but the function (in O.map) cannot be wrapped up.

  })

  test('You can do the same with flatMap, but it is ugly', () => {

    const makePoint = (x: number) => (y: number): Point => ({x, y});

    const apiInput = {
      xInput: 1,
      yInput: 2
    };

    // We wish we had a function/could do something like this:
    // const makePointA = (xO: Option<number>) => (y: Option<number>): Option<Point> => O.of(makePoint)
    // which is the same as makePoint, but with every parameter turned into an Option<>

    const optionX: Option<number> = O.of(1);
    const optionY: Option<number> = O.of(2);

    const optionalPoint: Option<Point> = O.flatMap<number, Point>(x => {
      return O.map<number, Point>(y => {
        return {x,y}
      })(optionY)
    })(optionX)

    expect(optionalPoint).toEqual(O.some({x:1, y:2}));



    const optionalPoint2: Option<Point> = pipe(
      optionX,
      O.flatMap(x=> pipe(
        optionY,
        O.map(y => ({x,y}))
      ))
    );
  })
})

describe('Option alt', () => {
  const result = O.alt(() => O.some(1))(O.some(2));
  expect(O.alt(() => O.some(1))(O.some(2))).toEqual(O.some(2))
})