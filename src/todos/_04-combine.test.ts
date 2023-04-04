
// What does it mean to combine two numbers?

import { Monoid } from "fp-ts/lib/Monoid"

import * as A from 'fp-ts/lib/Array'

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

const addNumbersMonoid: Monoid<number> = {
  concat: (a, b) => a+b,
  empty: 0
};


describe('misc combine', () => {

  test('combining numbers', () => {
    const x = 1;
    const y = 2;

    const z = addNumbersMonoid.concat(x,y);

    expect(z).toEqual(3);
  })

  test('arrays of number', () => {
    const a = [1,2,3,4];

    const result = A.reduce(addNumbersMonoid.empty, addNumbersMonoid.concat)(a);

    expect(result).toEqual(10);
  })
})

type Point = {
  x: number,
  y: number
}

const addPointsMonoid: Monoid<Point> = {
  concat: (a,b) => (
    {
      x: a.x + b.x, 
      y: a.y + b.y
    }),
  empty: {x: 0, y: 0}
}


describe('misc combine Points', () => {

  test('combining points', () => {
    const a = {x: 1, y: 2};
    const b = {x: 5, y: 6};

    const result = addPointsMonoid.concat(a,b);

    expect(result).toEqual({x: 6, y: 8});
  })

  test('arrays of number', () => {
    const a = [
      {x: 1, y: 2},
      {x: 3, y: 4},
      {x: 5, y: 6}
    ]

    const result = A.reduce(addPointsMonoid.empty, addPointsMonoid.concat)(a);

    expect(result).toEqual({x: 9, y: 12});
  })
})

describe('Options', () => {

  test('combining optional points', () => {
    // let's start to use the built in fp-ts monoids;

    // Option<T> can be a monoid, if we have a way to combine T's.

    const optionPointMonoid: Monoid<Option<Point>> = O.getMonoid(addPointsMonoid);

    expect(optionPointMonoid.concat(O.some({x:1, y:2}), O.some({x:3, y:4}))).toEqual(O.some({x: 4, y:6}));
    expect(optionPointMonoid.concat(O.none, O.none)).toEqual(O.none);
    expect(optionPointMonoid.concat(O.some({x:1, y:2}), O.none)).toEqual(O.some({x:1, y:2}));
  })
})

// How does any of this help??

