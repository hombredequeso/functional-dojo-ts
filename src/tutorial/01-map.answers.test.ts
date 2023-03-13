
import * as A from 'fp-ts/lib/Array'

import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { pipe, flow } from 'fp-ts/lib/function';

const todo: any = () => {
  throw 'todo';
}

describe('map exercises', () => {
  test('1. length of names of important animals, however you like', () => {
    const customerNames = ['Duke', 'Bernie', 'Micky' ];

    // Implement this function however you like, but including A.map somewhere

    // Typescript struggles with the types here:
    const lengths = A.map(n => n.length)(customerNames);

    // but you can help it in one of two ways:
    const lengthsB = A.map((n: string) => n.length)(customerNames);
    // map from a string to a number:
    const lengthsC = A.map<string, number>(n => n.length)(customerNames);

    const lengths2 = pipe(
      customerNames,
      A.map(n => n.length)
    )

    expect(lengths).toEqual([4,6,5]);
    expect(lengths2).toEqual(lengths);
  })

  // Looking at various ways of composing functions:

  const numToString = (n: number): string => n.toString();
  const getLength = (s: string): number => s.length;

  test('2. digit count of numbers in an array - anyway', () => {
    const numbers = [1, 2, 3, 5, 7, 11, 13, 101];

    // However you like, get this test to pass:
    const numberStrings = A.map(numToString)(numbers);
    const stringLengths = A.map(getLength)(numberStrings);

    expect(stringLengths).toEqual([1,1,1,1,1,2,2,3]);
  })

  test('3. digit count of numbers in an array - pipe with two A.map', () => {
    const numbers = [1, 2, 3, 5, 7, 11, 13, 101];

    // Pipe numbers and the two functions together:
    const result = pipe(
      numbers,
      A.map(numToString),
      A.map(getLength)
    )

    expect(result).toEqual([1,1,1,1,1,2,2,3]);
  })


  test('4. digit count of numbers in an array - composed function and one A.map', () => {
    const numbers = [1, 2, 3, 5, 7, 11, 13, 101];

    // Compose the two functions together, to produce a new function.
    // The, use that one function in a pipe to get the same result.
    // const getDigitCount = (n: number): number => todo();
    const getDigitCount = (n: number): number => getLength(numToString(n));

    const result = pipe(
      numbers,
      A.map(getDigitCount),
    )

    expect(result).toEqual([1,1,1,1,1,2,2,3]);
  })

  test('5. digit count of numbers in an array - compose function using "flow" and one A.map', () => {
    const numbers = [1, 2, 3, 5, 7, 11, 13, 101];

    // fp-ts 'flow' is similar to pipe in some ways.
    // Simplistically, you can think about it in one of two ways:
    // * it is pipe, but without the first parameter (hence, missing input data).
    // * it is a way to compose functions together.

    // use flow to produce this function:
    // const getDigitCount = (n: number): number => flow (
    const getDigitCount: (n:number)=> number = flow (
      numToString,
      getLength
      );

    // const getDigitCount: (n:number)=> number = flow (
    //   todo()
    //   );


    const result = pipe(
      numbers,
      A.map(getDigitCount),
    )

    expect(result).toEqual([1,1,1,1,1,2,2,3]);
  })


  const toNumber = (s: string): Option<number> => {
    const parseResult = parseInt(s);
    const validNumber: boolean = !Number.isNaN(parseResult) && (parseResult.toString() == s);
    return validNumber? O.some(parseResult): O.none;
  }


  test('6. Write the toNumber parsing function', () => {

    expect(toNumber('123')).toEqual(O.some(123));
    expect(toNumber('abc123')).toEqual(O.none);
    expect(toNumber('123a')).toEqual(O.none);

  })

  const toPrintableDollars = (n: number): string => (`$${n}.00`)

  test('7. Optionally, show me the money #1', () => {
    const s1 = 'abc';
    const s2 = '123';

    const result1 = pipe(
      s1,
      toNumber,
      O.map(toPrintableDollars)
    )

    expect(result1).toEqual(O.none)

    const result2 = pipe(
      s2,
      toNumber,
      O.map(toPrintableDollars)
    )

    expect(result2).toEqual(O.some('$123.00'))
  })


  test('8. Optionally, show me the money #2', () => {
    const s1 = 'abc';
    const s2 = '123';

    const stringToPrintableDollars = flow(
      toNumber,
      O.map(toPrintableDollars)
    );

    const result1 = pipe(
      s1,
      stringToPrintableDollars
    )

    expect(result1).toEqual(O.none)

    const result2 = pipe(
      s2,
      stringToPrintableDollars
    )

    expect(result2).toEqual(O.some('$123.00'))
  })


  type error = string;
  const toNumberE = (s: string): Either<error, number> => {
    const numberO = toNumber(s);
    return E.fromOption(()=> `Invalid input: ${s} is not a number`)(numberO)
  }

  test('9. Use the toNumber function to create a new function returning Either as opposed to Option', () => {
    expect(toNumberE('123')).toEqual(E.right(123))
    expect(toNumberE('abc123')).toEqual(E.left('Invalid input: abc123 is not a number'));
  })

  test('10. Either, show me the money or not #1', () => {
    const s1 = 'abc';
    const s2 = '123';

    const result1 = pipe(
      s1,
      toNumberE,
      E.map(toPrintableDollars)
    )

    expect(result1).toEqual(E.left('Invalid input: abc is not a number'))

    const result2 = pipe(
      s2,
      toNumberE,
      E.map(toPrintableDollars)
    )

    expect(result2).toEqual(E.right('$123.00'))
  })


  test('11. Either, show me the money or not #2', () => {
    const s1 = 'abc';
    const s2 = '123';

    const stringToPrintableDollars = flow(
      toNumberE,
      E.map(toPrintableDollars)
    );

    const result1 = pipe(
      s1,
      stringToPrintableDollars
    )

    expect(result1).toEqual(E.left('Invalid input: abc is not a number'))

    const result2 = pipe(
      s2,
      stringToPrintableDollars
    )

    expect(result2).toEqual(E.right('$123.00'))
  })
})