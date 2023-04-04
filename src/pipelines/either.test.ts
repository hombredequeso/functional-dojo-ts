
import { Either } from 'fp-ts/Either';
import * as E from 'fp-ts/Either';

import { pipe } from 'fp-ts/function'

interface Request {
  id: string
  count: string
  description: string
}

type Id = string
type Error = string
type Integer = number
type Timestamp = number

interface CreateCommand {
  id: Id
  count: Integer
  description: string
}

const createCommand = (id: Id) => (count: Integer) => (description: string) => ({
  id: id,
  count: count,
  description: description
})

interface Entity {
  id: Id
  count: Integer
  description: string
  timestamp: Timestamp
}

const toCreateCommand = (request: Request): Either<Error, CreateCommand> => {
  const id: Either<Error, Id> = 
    toId(request.id)
  const count: Either<Error, Integer> = 
    toInteger(request.count)
  const description: Either<Error, string> = 
    E.right(request.description)
  const result: Either<Error, CreateCommand> = 
    pipe(E.of(createCommand), E.ap(id), E.ap(count), E.ap(description))

  return result;
}

const toEntity = (cmd: CreateCommand, timestamp: Timestamp): Entity => ({
  id: cmd.id,
  count: cmd.count,
  description: cmd.description,
  timestamp: timestamp
});

// const toResultString = (result: Either<Error, Entity): string = "todo"

// const program = (request: Request, timestamp: Timestamp): string => {
//   // todo
// }
  

const idRegEx = new RegExp('^[A-Za-z0-9]{3,30}$')
const toId = (s: string): Either<Error, Id> => idRegEx.test(s)? E.right(s): E.left(`Invalid id: ${s}`)

const integerRegEx = new RegExp('^[0-9]+$');
const toInteger = (s: string): Either<Error, Integer> =>
  integerRegEx.test(s)? E.right(Number(s)): E.left(`Invalid integer: ${s}`)


describe('toCreateCommand', () => {
  test('invalid Request returns left', () => {
    const request: Request = {
      id: "43432",
      count: "NOT A NUMBER",
      description: "test description"
    };

    const result = toCreateCommand(request);

    expect(result).toEqual(E.left("Invalid integer: NOT A NUMBER"));
  })


  test('valid Request returns right', () => {
    const request: Request = {
      id: "43432",
      count: "1",
      description: "test description"
    };

    const result = toCreateCommand(request);
    const expectedResult: CreateCommand = {
      id: "43432",
      count: 1,
      description: "test description"
    };

    expect(result).toEqual(E.right(expectedResult));
  })
})
