
import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

interface RequestIn {
  id: number
  input: string
}

interface IncreaseCommand {
  id: number
  amount: number
}

interface CommandResult {
  commandExecuted: IncreaseCommand
}

type Error = string

const parseNumber = (s: string): Either<Error, number> => {
  const parseResult = parseInt(s);
  return (!Number.isNaN(parseResult))? E.right(parseResult) : E.left(`parseNumber error: ${s} is not a number`);
}



const toCommand = (request: RequestIn): Either<Error, IncreaseCommand> => {
  const amount: Either<Error, number> = parseNumber(request.input)
  return E.map((a:number) => ({
    id: request.id,
    amount: a
  }))(amount);
}

// Exercise: rewrite handleCommand using this:
// const toSafeInteger = (n:number): Option<number> = ???

const handleCommand = (cmd: IncreaseCommand): Either<Error, CommandResult> => {
  const isIdValid = Number.isSafeInteger(cmd.id);
  return isIdValid? E.right({
    commandExecuted: cmd
  }):
  E.left(`handleCommand: ${cmd.id} is not a valid id`);
}

const executeRequest = (request: RequestIn): Either<Error, CommandResult> => {
  throw 'todo';
}

describe('either (todo)', () => {
  test('executeRequest', () => {

    const request: RequestIn = {
      id: 123,
      input: '3'
    }

    const commandResult: Either<Error, CommandResult> = executeRequest(request);

    const expectedResult: CommandResult = {
      commandExecuted: {
        id: 123,
        amount: 3
      }
    }

    expect(commandResult).toEqual(E.right(expectedResult));
  })
})
