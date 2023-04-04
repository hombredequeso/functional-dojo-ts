
import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';


import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';

import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';

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

interface RequestResponse {
  id: number
}

interface Config {
  apiUrl: string
}

type Error = string

const parseNumber = (s: string): Either<Error, number> => {
  const parseResult = parseInt(s);
  return !Number.isNaN(parseResult)? E.right(parseResult) : E.left(`parseNumber error: ${s} is not a number`);
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

const handleCommand = (cmd: IncreaseCommand): ReaderTaskEither<Config, Error, CommandResult> => {
  const isIdValid = Number.isSafeInteger(cmd.id);
  const executionResult: Either<string, CommandResult> =  isIdValid? E.right({
    commandExecuted: cmd
  }):
  E.left(`handleCommand: ${cmd.id} is not a valid id`);
  return RTE.fromEither(executionResult);
}


const toRequestResponse = (cmdResult: CommandResult): RequestResponse => {
  return {
    id: cmdResult.commandExecuted.id
  }
}

const executeRequest = (request: RequestIn): ReaderTaskEither<Config, Error, RequestResponse> => {
  const cmd: Either<Error, IncreaseCommand> = toCommand(request);
  const cmdTE: ReaderTaskEither<Config, Error, IncreaseCommand> = RTE.fromEither(cmd);
  const handleResult: ReaderTaskEither<Config, Error, CommandResult> = RTE.chain(handleCommand)(cmdTE);
  const result: ReaderTaskEither<Config, Error, RequestResponse> = RTE.map(toRequestResponse)(handleResult);
  return result;
}

describe('readertaskeither', () => {
  test('executeRequest', async () => {

    const request: RequestIn = {
      id: 123,
      input: '3'
    }

    // Construct the 'functional program'
    const commandResult: ReaderTaskEither<Config, Error, RequestResponse> = executeRequest(request);


    // Execute 'the program'
    const config: Config = {
      apiUrl: "http://whatevs.com"
    }
    const executedResult: Either<Error, RequestResponse> = await commandResult(config)()

    const expectedResult: RequestResponse = {
        id: 123,
    }

    expect(executedResult).toEqual(E.right(expectedResult));
  })
})
