
import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';


import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';

interface RequestIn {
  id: number
  input: string
}

interface RequestResponse {
  id: number
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

const handleCommand = (cmd: IncreaseCommand): TaskEither<Error, CommandResult> => {
  const isIdValid = Number.isSafeInteger(cmd.id);
  const executionResult: Either<string, CommandResult> =  isIdValid? E.right({
    commandExecuted: cmd
  }):
  E.left(`handleCommand: ${cmd.id} is not a valid id`);
  return TE.fromEither(executionResult);
}

const toRequestResponse = (cmdResult: CommandResult): RequestResponse => {
  return {
    id: cmdResult.commandExecuted.id
  }
}


const executeRequest = (request: RequestIn): TaskEither<Error, RequestResponse> => {
  throw "todo";
}

describe('taskeither (todo)', () => {
  test('executeRequest (todo)', async () => {

    const request: RequestIn = {
      id: 123,
      input: '3'
    }

    const commandResult: TaskEither<Error, RequestResponse> = executeRequest(request);

    const expectedResult: RequestResponse = {
        id: 123,
    }

    expect(await commandResult()).toEqual(E.right(expectedResult));
  })
})
