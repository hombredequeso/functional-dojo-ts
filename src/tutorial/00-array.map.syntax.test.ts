import * as A from 'fp-ts/lib/Array';
import { pipe } from 'fp-ts/lib/function';

describe('typescript array and syntactic sugar', () => {
  test('array map', () => {
    const ints: number[] = [1, 2, 3];
    const add1 = (x: number) => x + 1;

    const result: number[] = ints.map(add1);

    expect(result).toStrictEqual([2, 3, 4]);
  });

  test('map using fp-ts', () => {
    const ints: number[] = [1, 2, 3];
    const add1 = (x: number) => x + 1;

    const result: number[] = A.map(add1)(ints);

    expect(result).toStrictEqual([2, 3, 4]);
  });

  // You might have wondered why not at least do this: A.map(add1, a)
  // Well, he is one reason why:

  test('map using fp-ts and pipe', () => {
    const add1 = (x: number) => x + 1;

    const ints: number[] = [1, 2, 3];

    // read this as:
    // take the array 'ints', and feed it into A.map(add1)

    // Try and understand what's happening when you hover over 'map' in the pipe.
    const result: number[] = pipe(
      ints,                                // result of this line is: number[]
      A.map(add1)                       // result of this line is: number[]
    );
    expect(result).toStrictEqual([2, 3, 4]);
    
    // in other words it has done this: A.map(add1)(ints)
    // All pipe does is take the result of the line before,
    // and make it an argument on the end of the next line

    // const result: number[] = pipe(
    //   ints*,                                
    //   A.map(add1)(ints*) // it is as if ints* somehow made it's way down here
    //                         (if we read the line on its own)
    // );
  });


  // To understand where that leads to,
  // imagine we then want to do something with it after adding 1.

  test('map using fp-ts and pipe with more maps', () => {
    const add1 = (x: number) => x + 1;
    const turnIntoCustomerId = (x: number) => `customer:${x}`;

    const ints: number[] = [1, 2, 3];

    // read this as:
    // take the array 'ints',
    // and feed it into A.map(add1),
    // then take the result of that, and feed it into A.map(turnIntoCustomerId)

    const result: string[] = pipe(
      ints,                            // number[] 
      A.map(add1),                  // number[], with 1 added to every element.
      A.map(turnIntoCustomerId)     // string[], with 'customer:' prefixed to every number.
    );

    expect(result).toStrictEqual(['customer:2', 'customer:3', 'customer:4']);

  });

  // Which is exactly the same as this:

  test('map using fp-ts without pipes', () => {
    const add1 = (x: number) => x + 1;
    const turnIntoCustomerId = (x: number) => `customer:${x}`;

    const ints: number[] = [1, 2, 3];
    const aWith1Added = A.map(add1)(ints);
    const customerIds = A.map(turnIntoCustomerId)(aWith1Added);
    expect(customerIds).toStrictEqual(['customer:2', 'customer:3', 'customer:4']);
  });

  // or this:

  test('map using fp-ts without pipes v2', () => {
    const add1 = (x: number) => x + 1;
    const turnIntoCustomerId = (x: number) => `customer:${x}`;

    const ints: number[] = [1, 2, 3];

    // So it has done this, but you can read it forwards rather than backwards:
    const result = A.map(turnIntoCustomerId)(A.map(add1)(ints));
    expect(result).toStrictEqual(['customer:2', 'customer:3', 'customer:4']);
  });
});

// Why precisely this notation?
// So you may not like the notation, or wonder why move away from myArray.map(...).map(...)
// The main reasons are:
//  * curried functions open up options that you don't have with non-curried functions.
//      non-curried function: map(f, a), curried function: map(f)(a)
//  * the 'syntactic sugar' of pipe lets you read sequences of instructions forwards
//      rather than backwards.
//  * limitations in the Typescript type detection.
