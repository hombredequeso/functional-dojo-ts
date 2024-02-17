import * as S from 'fp-ts/lib/Set';
import * as A from 'fp-ts/lib/Array'
import * as N from 'fp-ts/number'

import E from 'fp-ts/lib/Eq'

// 01-map.test.ts is simply about an operation called map,
// and that "map", as known for arrays/lists,
// is capable of being used for other data structures, context, 'things'.
// 
// In other words, "map" has achieved a level of abstraction for us
// beyond simply being something you can do with an array.
// Intuitively, the abstraction is that map is a structure/context preserving
// operation that transforms the value(s) inside the structure/context.
//
// The next intuition is that this "map" operation is the basis of what is
// called a Functor.
// However, it is not everything necessary to have a Functor.
// All Functors will have a map operation.
// Not everything with a map operation is a functor.
// Not every map operation is a functor.
// But things with a map operation that have the additional properties
// of being a Functor do have, is predictability in their behaviour when
// we use them to construct programs (specifically with respect to creating programs by composing functions)

describe("Functor Smunctor", () => {
  // Not everything with a map operation is a functor.
  it("is not a functor if the map operation does not preserve the structure", () => {
    // This silly 'map' function always returns an empty array.
    // It does not preserve the structure of 'a', so cannot be a functor.
    const map = <A,B>(f: ((a:A) => B)) => <A,B>(a:A[]): B[] => [];

    const as = [1,2,3];
    const add1 = (x:number) => x+1;
    const result = map(add1)(as)

    expect(result).toStrictEqual([])
    expect(result).not.toStrictEqual([2,3,4])
  })

  it("is not a functor if it does preserve functor law 1", () => {

    // Functor law #1.
    // If there is a function: f = (x:X) => x
    // (i.e. the identity function, which simply returns the same thing you gave it)
    // then map(f) = f

    // Silly map:
    const map = <A,B>(f: ((a:A) => B)) => <A,B>(a:A[]): B[] => [];

    const as = [1,2,3];
    const id = <X>(x:X): X => x;
    const result = map(id)(as)

    // And the laws are not followed.
    // We mapped with the id function, which should do nothing.
    // The result should be the same as what we started with.
    expect(result).not.toStrictEqual(as)
    expect(result).toStrictEqual([])
  })

  describe("is not a functor if functions do not follow law 2 (i.e., compose predictably)", () => {

    // map (f . g)  ==  map f . map g

    it("this follows law 2, hence composes predictably", () => {

      const f = (x: number) => x * 10;
      const g = (x: number) => x / 10;

      const s: Set<number> = S.fromArray(N.Eq)([10, 11]);

      const fog = (x:number):number => f(g(x));

      const result1 = S.map(N.Eq)(fog)(s);

      const result2stage1 = S.map(N.Eq)(g)(s);
      const result2stage2 = S.map(N.Eq)(f)(result2stage1);

      expect(result1).toStrictEqual(result2stage2);
      expect(result1).toStrictEqual(s);
    })


    it("this does not follow law 2, hence does not compose predictably", () => {

      // A different type of number
      type MyInt = number;
      // ... with integer like equality (two MyInt's are equal if their rounded values are equal)
      const myIntEq: E.Eq<MyInt> = {
        equals:(a:MyInt, b:MyInt): boolean => Math.round(a) === Math.round(b)
      };

      const f = (x: MyInt) => x * 10;
      const g = (x: MyInt) => x / 10;

      const s: Set<MyInt> = S.fromArray(myIntEq)([10, 11]);

      const fog = (x:MyInt):MyInt => f(g(x));

      const result1 = S.map(myIntEq)(fog)(s);

      const result2stage1 = S.map(myIntEq)(g)(s);
      const result2stage2 = S.map(myIntEq)(f)(result2stage1);

      expect(result1).not.toStrictEqual(result2stage2);

      expect(result1).toStrictEqual(S.fromArray(myIntEq)([10, 11]));
      expect(result2stage2).toStrictEqual(S.fromArray(myIntEq)([10]));
    })

    // Set has a map function.
    // The set map function makes complete sense as a 'map' function.
    // However, set is not a functor.
    // Even though it has a map function, there is no guarantee the functor laws hold.

    // Note how the exact same test can be rewritten with array - which is a functor
    // and now it behaves as expected. Because array is a functor

    it("but for array the laws do hold, so it is a functor", () => {
      // A different type of number
      type MyInt = number;
      // ... with integer like equality (two MyInt's are equal if their rounded values are equal)
      const myIntEq: E.Eq<MyInt> = {
        equals:(a:MyInt, b:MyInt): boolean => Math.round(a) === Math.round(b)
      };

      const f = (x: MyInt) => x * 10;
      const g = (x: MyInt) => x / 10;

      const s: Array<MyInt> = [10, 11];

      const fog = (x:MyInt):MyInt => f(g(x));

      const result1 = A.map(fog)(s);

      const result2stage1 = A.map(g)(s);
      const result2stage2 = A.map(f)(result2stage1);

      expect(result1).toStrictEqual(result2stage2);
    })
  })

  // What enforces that something with a map operation is a functor?
  // You, the programmer (not copilot or chatgpt, this is about logic, not massive probability based text generation)
})