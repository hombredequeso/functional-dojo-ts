// reduce

// Considering basic operations over data structures, take list as an example.
// - filter: includes/excludes values, but structure remains the same
// - map: structure same, values all change
// - flatmap (chain): ability to merge structures, when you get a context in a context

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

// All of:
// * compact (* build an api)
// * sequence (* build an api) - relation to traversable???
// * reduce ????

// Looking at different patterns for dealing with arrays.

// For comparison, you can keep contrasting the functions with what the humble filter does:
//     A.filter will do:     Array<A> => Array<A>
//     (in other words, you still end up with the same type of thing in the array, just - potentially - less of them)

// Starting with an array and ending up with something entirely different that required iterating over the array (A.reduce): 
//    Array<A> => B

// When an array itself contains 'wrapped' types (A.compact):
//        Array<T<B>> => Array<B>
// e.g.   Array<Option<B> => Array<B>

// When we want to flip wrappers around (sequence):
//        T1<T2<A>> => T2<T1<A>>
// e.g.   Array<Task<A>> -> Task<Array<A>>


// Generalized destruction of lists:

describe('reduce: iterating over a list', () => {
  test('iterates over list and creates instance of something entirely different', () => {
    const l: Array<number> = [1,2,3];

    const startingValue = 'all the numbers: ';
    const result: string = A.reduce(startingValue, (reduceResult: string, nextValue: number) => (reduceResult + nextValue.toString()))(l)
    
    // So, we turned an Array<number> => string
    expect(result).toEqual('all the numbers: 123')


    // Or more succinctly:
    // const resultB: string = A.reduce('', (acc: string, next: number) => (acc + next.toString()))(l)

    // Or pulling out the iterating/accumulator function:
    const iterator = (reduceResult: string, nextValue: number) => reduceResult + nextValue.toString();
    const result2: string = A.reduce(startingValue, iterator)(l)
    expect(result).toEqual('all the numbers: 123')
  })

  // The generality of reduce means it can be used to cover common situations you might get into.

  test('Get rid of nones from an array, AND get rid of the Option wrapper too, AND turn them into strings', () => {
    const l: Array<Option<number>> = [O.some(1), O.none, O.some(2), O.none];
    const startingValue: Array<string> = [];
    const appendAsStringIfSome = (array: Array<string>, value: Option<number>) => {
      if (O.isSome(value)) {
        return array.concat([value.value.toString()]);
      }
      return array;
    };
    const result: Array<string> = A.reduce(startingValue, appendAsStringIfSome)(l);

    expect(result).toEqual(['1','2']);
  })

  // Can skip this bit till later...
  // FYI: above would not be considered idiosyncratic functional code, specifically the iterating/accumulator function.
  // If... else is generally frowned upon (because it opens up the opportunity to mutate values elsewhere)

    const accumulatorFuncOriginal =  (reduceResult: Array<string>, nextValue: Option<number>) => {
      if (O.isSome(nextValue)) {
        return reduceResult.concat([nextValue.value.toString()]);
      }
      return reduceResult;
    };
    // Better:
    const accumulatorFuncBetter =  (reduceResult: Array<string>, nextValue: Option<number>) => {
      return O.isSome(nextValue)? 
        reduceResult.concat([nextValue.value.toString()]):
        reduceResult;
    };

    // Even this is likely to get a sideways stare from some people, because you shouldn't generally be using someOption.value,
    // because it causes explict knowledge about the wrapper to intrude into the code rather than using structural operations
    // to manage the types (like map, flatmap/chain). So..

    const accumulatorFuncArguablyMostFunctional =  (reduceResult: Array<string>, nextValue: Option<number>) => 
      pipe(
        nextValue,
        O.map(v => reduceResult.concat([v.toString()])),
        O.getOrElse(() => reduceResult)
      );

    // Which would mean you could end up with:

    // The reduce function
    const appendAsStringIfSome =  (reduceResult: Array<string>, nextValue: Option<number>) => 
      pipe(
        nextValue,
        O.map(v => reduceResult.concat([v.toString()])),
        O.getOrElse(() => reduceResult)
      );
    const initialValue: string[] = [];
    const arrayOfOptions: Array<Option<number>> = [];
    const someValuesAsStrings: Array<string> = A.reduce(initialValue, appendAsStringIfSome)(arrayOfOptions)

})


