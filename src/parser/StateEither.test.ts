import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { State } from 'fp-ts/lib/State';
import * as S from 'fp-ts/lib/State';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import * as ET from 'fp-ts/lib/EitherT'

import { pipe } from 'fp-ts/lib/function';

import * as A from 'fp-ts/lib/Array'

// StateEither:

type StateEither<S,E,A> = State<S, Either<E, A>>

const SE = {
  map: ET.map(S.Functor), // EitherT (transformer), map function, together with State.Functor.
  mapL: ET.mapLeft(S.Functor),
  chain: ET.chain(S.Monad),
  ap: ET.ap(S.Apply),
  alt: ET.alt(S.Monad),
};

type TestState = string;
type Error = string;

describe('StateEither', () => {
  test('map', () => {
    const a: State<TestState,Either<Error, number>> = S.of(E.of(1));
    const mappedA = SE.map((x: number) => x + 1)(a);
    const result = mappedA('run');

    expect(result).toEqual([E.of(2), 'run']);
  })

  const s1: State<string, number> = S.of(1)
  const s2: State<string, number> = (s: string) => [2, 'abc'];

  test('chain', () => {
    const f: (x:number) => State<string, Either<Error, string>> = (x: number) => (stateIn: TestState) => {
      const result =  x + 1;
      const stateOut = stateIn + `; ${x} => ${result}`
      return [E.of<Error, string>(`${stateIn}; ${result}`), stateOut];
    }

    const a: State<TestState,Either<Error, number>> = S.of(E.of(1));
    const result = SE.chain(f)(a)('StartState');
    expect(result).toEqual([E.of('StartState; 2'), 'StartState; 1 => 2'])
  })

  test('alt', () => {
    const a: State<TestState,Either<Error, number>> = S.of(E.left('err'));
    const b: State<TestState,Either<Error, number>> = S.of(E.of(1));

    const result = SE.alt(() => b)(a);

    expect(result('stateIn')).toEqual([E.of(1), 'stateIn'])
  })

  test('ap', () => {
    const seFunc = S.of(E.of((x: number) => x+1));
    const seValue = S.of(E.of(1));

    const result = SE.ap(seValue)(seFunc);

    expect(result('startState')).toEqual([E.of(2), 'startState']);
  })
})

// Parser: based on StateEither:

type ParserState = {
  str: string,
  pos: number
}

const moveState = (s: ParserState) => (x: number) => ({str: s.str, pos: s.pos + x});

type ParserError = string

type Parser<T> = StateEither<ParserState, ParserError, T>
const ofParser = <T>(t:T): Parser<T> => S.of(E.right(t));

// Ahh, the limitations of Javascript...
type Character = string;

// Get any character at all, if one is available
const anyParser: Parser<Character> = (s: ParserState) => 
  (s.str.length > s.pos)?
    [E.right(s.str[s.pos]), moveState(s)(1)]:
    [E.left(`Error: eof, [pos: ${s.pos}]`), s];


describe('anyParser', () => {
  test('gets a character if available', () => {
    const startState = {
      str: 'abc',
      pos: 0
    };

    expect(anyParser(startState)).toEqual([E.of('a'), {str: 'abc', pos: 1}]);
  })

  test('error if no character available', () => {
    const startState = {
      str: 'abc',
      pos: 3
    };

    expect(anyParser(startState)).toEqual([E.left('Error: eof, [pos: 3]'), startState]);
  })
});

// Restore original state if the parser fails.
const tryParse = <T>(parser: Parser<T>): Parser<T> => (startState: ParserState) => {
  const [result, endState] = parser(startState);
  return E.isLeft(result)? [result, startState]: [result, endState];
}

const setError = (err: string) => (parser: Parser<string>): Parser<string> => (startState: ParserState) => {
  const [result, endState] = parser(startState);
  return E.isLeft(result)? [E.left(err), startState]: [result, endState];
}


describe('tryParse', () => {
  test('restores start state', () => {

    const failParser: Parser<string> = (s: ParserState) => [E.left('dummy error'), {str: 'xyz', pos: 123}];

    const startState = {
      str: 'abc',
      pos: 0
    };
    const result = tryParse(failParser)(startState)

    expect(result).toEqual([E.left('dummy error'), startState]);
  })
})

// Get a specific character.
// If anyParser fails, we are ok.
// If anyParser succeeds, but the following line fails, then we need to rollback the state. Hence, wrap it in tryParse
const charParser = (s: Character): Parser<Character> => 
  tryParse(
    pipe(
      anyParser,
      SE.chain((anyChar: Character) => (anyChar === s)? S.of(E.of(s)): S.of(E.left(`Error: wrong character`)))
    )
  );

describe('charParser', () => {
  test('succeeds with specified char', () => {

    const startState = {
      str: 'abc',
      pos: 0
    };
    const result = charParser('a')(startState);

    expect(result).toEqual([E.of('a'), {str: 'abc', pos: 1}]);
  })

  test('fails with incorrect char', () => {

    const startState = {
      str: 'abc',
      pos: 0
    };
    const result = charParser('b')(startState);

    expect(result).toEqual([E.left('Error: wrong character'), {str: 'abc', pos: 0}]);
  })
})


// Get one of any of the Parsers in the array:
const oneOfParser = <T>(parsers: Parser<string>[]): Parser<string> => {
  const parserError = 'Error: not one of';
  const failParser: Parser<string> = S.of(E.left(parserError));
  const result = pipe(
    parsers,
    A.reduce(failParser, (prev, curr) => SE.alt(()=> curr)(prev)),
    SE.mapL(()=> parserError)
  );
  return result;
}

