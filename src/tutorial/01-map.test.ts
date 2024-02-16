import { JustOne } from '../pipelines/justone';

import { Tree } from 'fp-ts/lib/Tree';
import * as Tr from 'fp-ts/lib/Tree';

import * as A from 'fp-ts/lib/Array'
import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';


import { IO } from 'fp-ts/lib/IO';
import * as Io from 'fp-ts/lib/IO';

import * as S from 'fp-ts/lib/Set';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { string } from 'fp-ts';
import { Reader } from 'fp-ts/lib/Reader';
import * as R from 'fp-ts/lib/Reader';

import * as N from 'fp-ts/lib/number'
import * as Str from 'fp-ts/lib/string'


import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';

describe('javascript array', () => {
  test('array map', () => {
    const ints: number[] = [1,2,3];
    const add1 = (x: number) => x + 1;

    const newInts = ints.map(add1);

    expect(newInts).toEqual([2,3,4]);
  })

  // Imagine an array that can only have one (and only one) element in it.
  // (this is a pointless construct, soley for learning purposes)
  // So, instead of Array<number>, we have JustOn<number>
  // You don't need to look at the implementation of it, but can imagine what the result will be:

  test('justone', ()=> {
    const oneInt: JustOne<number> = new JustOne<number>(1);
    const add1 = (x: number) => x + 1;

    const newOneInt = oneInt.map(add1);

    expect(newOneInt).toEqual(new JustOne<number>(2))
  })
})


