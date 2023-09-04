// reduce

// Considering basic operations over data structures, take list as an example.
// - filter: includes/excludes values, but structure remains the same
// - map: structure same, values all change
// - flatmap (flatMap): ability to merge structures, when you get a context in a context

// - reduce: take

// Foldable: ability to iterate over every element in a data-structure and produce an entirely new type.

import * as A from 'fp-ts/lib/Array'

import { Tree } from 'fp-ts/lib/Tree';
import * as Tr from 'fp-ts/lib/Tree';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import * as S from 'fp-ts/lib/Set';
import * as N from 'fp-ts/lib/number'
import * as Str from 'fp-ts/lib/string'

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { pipe } from 'fp-ts/lib/function';
import { init } from 'fp-ts/lib/ReadonlyNonEmptyArray';

// Looking at different patterns for dealing with arrays.
// Different sorts of operations that you typically want to perform can be easily classified
// according to their signature.

// For instance:

//     A.filter will do:     Array<A> => Array<A>
//     (in other words, you still end up with the same type of thing in the array, just - potentially - less of them)

//      A.map will do:  Array<A1> => Array<A2>
//      (the structure - including number of elements - will be identical, but the elements in the array can all change)

//      A.flatMap will do: <Array<Array<A1>> => Array<A2>
//      (map the elements, and get rid of 'double wrapper')

//      A.reduce will do: Array<A> => A2
//      (the entire array is destroyed, resulting in an instance of an entirely different type)

//      A.compact will do: 
//            Array<T<B>> => Array<B>
//     e.g.   Array<Option<B> => Array<B>
//      (a common way of getting rid of O.none elements out of an array, and turning all the O.some(a) elements into a elements)

//      A.sequence:
//        T1<T2<A>> => T2<T1<A>>
//      Two wrapper/structure types are reversed
//      Commonly used for turning an array of tasks into a task of array.
//      Array<Task<A>> -> Task<Array<A>>


// Generalized destruction of lists:

