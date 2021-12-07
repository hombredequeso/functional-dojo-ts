
import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';


import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither';

import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither';
import * as RTE from 'fp-ts/lib/ReaderTaskEither';
import { boolean } from 'fp-ts';
import { pipe } from 'fp-ts/lib/function';

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

class ParseError {
  constructor(m: string) {
    this.msg = m;
  }
  msg: string;
  static readonly __type: string = "ParseError"
}


const parseNumber = (s: string): Either<ParseError, number> => {
  const parseResult = parseInt(s);
  const validNumber: boolean = !isNaN(parseResult);
  return validNumber?
    E.right(parseResult) :
    E.left(new ParseError(`parseNumber error: ${s} is not a number`));
}

type ToCommandError = ParseError

const toCommand = (request: RequestIn): Either<ToCommandError, IncreaseCommand> => {
  const amount: Either<ParseError, number> = parseNumber(request.input)
  const result1 = E.map((a:number) => ({
    id: request.id,
    amount: a
  }))(amount);
  return result1;
  // return E.mapLeft((e: ParseError) => e)(result1);
}

// Exercise: rewrite handleCommand using this:
// const toSafeInteger = (n:number): Option<number> = ???

class HandleCommandError {
  constructor(m: string) {
    this.msg = m;
  }
  msg: string;
  static readonly __type: string = "HandleCommandError"
}

const handleCommand = (cmd: IncreaseCommand): ReaderTaskEither<Config, HandleCommandError, CommandResult> => {
  const isIdValid = Number.isSafeInteger(cmd.id);
  const executionResult: Either<HandleCommandError, CommandResult> =  isIdValid? E.right({
    commandExecuted: cmd
  }):
  E.left(new HandleCommandError(`handleCommand: ${cmd.id} is not a valid id`));
  return RTE.fromEither(executionResult);
}


const toRequestResponse = (cmdResult: CommandResult): RequestResponse => {
  return {
    id: cmdResult.commandExecuted.id
  }
}

type ExecutionError = HandleCommandError | ToCommandError

const executeRequestLongForm = (request: RequestIn): ReaderTaskEither<Config, ExecutionError, RequestResponse> => {
  const cmd: Either<ToCommandError, IncreaseCommand> = toCommand(request);
  const cmdTE: ReaderTaskEither<Config, ExecutionError, IncreaseCommand> = RTE.fromEither(cmd);
  const handleResult: ReaderTaskEither<Config, ExecutionError, CommandResult> = RTE.chain(handleCommand)(cmdTE);
  const result: ReaderTaskEither<Config, ExecutionError, RequestResponse> = RTE.map(toRequestResponse)(handleResult);
  return result;
}

const executeRequest = (request: RequestIn): ReaderTaskEither<Config, ExecutionError, RequestResponse> => pipe(
  request,
  toCommand,
  RTE.fromEither,
  RTE.chain(handleCommand),
  RTE.map(toRequestResponse)
);

describe('readertaskeither', () => {
  test('executeRequest', async () => {

    const request: RequestIn = {
      id: 123,
      input: '3'
    }

    // Construct the 'functional program'
    const commandResult: ReaderTaskEither<Config, ExecutionError, RequestResponse> = executeRequest(request);


    // Execute 'the program'
    const config: Config = {
      apiUrl: "http://whatevs.com"
    }
    const executedResult: Either<ExecutionError, RequestResponse> = await commandResult(config)()

    const expectedResult: RequestResponse = {
        id: 123,
    }

    expect(executedResult).toEqual(E.right(expectedResult));
  })

  test('executeRequest failure', async () => {

    const request: RequestIn = {
      id: 123,
      input: 'NotAnAmount'
    }

    // Construct the 'functional program'
    const commandResult: ReaderTaskEither<Config, ExecutionError, RequestResponse> = executeRequest(request);


    // Execute 'the program'
    const config: Config = {
      apiUrl: "http://whatevs.com"
    }
    const executedResult: Either<ExecutionError, RequestResponse> = await commandResult(config)();

    const expectedResult: ExecutionError = new ParseError("parseNumber error: NotAnAmount is not a number");

    expect(executedResult).toEqual(E.left(expectedResult));
  })

})