describe('map with fp-ts', () => {
  test('array', () => {
    const a: number[] = [1,2,3]
    const add1 = (x: number) => x + 1;
    const result: number[] = A.map(add1)(a);

    expect(result).toEqual([2,3,4]);
  })


  test('Option map - option is like an array, but with only 1 or 0 elements allowed', () => {
    const numToString = (x: number): string => x.toString();

    // If the 'array' had one element in it...
    const a: Option<number> = O.some(1);
    const result: Option<string> = O.map(numToString)(a)
    expect(result).toEqual(O.some('1'))


    // If the 'array' had no elements in it...
    const b: Option<number> = O.none;
    const resultb: Option<string> = O.map(numToString)(b)
    expect(resultb).toEqual(O.none)
  })
    // Option<T> can be thought of a data structure similar to something like:
    // type NullableT<T> = T | null;
    // The benefit it brings is the 'map' function means you don't end up writing 
    //   (if (x === null) then ... else ...) all over the place.

    // O.map(func)(option)
    // can be thought of as a piece of code that replaces this:
  test('option map the long way', () => {
    const numberOrNull : number|null = 1;
    const stringOrNull : string|null =
      (numberOrNull === null) ? null : numberOrNull.toString();

    // or more commonly (for those alergic to the ternary operator)

    const toStr = (numberOrNull: number|null) => {
      if (numberOrNull === null) {
        return null
      } else {
        return numberOrNull.toString();
      }
    }

    const stringOrNull2 = toStr(numberOrNull);

    // Equivalent to:
    const optionalNumber: Option<number> = O.some(1);
    const optionalString: Option<string> = O.map((x: number) => x.toString())(optionalNumber)
  })


  test('Set: another type of collection, unordered, only one of each element', () => {
    const numToString = (x: number): string => x.toString();

    // Why N.Eq everywhere?? fp-ts implementation of Set functions generally require
    // us to provide a mechanism to determine whether elements in the array are equal,
    // so it can explicitly maintain what 'one of each element' means.

    const a: Set<number> = S.fromArray(N.Eq)([1,2,3, 3]);

    const b: Set<string> = S.map(Str.Eq)(numToString)(a);

    const expected: Set<string>  = S.fromArray(Str.Eq)(['1', '2', '3']);
    expect(b).toEqual(expected);
  })

  test('Tree: another data structure', () => {
    const numToString = (x: number): string => x.toString();

    // Why N.Eq everywhere?? fp-ts implementation of Set functions generally require
    // us to provide a mechanism to determine whether elements in the array are equal,
    // so it can explicitly maintain what 'one of each element' means.


    // Make a tree like this:
    //        1
    //        |
    //    ------------
    //    |           |
    //    2           3

    const two: Tree<number> = Tr.of(2);
    const three: Tree<number> = Tr.of(3);
    const a = Tr.make(1, [two, three]);
    const b = Tr.map(numToString)(a);

    // Can't do this!!!! (drawTree requires Tree<string> )
    // console.log(Tr.drawTree(a));

    // so...
    const expected = Tr.make('1', [Tr.of('2'), Tr.of('3')]);
    expect(b).toEqual(expected);
    console.log(Tr.drawTree(b));
  })

  // So far, so good.
  // By now, you should understand the notion that 'map' does not just apply to Arrays.
  // It can be used on lot's of different data structures.
  // It has the following properties:
  //    * it results in the same structure (Array -> Array, Tree -> Tree)
  //    * the 'structure' includes the number and relationship between elements.
  //        i.e. if the array had 3 elements, so will the mapped one.
  //              if the tree was a binary tree with 2 elements, so will the mapped one.
  //    * the VALUES of the elements in the container/data structure are changed.


  // But wait, there's more:

  test('Either map', () => {
    const a: Either<string, number> = E.right(1);
    const numToString = (x: number): string => x.toString();
    const result: Either<string, string> = E.map(numToString)(a);
    expect(result).toEqual(E.right('1'))

    const b: Either<string, number> = E.left('ERROR');
    const resultb: Either<string, string> = E.map(numToString)(b);
    expect(resultb).toEqual(E.left('ERROR'))
  })

  // The trick here, is to think that the 'wrapper' is all of Either<string,
  // In other words, the parallel with earlier data structures is that
  // in all the following, there is a wrapper with element(s) of T in it.
  // Array<T>, Task<T>, Option<T>, Either<Error, T> 
  // So don't think of the Error as anything more than part of the wrapper
  // 
  // If you are still stuck, think of "Either<Error" as being like Option,
  // and if there is an error, then it is like None. And if there is a right/success, it is Some

  // Parallelling Option<T>, Either<E, T> can be though of as being similar to:
  // type TOrError<T, E> = T | E
  // with the benefit of a map function when you want to ignore errors.

  // Now turns out that map can be used for other things, that are not data structures.

  // NOTE: Task is something in fp-ts. To get started, think of it as a Strictly typed Promise 
  //      (it isn't strictly a Promise, but we'll get to that another time)
  test('task map', async () => {
    const a: Task<number> = T.of(1);
    const numToString = (x: number): string => x.toString();

    const result: Task<string> = T.map(numToString)(a)

    const executedResult: string = await result();

    expect(executedResult).toEqual('1')
  })

  // So what just happened there???

  // But wait, there's even more...

  type UnixTime = number;

  test('IO map', () => {
    const now = Math.floor(Date.now() / 1000);

    // What is an 'IO'? 
    // A couple of analogies for what an IO is are:
    // * very similar to a Task<T>. For this exercise, you could mentally subsitute IO<> with Task<>
    // * A function. IO<T> is a function that gives you a T value. The function gets executed right at the end.
    //   So in this exercise IO<UnitTime> is a function, that when executed gives us a UnixTime. Only thing is,
    //   we don't want to preserve the IO<> context until the very end, so to get access to the UnixTime we have to map it
    //   to get at the value inside the IO<> context.
    const nowIO: IO<UnixTime> = Io.of(now);
    const numToString = (x: number): string => x.toString();

    const result: IO<string> = Io.map(numToString)(nowIO);

    // Since IO is a function that can give us a string,
    // it is necessary to execute the IO/function to finally
    // get the string (which was previously wrapper up in the IO<>)
    const executedResult: string = result();

    expect(executedResult).toEqual(now.toString());
  })

  // So where does that get us?
  // Since IO is a function, and we were able to map over it,
  // that also means that we can add 'function' to the structures/contexts/wrappers
  // that we can map over.
  // As for why you would want to do this, that can wait for now.
  // The point is, this concept of being able to map over something
  // also applies to functions, as it does to Tasks, and lots of data structures.

  interface Config {
    context: string
  }

  // Another example of a type of function that can be mapped over.

  test('Reader map', () => {
    const a: Reader<Config, number> = (config: Config) => 1;
    const numToString = (x: number): string => x.toString();
    const result: Reader<Config, string> = R.map(numToString)(a);

    const executedResult: string = result({context: 'prod'});
    expect(executedResult).toEqual('1');
  })

  // That looked pointless, because as an isolated piece of code it is.
  // But here's what to notice:
  //  Reader<Config, is in fact ... a function.
  // You can see that, because it had to be executed, by invoking the function:
  //  result({context: 'prod'})
  // So that means, as with IO, you can map over a function.

  // It is also possible to have what you could think of a a double-wrapper,
  // or a double-context. A common example is a Task<Either<Error, T>>
  // meaning: a Task, where the value is Either an Error, or a T.
  // This is so common, there is an alias for Task<Either<Error, T>>, TaskEither<Error, T>
  // And given that alias, you might be able to imagine what that means for map.
  // Yep, if you have a TaskEither and map over it, then if the insider value is not an Error,
  // you will get a mapped value in the Task.
  type Error = string;

  test('TaskEither map', async () => {
    const a: TaskEither<Error, number> = TE.of(1);
    const numToString = (x: number): string => x.toString();

    const result: TaskEither<Error, string> = TE.map(numToString)(a)

    const executedResult: Either<Error, string> = await result();

    expect(executedResult).toEqual(E.right('1'));

    // Or if there was an error:
    const b: TaskEither<Error, number> = TE.left('someError')
    const result2: TaskEither<Error, string> = TE.map(numToString)(b);
    const executedResult2: Either<Error, string> = await result2();
    expect(executedResult2).toEqual(E.left('someError'))
  })

  // So where'd we get to?
  // the operation of map is something that can be done to:
  //    * data structures
  //    * wrappers/contexts that promise you a value at some point in the future.
  //    * functions.

  // If you can say this, relate it to the examples and understand it, you've probably got it:
  //
  //    map is an structure/wrapper/context preserving operation, that transforms
  //      the values of the structure/wrapper/context
  //      by producing a new value(s) inside the same structure/wrapper/context

})