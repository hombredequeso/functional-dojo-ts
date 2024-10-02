import e from "express";

describe('not referentially transparency: simple value', () => {
  test('simple value', () => {
    let x = 1;
    x = 2;
    let y = x + 10;
    expect(y).toBe(12);
  })
  test('Cannot replace all instances of x with a 1 (or all ones with x)', () => {
    let x = 1;
    x = 2;
    // if x was referentially transparent, we could replace all instances of x with 1
    let y = 1 + 10;
    // then this would work:
    // expect(y).toBe(12);
    // but it doesn't because x is not referentially transparent, and when it was mutated if affected the value of y.
    // Instead...
    expect(y).toBe(11);
  })
})

describe('is referentially transparent: simple value', () => {
  test('simple value', () => {
    const x = 1;
    // Cannot do this anymore
    // x = 2;
    // if x was referentially transparent, we could replace all instances of x with 1
    let y = x + 10;
    expect(y).toBe(11);
  })

  test('simple value, can replace', () => {
    const x = 1;
    // x has the value of 1. So can replace all x's with 1 (and all 1's with x's)
    let y = 1 + 10;
    expect(y).toBe(11);
  })
})

// In functional programming, functions are also values, no different from x=1 being a value.

describe('not referentially transparent function', () => {
  test('simple function', () => {
    const now1 = Date.now();

    // do something for a while:
    let total = 0;
    for (let i = 0; i < 1000000; i++) {
      total+=i;
    }
    
    // Do the same thing:
    const now2 = Date.now();
    
    expect(now1).not.toBe(now2)
  })

  test('simple function is not referentially transparent', () => {
    // or else you could interchange Date.now() with a constant value
    const now = Date.now();

    const now1 = now;

    // do something for a while:
    let total = 0;
    for (let i = 0; i < 1000000; i++) {
      total+=i;
    }
    
    // Do the same thing:
    const now2 = now;
    
    expect(now1).toBe(now2)
  })
});

describe('is referentially transparent function', () => {
  test('make it - getNow - referentially transparent', () => {
    const getNow = () => Date.now();

    const now1 = getNow();
    // do something for a while:
    let total = 0;
    for (let i = 0; i < 1000000; i++) {
      total+=i;
    }
    const now2 = getNow();

    expect(now1).not.toBe(now2)
  })

  test('2. make it - getNow - referentially transparent', () => {
    const getNow = () => Date.now();

    const now1 = (() => Date.now())();
    // do something for a while:
    let total = 0;
    for (let i = 0; i < 1000000; i++) {
      total+=i;
    }
    const now2 = (() => Date.now())();

    expect(now1).not.toBe(now2)
  })


  test('3. make it - getNow - referentially transparent', () => {
    // Everything that is a function that gets now can be replaced.
    // Note: technically, getNow is referentially transparent.
    // Actually invoking it is not considered to be purely functional,
    // because doing so results in a different value each time 
    // i.e. it has side effects
    //  it goes outside of the program to the system clock to get the time, which changes.

    const getNow = () => Date.now();

    const now1 = getNow();
    // do something for a while:
    let total = 0;
    for (let i = 0; i < 1000000; i++) {
      total+=i;
    }
    const now2 = getNow();

    expect(now1).not.toBe(now2)
  })
})
