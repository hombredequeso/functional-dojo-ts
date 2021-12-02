interface Entity {
  id: number,
  msg: string
}

const getId = (s: string): number => 1
const getEntity = (i: number): Entity =>
  ({ id: i, msg: 'hello' })

describe('no config', () => {
  test('compose', () => {

    const prog = (s: string): Entity => getEntity(getId(s))

    expect(prog('1')).toEqual({ id: 1, msg: 'hello' })
  })
})

// now with config required

interface Config {
  idApiUrl: string,
  entityApiUrl: string
}

const getIdC = (c: Config, s: string): number =>
  1
const getEntityC = (c: Config, i: number): Entity =>
  ({ id: i, msg: 'hello' })

describe('with config', () => {
  test('compose', () => {

    const prog = (c: Config, s: string): Entity => 
      getEntityC(c, getIdC(c, s))

    const config: Config = {
      idApiUrl: 'http://getids-prod',
      entityApiUrl: 'http://getentitiy-prod'
    }
    expect(prog(config, '1')).toEqual({ id: 1, msg: 'hello' })
  })
})


// now with reader

import { Reader} from 'fp-ts/lib/Reader';
import * as R from 'fp-ts/lib/Reader';
import { pipe } from 'fp-ts/lib/function'

const getIdR = (s: string): Reader<Config, number> =>
  (r: Config) =>
    1;
const getEntityR = (i: number): Reader<Config, Entity> =>
  (r: Config) =>
    ({ id: i, msg: 'hello' })


describe('with reader', () => {
  test('compose', () => {

    // Note how the config disappears from the function arguments
    // (and hence, doesn't have to be pass in there)
    // but pops out in the output type
    //    Reader<Config
    // Additional cost is the need to then understand
    // what R.chain is doing when composing functions
    // together, but at least the composing looks cleaner
    // than managing the extra Config argument everywhere.
    // On it's own, the benefits of Reader<Config may not
    // seem a lot, when put together with other types,
    // for instance ReaderTaskEither<Config, Error, ...
    // it removes considerable code overhead

    // This reads closer to the first version.
    const prog = (s: string): Reader<Config, Entity> => 
      R.chain(getEntityR)(getIdR(s));

    // Alternatively:
    const progAlternate = (s: string): Reader<Config, Entity> =>
    pipe(
      s,
      getIdR,
      R.chain(getEntityR)
    )

    const config: Config = {
      idApiUrl: 'http://getids-prod',
      entityApiUrl: 'http://getentitiy-prod'
    }
    const resultValue: Reader<Config, Entity> = prog('1')
    const executedResultValue: Entity = resultValue(config);
    expect(executedResultValue).toEqual(
      { id: 1, msg: 'hello' })
  })
})