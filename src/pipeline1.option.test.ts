
import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

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

const parseNumber = (s: string) => {
  const parseResult = parseInt(s);
  return (parseResult != NaN)? O.some(parseResult) : O.none;
}

const toCommand = (request: RequestIn): Option<IncreaseCommand> => {
  const amount: Option<number> = parseNumber(request.input)
  return O.map((a:number) => ({
    id: request.id,
    amount: a
  }))(amount);
}

// Exercise: rewrite handleCommand using this:
// const toSafeInteger = (n:number): Option<number> = ???

const handleCommand = (cmd: IncreaseCommand): Option<CommandResult> => {
  const isIdValid = Number.isSafeInteger(cmd.id);
  return isIdValid? O.some({
    commandExecuted: cmd
  }):
  O.none;
}

const executeRequest = (request: RequestIn): Option<CommandResult> => {
  const cmd: Option<IncreaseCommand> = toCommand(request);
  const handleResult: Option<CommandResult> = O.chain(handleCommand)(cmd);
  return handleResult;
}

describe('option', () => {
  test('executeRequest', () => {

    const request: RequestIn = {
      id: 123,
      input: '3'
    }

    const commandResult: Option<CommandResult> = executeRequest(request);

    const expectedResult: CommandResult = {
      commandExecuted: {
        id: 123,
        amount: 3
      }
    }

    expect(commandResult).toEqual(O.some(expectedResult));
  })
})
