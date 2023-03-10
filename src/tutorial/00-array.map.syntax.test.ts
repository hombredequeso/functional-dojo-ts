import { JustOne } from 'justone';

import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';

describe('typescript array and syntactic sugar', () => {
  test('array map', () => {
    const ints: number[] = [1, 2, 3];
    const add1 = (x: number) => x + 1;

    const newInts = ints.map(add1);

    expect(newInts).toStrictEqual([2, 3, 4]);
  });

  test('map using fp-ts', () => {
    const a: number[] = [1, 2, 3];
    const add1 = (x: number) => x + 1;
    const result: number[] = A.map(add1)(a);
    expect(result).toStrictEqual([2, 3, 4]);
  });

  // You might have wondered why not at least do this: A.map(add1, a)
  // Well, he is one reason why:

  test('map using fp-ts and pipe', () => {
    const add1 = (x: number) => x + 1;
    // read this as:
    // take the array 'a', and feed it into A.map(add1)

    const a: number[] = [1, 2, 3];

    const result: number[] = pipe(
      a, 
      A.map(add1)
    );
    expect(result).toStrictEqual([2, 3, 4]);
  });

  // To understand where that leads to,
  // imagine we then want to do something with it after adding 1.

  test('map using fp-ts and pipe with more maps', () => {
    const add1 = (x: number) => x + 1;
    const turnIntoCustomerId = (x: number) => `customer:${x}`;
    // read this as:
    // take the array 'a',
    // and feed it into A.map(add1),
    // then take the result of that, and feed it into A.map(turnIntoCustomerId)

    const a: number[] = [1, 2, 3];

    const result: string[] = pipe(
      a, 
      A.map(add1), 
      A.map(turnIntoCustomerId)
    );

    expect(result).toStrictEqual(['customer:2', 'customer:3', 'customer:4']);
  });

  // This is exactly the same as this:

  test('map using fp-ts without pipes', () => {
    const add1 = (x: number) => x + 1;
    const turnIntoCustomerId = (x: number) => `customer:${x}`;

    const a: number[] = [1, 2, 3];
    const aWith1Added = A.map(add1)(a);
    const result = A.map(turnIntoCustomerId)(aWith1Added);
    expect(result).toStrictEqual(['customer:2', 'customer:3', 'customer:4']);
  });
});

// Why precisely this notation?
// So you may not like the notation, or wonder why move away from myArray.map(...).map(...)
// The main reasons are:
//  * curried functions open up options that you don't have with non-curried functions.
//      non-curried function: map(f, a), curried function: map(f)(a)
//  * limitations in the Typescript type detection.