describe('reduce: iterating over a list resulting in something that is not a list', () => {
  test('iterates over list and creates instance of something entirely different', () => {
    const l: Array<number> = [1,2,3];

    const startingValue = 'all the numbers: ';

    // Array<number> => string
    const result: string = A.reduce(startingValue, (reduceResult: string, nextValue: number) => (reduceResult + nextValue.toString()))(l)
    
    expect(result).toEqual('all the numbers: 123')

    // Or more succinctly:
    // const resultB: string = A.reduce('all the numbers: ', (acc: string, next: number) => (acc + next.toString()))(l)

    // Or pulling out the iterating/accumulator function:
    const iterator = (reduceResult: string, nextValue: number) => reduceResult + nextValue.toString();
    const result2: string = A.reduce(startingValue, iterator)(l)
    expect(result2).toEqual('all the numbers: 123')
  })

  // The generality of reduce means it can cover quite a range of situations

  test('starting with an Array of Options of number, construct a string of the O.some values', () => {
    // Array<Option<number>> => string
    const l: Array<Option<number>> = [O.some(1), O.none, O.some(2), O.none];
    const startingValue: string = '';
    const appendAsStringIfSome = (str: string, option: Option<number>) => {
      if (O.isSome(option)) {
        return str + option.value.toString() + ' ';
      }
      return str;
    };

    const result: string = A.reduce(startingValue, appendAsStringIfSome)(l);
    expect(result).toEqual('1 2 ');
  })

  test('Array<Option<number>> => string in a more functionally idiosyncratic fashion', () => {
    // Note that in the above we had to see if the option was some, and then extract the value with .value 
    // Doing so is generally considered bad form in functional programming, because functions exist for the
    // very purpose of avoiding peering inside and then manually extracting value yourself.

    const l: Array<Option<number>> = [O.some(1), O.none, O.some(2), O.none];
    const startingValue: string = '';
    const appendAsStringIfSome = (str: string, option: Option<number>) => {
      return pipe(
        option,                                   // Take the Option<number> we start with (result: Option<number>)
        O.map(n => n.toString() + ' '),           // If it exists, turn it into a string (result: Option<string>)
        O.getOrElse(() => ''),                    // Get the string, if it exists, otherwise we want an empty string. (result: string)
        (stringToAppend) => str + stringToAppend  // append it to the str we start with (result: string)
      );
    };

    const result: string = A.reduce(startingValue, appendAsStringIfSome)(l);
    expect(result).toEqual('1 2 ');
  })


  // Now, imagine we have an Array<Option<number>>
  // and we want to throw aways the O.none values, and finish with just the numbers, rather than Option<number> where they are all O.some's.
  // i.e. : Array<Option<number>> => Array<number>
  // You can't use filter on an array (because the type inside changes from Option<number> => number)
  // You can't map (because the number of elements in the array may change)
  // You can't flatmap, because it isn't an Array<Array<number>> structure.
  // But, you could reconsider the problem in terms of A.reduce.
  // Why? because A.reduce does this:
  // Array<T1> => T2.
  // In our case, T1 is Option<number>, and T2 is Array<number> (you may need to squint for a while to see why that is reduce,
  // don't be put off by that fact that it just happens that our T2 is itself an Array, don't think of it as an array, think of it
  // as the entire type that it actually is, an Array<string>.)
  test('Get rid of nones from an array, AND get rid of the Option wrapper too', () => {
    const l: Array<Option<number>> = [O.some(1), O.none, O.some(2), O.none];
    const startingValue: Array<number> = [];
    const appendIfSome = (array: Array<number>, value: Option<number>) => {
      if (O.isSome(value)) {
        return array.concat([value.value]);
      }
      return array;
    };
    const result: Array<number> = A.reduce(startingValue, appendIfSome)(l);

    expect(result).toStrictEqual([1,2]);
  })


  test('functionally idiosyncratic: Get rid of nones from an array, AND get rid of the Option wrapper too', () => {
    const l: Array<Option<number>> = [O.some(1), O.none, O.some(2), O.none];
    const startingValue: Array<number> = [];
    const appendIfSome = (array: Array<number>, option: Option<number>): Array<number> => {
      const result1: Option<Array<number>> = O.map((value:number) => array.concat([value]))(option);
      const result2: Array<number> = O.getOrElse(() => array)(result1)
      return result2;
    };
    const result: Array<number> = A.reduce(startingValue, appendIfSome)(l);

    expect(result).toStrictEqual([1,2]);
  })

  test('functionally idiosyncratic using pipe: Get rid of nones from an array, AND get rid of the Option wrapper too', () => {
    const l: Array<Option<number>> = [O.some(1), O.none, O.some(2), O.none];
    const startingValue: Array<number> = [];
    const appendIfSome = (array: Array<number>, option: Option<number>): Array<number> => {
      return pipe(
        option,
        O.map((value:number) => array.concat([value])),     // If we have something to append, append it (but note, we are still stuck inside an Option here)
        O.getOrElse(() => array)                            // If there is nothing to append, fall back to array, and get rid of that annoying option.
      )
    };
    const result: Array<number> = A.reduce(startingValue, appendIfSome)(l);

    expect(result).toStrictEqual([1,2]);
  })

})

// Some operations like Array<Option<T>> => Array<T> are so common, that get their special function.
// In this case, 'compact'.
// The thing to note though, is that even if you use compact in the code (which is recommended), it is derivable from more basic operations.
describe('Compactible: for data structures that can be filtered/compacted', () => {
  test('Compacting Array<Option<T>', () => {
    const l: Array<Option<number>> = [O.some(1), O.some(2), O.some(3), O.none];
    const result: Array<number> = A.compact(l);
    expect(result).toEqual([1,2,3]);
  })
})

