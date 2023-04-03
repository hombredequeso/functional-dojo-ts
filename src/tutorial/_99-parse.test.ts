import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { State } from 'fp-ts/lib/State';
import * as S from 'fp-ts/lib/State';

import * as ET from 'fp-ts/lib/EitherT'

// T<Either<E,A>>
// Task<Either<E,A>>

import { pipe } from 'fp-ts/lib/function';
import { boolean } from 'fp-ts';

type ParserState = {
  input: string,
  current: number
}
type ParserError = string

type ParserOutput<T> = Either<ParserError, T>

type Parser<T> = State<ParserState, Either<ParserError, T>>

// type Parser<T> = State<ParserState, ParserOutput<T>>

type ParserResult<T> = [ParserOutput<T>, ParserState]

type StateEither<S,E,A> = State<S, Either<E, A>>

const stateEitherMap = ET.map(S.Functor);   // EitherT (transformer), map function, together with State.Functor.
// S.map(..........E.map(.....))
const stateEitherMonad = ET.chain(S.Monad);
const stateEitherAp = ET.ap(S.Apply);
const stateEitherAlt = ET.alt(S.Monad)

// const stateEitherFilterOrElse: 
//   <A,E,S>(pred: (a:A) => boolean, onError: () => E) => 
//   <A,E,S>(x: State<S, Either<E,A>>) =>
//   State<S, Either<E,A>> = 
//   <A,E,S>(pred: (a:A) => boolean, onError: () => E) => 
//   <A,E,S>(x: State<S, Either<E,A>>) => (s: S) => {

//     const [result, newState] = x(s);
//     return E.isLeft(result) ?
//       [E.left(onError()), s]:
//       [result, newState];
//   }

const stateEitherFilterOrElse2 = 
  <A,E,S>(pred: (a:A) => boolean, onError: () => E) => 
  <A,E,S>(x: State<S, Either<E,A>>): State<S, Either<E,A>> => (s: S) => {
    const [result, newState] = x(s);
    const execPred = (aa:A): Either<E,A> =>
      pred(aa)? E.right(aa): E.left(onError());
    return E.isLeft(result) ?
      [result, newState] as [Either<E,A>, S]:
      (pred())
      [result, newState];
  }

const setState = <S>(s: S) => <S,E,A>(parser: StateEither<S,E,A>) => (_s: S) => 
  [parser(_s), s];
const setStateForLeft = <S>(s: S) => <S,E,A>(a: StateEither<S,E,A>) => (_s: S) => {
  const [result, newState] = a(_s);

}

const tryParse = <S,E,A>(parser: State<S, Either<E,A>>): State<S, Either<E,A>> => (s: S) => {
  const [result, newState] = parser(s);
  return E.isLeft(result) ?
    [result, s] :
    [result, newState];
}

const charParserB = (c: string) => tryParse(stateEitherFilterOrElse2((a: string) => a === c, () => 'wrong char')(anyCharParser));

const anyCharParser: Parser<string> = (s: ParserState) => {
  if (s.input.length > s.current) {
    const result = E.right(s.input[s.current]);
    const newState = {input: s.input, current: s.current + 1}
    return [result, newState];
  }
  const failureResult = E.left('no letters left');
  return [failureResult, s]
}


describe('anyCharParser', () => {
  test('success', () => {
    const startState = {
      input: 'abc',
      current: 0
    };

    const result = anyCharParser(startState);

    expect(result).toEqual(
      [
        E.right('a'),
        {
          input: 'abc',
          current: 1
        }
      ]
    )
  })
  test('failure', () => {
    const startState = {
      input: 'abc',
      current: 3
    };

    const result = anyCharParser(startState);

    expect(result).toEqual(
      [
        E.left('no letters left'),
        startState
      ]
    )
  })
})

const charParser1 = (char: string): Parser<string> => (s: ParserState) => {
  const [nextCharResult, newState] = anyCharParser(s);
  const filteredResult = E.filterOrElse(c => c === char, ()=> `ERROR`)(nextCharResult)
  return E.isRight(filteredResult) ? [filteredResult, newState] : [filteredResult, s];
}


const charParser = (char: string): Parser<string> =>(s: ParserState) =>  pipe(
  anyCharParser(s),
  ([parserOutput, parserState2]): ParserResult<string> => [E.filterOrElse(c => c === char, ()=> `ERROR`)(parserOutput), parserState2],
  ([o, s2]: ParserResult<string>) => E.isRight(o)? [o,s2] : [o, s]
);



// {
//   const [nextCharResult, newState] = anyCharParser(s);
//   const filteredResult = E.filterOrElse(c => c === char, ()=> `ERROR`)(nextCharResult)
//   // const filteredResult = E.filterOrElse(c => c === char, ()=> `Incorrect string. Not ${char} at ${s.current}`)(nextCharResult)
//   return E.isRight(filteredResult) ? [filteredResult, newState] : [filteredResult, s];
// }

describe('charParser', () => {
  test('success', () => {
    const startState = {
      input: 'abc',
      current: 0
    };

    const result = charParser('a')(startState);

    expect(result).toEqual(
      [
        E.right('a'),
        {
          input: 'abc',
          current: 1
        }
      ]
    )
  })
  test('failure', () => {
    const startState = {
      input: 'zbc',
      current: 0
    };

    const result = charParser('a')(startState);

    expect(result).toEqual(
      [
        E.left('ERROR'),
        startState
      ]
    )
  })
  test('failure 2', () => {
    const startState = {
      input: 'zbc',
      current: 3
    };

    const result = charParser('a')(startState);

    expect(result).toEqual(
      [
        E.left('no letters left'),
        startState
      ]
    )
  })
})


// 0+ instances of Parser<T>
// const nParser = <T>(p: Parser<T>): Parser<[T]> => S.of(E.left('nParser fail'));
const nParser = <T>(parser: Parser<T>): Parser<[T]> => (initialState: ParserState) => {
  const arrayParser: Parser<T[]> = nParser(parser);
  const [result1, state1] = parser(initialState);
  if (E.isLeft(result1)) {
    return [E.right([]), initialState];
  } else {
    const [result2, state2] = arrayParser(state1);
    if (E.isRight(result2)) {
      return [E.right([result1.right].concat(result2.right)), state2];
    }
    return [result1, state1];
  }
}



describe('nParser', () => {
  test('failure', () => {
    const aParser: Parser<string> = charParser('a');
    const naParser: Parser<string[]> = nParser(aParser);

    const startState = {
      input: 'x',
      current: 0
    };

    const result = naParser(startState)

    expect(result).toEqual(
      [
        E.right([]),
        startState
      ]
    )
  })

  test('success', () => {
    const aParser: Parser<string> = charParser('a');
    const naParser: Parser<string[]> = nParser(aParser);

    const startState = {
      input: 'aax',
      current: 0
    };

    const result = naParser(startState)

    expect(result).toEqual(
      [
        E.right(['a', 'a']),
        {
          input: 'aax',
          current: 2
        }
      ]
    )
  })
})