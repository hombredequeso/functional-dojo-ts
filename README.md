# Getting started with functional programming using fp-ts.

## WARNING
This is a kind of grab-bag of code used in helping people learn functional programming, specifically using the fp-ts library. It is of admittedly uneven quality. Use at own risk.

## Intro

/src/tutorial
This is the place to start for learning fp using fp-ts

/src/notes
This contains tests related to a number of topics that frequently come us when learning/teaching functional programming.

/src/parser
Working through building up parser combinators.

My advice: ignore the rest.

## Getting Started

```
Git pull the repo.
cd functional-dojo-ts
yarn
```

I run thorugh the tutorial in numerical sequence, 00, 01, 02, ...
Some of the sections have accompanying exercises (with .todo's and .answers)

Taking 01-map as an example:

* tutorial for using map over different data structures/wrappers/contexts.
```
yarn test ./src/tutorial/01-map.test.ts
```

01-map.todo.test.ts
* exercises to do, getting familiar with map.
```
yarn test ./src/tutorial/01-map.todo.test.ts
```

01-map.answers.test.ts
* answers to 01-map.todo.test.ts
```
yarn test ./src/tutorial/01-map.answers.test.ts
```

# src/Notes

`exceptional-madness.test.ts`

A brief look at why the alternative flow-of-control introduced by exceptions is problematic.

`fp-oo.test.ts`

A comparison of fp and oo approaches to the same problem, with a little bit of procedural thrown in.

`functor-laws.test.ts`

`'program-equivalency.ts`

`src/referential-transparency.test.ts`

A simple, contrived illustration of what referential transparency can mean
considered in terms of the mutability/immutability of data entities.