describe('oneOfParser', () => {
  test('fails with no matches', () => {

    const allParsers = [charParser('b'), charParser('c')];

    const startState = {
      str: 'abc',
      pos: 0
    };
    const result = oneOfParser(allParsers)(startState);

    expect(result).toEqual([E.left('Error: not one of'), {str: 'abc', pos: 0}]);
  })
})


// Parse, getting an A, then a B. Return as a tuple.
const aThenbParser = <A, B>(aParser: Parser<A>, bParser: Parser<B>): Parser<[A,B]> => tryParse(
  SE.chain((a:A) => SE.map((b:B) => [a,b] as [A,B])(bParser) )(aParser)
)


describe('aThenbParser parser', () => {
  const aParser: Parser<string> = charParser('a');
  const bParser: Parser<string> = charParser('b');
  const abParser = aThenbParser(aParser, bParser);
  it.each([
    [
      'parser failure', 
      {str: 'x', pos: 0}, 
      [E.left('Error: wrong character'),{str: 'x',pos: 0}]
    ],
    [
      'parser failure with a but not b', 
      {str: 'ax',pos: 0}, 
      [E.left('Error: wrong character'), {str: 'ax',pos: 0}],
    ],
    [
      'parser success', 
      {str: 'abx',pos: 0}, 
      [E.right(['a', 'b']), {str: 'abx',pos: 2}],
    ]
  ])('%p', (_, startState, result) => {
    expect(abParser(startState)).toEqual(result);
  })
})

// Given a Parser<T>, construct a Parser<Option<T>>
// This parser will succeed if the next thing is a T (with O.some(T)), and will also
// succeed (with O.none) if the next thing is not a T
// The key is that it takes the result of the parser, and the next line
// is an S.map (i.e. maps at the level of the State output, not the StateEither/Parser output)
// This lets it map a failure into a success, and lift all the output in the Option space.
const optionalOf = <T>(parser: Parser<T>): Parser<Option<T>> => {
  const result = pipe(
    parser,
    S.map(E.match(
      (failure: string) => E.right(O.none),
      (success: T) => E.right(O.some(success))
    ))
  );
  return result;
}

describe('optionalOf parser', () => {
  const aParser: Parser<string> = charParser('a');
  const optionalAParser = optionalOf(aParser);
  it.each([
    [
      'eof', 
      {str: 'x', pos: 1}, 
      [E.right(O.none),{str: 'x',pos: 1}]
    ],
    [
      'success with None', 
      {str: 'x',pos: 0}, 
      [E.right(O.none), {str: 'x',pos: 0}],
    ],
    [
      'success with Some', 
      {str: 'ab',pos: 0}, 
      [E.right(O.some('a')), {str: 'ab',pos: 1}],
    ]
  ])('%p', (_, startState, result) => {
    expect(optionalAParser(startState)).toEqual(result);
  })
})

// nParser: 0+ instances of T in a row.
// A recursive parser.
// Basically does this:
// * run the specified parser as an optionalOf(parser)
// * if the result was None, then the result is an empty array, so lift and return that.
// * if the result was Some, then take the some value and concat it with recursively
//   calling the nParser(parser) again.
const nParser = <T>(parser: Parser<T>): Parser<T[]> => {
  const optionTtoParserTs = <T>(tOpt: Option<T>): Parser<T[]> => 
    O.match<T, Parser<T[]>>(
      () => ofParser([]),
      (t: T) => SE.map((ts: T[]) => [t].concat(ts))(nParser(parser) as Parser<T[]>)
    )(tOpt)

  return  pipe(
    optionalOf(parser), // Parser<Option<T>>
    SE.chain(optionTtoParserTs));
}


describe('nParser', () => {
  const aParser: Parser<string> = charParser('a');
  const testParser: Parser<string[]> = nParser(aParser);
  it.each([
    [
      'eof', 
      {str: 'x', pos: 1}, 
      [E.right([]),{str: 'x',pos: 1}]
    ],
    [
      '0 chars', 
      {str: 'x',pos: 0}, 
      [E.right([]), {str: 'x',pos: 0}],
    ],
    [
      'success with 1 char', 
      {str: 'ab',pos: 0}, 
      [E.right(['a']), {str: 'ab',pos: 1}],
    ],
    [
      'success with 2 char', 
      {str: 'aab',pos: 0}, 
      [E.right(['a', 'a']), {str: 'aab',pos: 2}],
    ],
  ])('%p', (_, startState, result) => {
    expect(testParser(startState)).toEqual(result);
  })
})


// nParserAtLeast1: 1+ instances of T in a row.
// The same as running the parser, and then nParser(parser) after it.
const nParserAtLeast1 = <T>(parser: Parser<T>): Parser<T[]> => 
  pipe(
    parser,
    SE.chain(t => SE.map((ts: T[]) => [t].concat(ts))(nParser(parser))))

describe('nParserAtLeast1 ', () => {
  const aParser: Parser<string> = charParser('a');
  const testParser: Parser<string[]> = nParserAtLeast1(aParser);
  it.each([
    [
      'eof', 
      {str: 'x', pos: 1}, 
      [E.left('Error: eof, [pos: 1]'),{str: 'x',pos: 1}]
    ],
    [
      'failure', 
      {str: 'x',pos: 0}, 
      [E.left('Error: wrong character'), {str: 'x',pos: 0}],
    ],
    [
      'success 1 char', 
      {str: 'ab',pos: 0}, 
      [E.right(['a']), {str: 'ab', pos: 1}]
    ],
    [
      'success >1 char', 
      {str: 'aab',pos: 0}, 
      [E.right(['a', 'a']), {str: 'aab', pos: 2}]
    ]
  ])('%p', (_, startState, result) => {
    expect(testParser(startState)).toEqual(result);
  })
})