describe('reduce on other data structures', () => {

  test('If a Option<a> is list zero/one element list, you can reduce over that too', () => {
    const a: Option<number> = O.of(1)
    const initialValue: string = 'Here is the value, if one exists:';
    const result = O.reduce(initialValue, (reduceResult: string, value: number) => `${reduceResult} ${value.toString()}`)(a);
    expect(result).toEqual('Here is the value, if one exists: 1');

    const b: Option<number> = O.none;
    const resultB = O.reduce(initialValue, (reduceResult: string, value: number) => `${reduceResult} ${value.toString()}`)(b);
    expect(resultB).toEqual('Here is the value, if one exists:');
  })

  test('Either', () => {
    const a: Either<string, number> = E.right(1);
    const initialValue: string = 'Either there is a value, or there was an error:';
    const result: string = E.reduce(initialValue, (reduceResult: string, value: number) => `${reduceResult} ${value.toString()}`)(a);
    expect(result).toEqual('Either there is a value, or there was an error: 1');

    const b: Either<string, number> = E.left('there was an error');
    const resultB: string = E.reduce(initialValue, (reduceResult: string, value: number) => `${reduceResult} ${value.toString()}`)(b);
    expect(resultB).toEqual('Either there is a value, or there was an error:');
  })

  test('Set', () => {
    const a: Set<number> = S.fromArray(N.Eq)([1,2,3, 3]);
    const initialValue: string = 'Values in the set:';
    const result: string = S.reduce(N.Ord)(initialValue, (reduceResult: string, nextValue: number) => `${reduceResult} ${nextValue.toString()}`)(a);
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
    const result = Tr.reduce(initalValue, (reduceResult: string, nextValue: number) => `${reduceResult} ${nextValue.toString()}`)(tree);
    expect(result).toEqual('Values in the tree: 1 2 3');
  })
})

// Earlier in this test 
// test('Get rid of nones from an array, AND get rid of the Option wrapper too, AND turn them into strings',...
// we used A.reduce to get rid of O.none values, and also transform the array elements from numbers => string.
// If you don't want to do the transform as part of the reduce, the idea of compacting the values can be used:

describe('Compactible: for data structures that can be filtered/compacted', () => {
  test('Compacting Array<Option<T>', () => {
    const l: Array<Option<number>> = [O.some(1), O.some(2), O.some(3), O.none];

    const result: Array<number> = A.compact(l);

    expect(result).toEqual([1,2,3]);
  })
})

// Which is earily similar to sequenceArray, but be warned...
describe('sequence: similarities to foldable - it iterates over something, but the thing in it themselves have a wrapper/structure/context: T1<T2<T>>', () => {
  test('number 1: sequence', () => {
    const l: Array<Option<number>> = [O.some(1), O.some(2), O.some(3)];

    const result: Option<readonly number[]> = O.sequenceArray(l);

    expect(result).toEqual(O.some([1,2,3]));
  })

  test('number 2: sequence, with just one none in the array', () => {
    const l: Array<Option<number>> = [O.some(1), O.some(2), O.some(3), O.none];

    const result: Option<readonly number[]> = O.sequenceArray(l);

    // Probably not what you hoped for:
    expect(result).toEqual(O.none);
  })
})

  // An intution for sequence, is that it turns a A<B<X>> into B<A<X>>
  // The devil is in the details of what A and B are. 

describe('So when might you use sequence?', () => {
  test('List<Task<T>> => Task<List<T>>', async () => {
    const arrayOfTasks: Array<Task<number>> = [];
    const taskOfArray: Task<readonly number[]> = T.sequenceArray(arrayOfTasks)
    expect(await taskOfArray()).toEqual([])
  })
})