// DANGER DANGER
// The function compact, is earily similar to sequenceArray. But note, it is something completely different.
describe('sequence: similarities to foldable - it iterates over something, but the thing in it themselves have a wrapper/structure/context: T1<T2<T>>', () => {
  test('number 1: sequence, in which the data makes it look so similar that it can be confused', () => {
    const l: Array<Option<number>> = [O.some(1), O.some(2), O.some(3)];

    const result: Option<readonly number[]> = O.sequenceArray(l);

    expect(result).toEqual(O.some([1,2,3]));
  })

  test('number 2: sequence, with just one none in the array, which shows it is something completely different', () => {
    const l: Array<Option<number>> = [O.some(1), O.some(2), O.some(3), O.none];

    const result: Option<readonly number[]> = O.sequenceArray(l);

    // Probably not what you hoped for:
    expect(result).toEqual(O.none);
    // Because maybe you  it would be O.some([1,2,3])
  })
})

  // An intution for sequence, is that it turns a A<B<X>> into B<A<X>>
  // The devil is in the details of what A and B are. 
  // Note I've switched to ReadonlyArray - instead of Array here - because the fp-ts functions
  // are attempting to enforce immutability.

describe('So when might you use sequence?', () => {
  test('List<Task<T>> => Task<List<T>>', async () => {
    const arrayOfTasks: ReadonlyArray<Task<number>> = [];
    const taskOfArray: Task<ReadonlyArray<number>> = T.sequenceArray(arrayOfTasks)
    const executedResult : ReadonlyArray<number> = await taskOfArray();
    expect(executedResult).toEqual([])
  })
})


// Now we return to thinking about reduce a bit more formally.
// So far, reduce has been thought of in terms of being an array operation.
// But just as earlier exercises demonstrated that map and flatMap are, in fact, 
// operations that can be conceived of with data structures/contexts more generally than just Array,
// so too can reduce.
// Because reduce is: T<T2> => T3.
// So far, you have thought that T is always Array, but it could be Option, or Either, ...

describe('reduce on data structures other than Array', () => {

  test('If a Option<a> is list zero/one element list, you can reduce over that too', () => {
    const a: Option<number> = O.of(1)
    const initialValue: string = 'Here is the value, if one exists:';
    const reducer = (reduceResult: string, value: number) => (`${reduceResult} ${value.toString()}`);

    const result = O.reduce(initialValue, reducer)(a);
    expect(result).toEqual('Here is the value, if one exists: 1');

    const b: Option<number> = O.none;
    const resultB = O.reduce(initialValue, reducer)(b);
    expect(resultB).toEqual('Here is the value, if one exists:');
  })

  test('Either', () => {
    const a: Either<string, number> = E.right(1);
    const initialValue: string = 'Either there is a value, or there was an error:';
    const reducer = (reduceResult: string, value: number) => `${reduceResult} ${value.toString()}`
    const result: string = E.reduce(initialValue, reducer)(a);
    expect(result).toEqual('Either there is a value, or there was an error: 1');

    const b: Either<string, number> = E.left('there was an error');
    const resultB: string = E.reduce(initialValue, reducer)(b);
    expect(resultB).toEqual('Either there is a value, or there was an error:');
  })

  test('Set', () => {
    const a: Set<number> = S.fromArray(N.Eq)([1,2,3, 3]);
    const reducer = (reduceResult: string, value: number) => `${reduceResult} ${value.toString()}`
    const initialValue: string = 'Values in the set:';
    const result: string = S.reduce(N.Ord)(initialValue, reducer)(a);
    expect(result).toEqual('Values in the set: 1 2 3')
  })

  test('Tree', () => {

    // Make a tree like this:
    //        1
    //        |
    //    ------------
    //    |           |
    //    2           3

    const two: Tree<number> = Tr.of(2);
    const three: Tree<number> = Tr.of(3);
    const tree = Tr.make(1, [two, three]);

    const initalValue: string = 'Values in the tree:';
    const reducer = (reduceResult: string, value: number) => `${reduceResult} ${value.toString()}`
    const result = Tr.reduce(initalValue, reducer)(tree);
    expect(result).toEqual('Values in the tree: 1 2 3');
  })

  // Note in all the above examples that one of the benefits of this is that reducer function is identical
  // in every case.
  // In other words, we have managed to separate out a basic operation, namely that of appending a number to a string,
  // and use it in a wide variety of contexts - where we have an array, an option, either, set, tree.
  // As with map and flatMap, once sort of operation can be conceived of, that of reducing over some data structure,
  // and a completely different sort of operation, that of appending a number to a string,
  // and we can compose them getting what otherwise, we might have thought of as very different functions.
})
