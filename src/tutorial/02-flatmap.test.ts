
import * as A from 'fp-ts/lib/Array'
import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { Reader } from 'fp-ts/lib/Reader';
import * as R from 'fp-ts/lib/Reader';


import { pipe } from 'fp-ts/lib/function';
import { TaskEither } from 'fp-ts/lib/TaskEither';
import * as TE from 'fp-ts/lib/TaskEither'


// Prologue. Reminder of the broader context.
// We are interested in functions.
// Functions are 'programs'. We create programs by putting other programs together.
// At the most basic level, this gives us a basic framework as to how we build programs.
// What is the significance of map ? It lets us compose functions such that they can
// be used in a wide variety of contexts (any data structure/wrapper/context that is mappable)
// To do so, we moved our thinking about map to a higher level of abstration than simply
// being Array.map
// Today we will look at another little helper for composing functions,
// that relates to a common situation we find ourselves in.

const getWordLengths = (s: string): number[] => 
  (s.split(' ').map(word => word.length));

// Let's say we want to calculate the lengths of words in song names:
describe('map vs flatmap', () => {
  test('array map', () => {
    const a: string[] = ['A Day in the Life', 'The Great Gig in the Sky', 'Where the Streets Have no Name'];

    const result: number[][] = a.map(getWordLengths);
    // const result = A.map(getWordLengths)(a);

    // with map, the result is an annoying array of arrays.
    // Probably we were hoping for something more like: 
    // [1,3,2,3,4, 3,5,3,2,3,3,5,3,7,4,2,4]
    expect(result).toEqual(
      [
        [1,3,2,3,4], 
        [3,5,3,2,3,3], 
        [5,3,7,4,2,4]
      ]
    );
  })

  // Flatmap to the rescue!
  test('array flatmap', () => {
    const a: string[] = ['A Day in the Life', 'The Great Gig in the Sky', 'Where the Streets Have no Name'];

    const result: number[] = a.flatMap(getWordLengths);

    expect(result).toEqual(
      [
        1,3,2,3,4, 
        3,5,3,2,3,3, 
        5,3,7,4,2,4
      ]
    );
  })
});


describe('fp-ts flatMap (flatmap/bind)', () => {
  test('array map', () => {
    const a: string[] = ['A Day in the Life', 'The Great Gig in the Sky', 'Where the Streets Have no Name'];

    const result = A.map(getWordLengths)(a);

    expect(result).toEqual([
      [1, 3, 2, 3, 4],
      [3, 5, 3, 2, 3, 3],
      [5, 3, 7, 4, 2, 4]
    ]);
  });

  test('array flatMap', () => {
    const a: string[] = ['A Day in the Life', 'The Great Gig in the Sky', 'Where the Streets Have no Name'];

    const result = A.flatMap(getWordLengths)(a);

    expect(result).toEqual([1, 3, 2, 3, 4, 3, 5, 3, 2, 3, 3, 5, 3, 7, 4, 2, 4]);
  });

  // Things to note:
  // * the function getting mapped has the form: a => T[b] (e.g. getWordLengths is: string => number[])
  // * so the function getting mapped results in a structure/wrapper/context that is the same as the one we are already in.
  // * so what is flatmap doing? It maps the value, but it 'knows' something about managing the structure/wrapper/context
  //    that the value comes back in, and can 'undo' a double structure/wrapper/context.

  // So, as for map, let's now look at other structure/wrapper/contexts, and see if the concept of flatMapping (flatMap) applies...

  // Hello Option:
  const toNumber = (s: string): Option<number> => {
    const parseResult = parseInt(s);
    const validNumber: boolean = !Number.isNaN(parseResult) && parseResult.toString() == s;
    return validNumber ? O.some(parseResult) : O.none;
  };

  // const toCustomerId = (n: number): Option<string> => (n.toString().length === 4 ? O.some(`customer:${n}`): O.none)
  const toCustomerId = (n: number): Option<string> =>
    pipe(
      n,
      O.fromPredicate((x) => x.toString().length === 4),
      O.map((n) => `customer:${n}`)
    );

  test('option flatMap', () => {
    const a: string = '1234';

    const parsedA: Option<number> = toNumber(a);

    const customerIdOptionOption: Option<Option<string>> = O.map(toCustomerId)(parsedA);
    // Oh ugly double wrapper...
    expect(customerIdOptionOption).toEqual(O.some(O.some('customer:1234')));

    const customerIdO: Option<string> = O.flatMap(toCustomerId)(parsedA);
    // vs. thing of beauty:
    expect(customerIdO).toEqual(O.some('customer:1234'));

    // Compare the structure.
    // Map gave us:
    // O.map(a => Option<b>)(Option<a>) => Option<Option<b>>

    // flatMap (flatmap) gave us:
    // O.flatMap(a => Option<b>)(Option<a>) => Option<b>

    // and compare to arrays (and think again as if Option were a 0-1 element array)
    // O.map(a => Array<b>)(Array<a>) => Array<Array<b>>
    // O.flatMap(a => Array<b>)(Array<a>) => Array<b>

    // Put it all together:
    const customerIdOv2: Option<string> = pipe(
      a, 
      toNumber,                 // Option<number>
      O.flatMap(toCustomerId));   // ... therefore flatMap because toCustomerId: x => Option<y>

    expect(customerIdOv2).toEqual(O.some('customer:1234'));
  });

  interface Customer {
    name: string;
  }

  const customers: Map<string, Customer> = new Map<string, Customer>([
    ['customer:1234', { name: 'Henry' }],
    ['customer:8765', { name: 'Mary' }]
  ]);

  type CustomerId = string;
  const getCustomer = (customerId: CustomerId): Option<Customer> => 
    O.fromNullable(customers.get(customerId));

  test('option flatMap 2', () => {
    const customerId1Str = '8765';
    const customerId2Str = '9999';

    const customer1Option: Option<Customer> = pipe(
      customerId1Str,
      toNumber,               // Option<number>
      O.flatMap(toCustomerId),  // Option<string>
      O.flatMap(getCustomer)    // Option<Customer>
    );

    expect(customer1Option).toEqual(O.some({ name: 'Mary' }));

    const customer2Option: Option<Customer> = pipe(
      customerId2Str,
      toNumber,     // Option<number>     (O.none)
      O.flatMap(toCustomerId),
      O.flatMap(getCustomer)
    );

    //
    // const num = toNumber("fdsdsdfs");
    // if (num === undefined)return;
    // const customerId = toCustomerId(num);
    // if (customerId === undefined) return;
    // const result = getCustomer(customerId);
    // return result;

    expect(customer2Option).toEqual(O.none);

    // Now there are 2 chains in a row, think about what is happening when toNumber returns none...
    // (again, if you are stumped, imagine that Option<> is just a 0-1 element array, and O.none means there are 0 elements in it)

    const customer3Option: Option<Customer> = pipe(
      'Not a number',
      toNumber,                 // toNumber produced an Option<number> with value O.none;
      O.flatMap(toCustomerId),    // So O.flatMap will take every single value in the option, of which there are none, and transforms/maps the value, 
                                // and turns the double Option wrapping into just one Option
                                // But of course, there are no values in there. So it just returns/forwards on the O.none
      O.flatMap(getCustomer)      // The previous line produced O.none.
                                // Again, we O.flatMap over it, which gets each value in the option (of which there are none) and ... etc etc.
    );

    expect(customer2Option).toEqual(O.none);
  });

  // Let's pretend we have a system where,
  // * we start with raw user input text
  // * first, we query one API to the user input processed into SearchParameters
  // * second, we then use the searchParameters to perform a search.
  // and hopefully search magic happens :-)
  //
  // So the sequence is something like:
  // userInput => SearchParameters => SearchResults
  // But each transformation involves making an api request.
  // So, the fact of performing an api request means that Task<> gets involved.

  interface SearchParameters {
    keywords: string[];
  }
  interface SearchResult {
    documentName: string[];
  }

  // Task
  const getSearchParameters = (userInput: String): Task<SearchParameters> => 
      T.of({ keywords: userInput.split(' ') });

  const search = (searchParameters: SearchParameters): Task<SearchResult> => {
    const cannedDocuments = searchParameters.keywords.map((kw) => `${kw}.pdf`);
    return T.of({ documentName: cannedDocuments });
  };

  test('Task flatMap', async () => {
    const userInput: string = 'abc def';

    const searchParametersT: Task<SearchParameters> = getSearchParameters(userInput);
    const _searchResultTT: Task<Task<SearchResult>> = T.map((p: SearchParameters) => search(p))(searchParametersT);
    // So, T.map is not up to the job, because it leaves us with Task<Task<
    // But again, this is structurally the same thing we saw before.
    // So one would expect that maybe there is a Task.flatMap operation, that will map the value,
    // but also flatten out the Task<Task< into Task<

    const searchResultT: Task<SearchResult> = T.flatMap((p: SearchParameters) => search(p))(searchParametersT);

    const executedSearchResult: SearchResult = await searchResultT();

    expect(executedSearchResult).toEqual({ documentName: ['abc.pdf', 'def.pdf'] });

    // Rewritten as pipe:
    const searchResultT2: Task<SearchResult> = pipe(
      userInput,
      getSearchParameters,
      T.flatMap(search)
    );
    const executedSearchResult2: SearchResult = await searchResultT2();
    expect(executedSearchResult2).toEqual({ documentName: ['abc.pdf', 'def.pdf'] });
  });

  // Either

  // toNumberE is simply the Option version of toNumber, shifted into the Either version.
  // The error, of course, is a bit odd because there's only one sort of error.
  type CustomerIdError = string;
  const toNumberE = (s: string): Either<CustomerIdError, number> => 
    E.fromOption(() => 'Not a number')(toNumber(s));

  // from earlier: type CustomerId = string
  const toCustomerIdE = (n: number): Either<CustomerIdError, CustomerId> =>
    pipe(
      E.right(n),
      E.filterOrElse(
        (n) => n > 999 && n < 10000,
        () => 'Number out of range'
      ),
      E.map((n: number) => `customer:${n}`)
    );

  test('either flatMap', () => {
    const stringIn = '1234';

    const asNumberE: Either<CustomerIdError,number> = toNumberE(stringIn);
    const _customerIdEE: Either<CustomerIdError, Either<CustomerIdError, CustomerId>> = E.map(toCustomerIdE)(asNumberE);

    // We are back with the double wrapper problem.
    // Also, this can make clearer why the left (Error) value is actually part of the structure.
    // CustomerId is the type we are interested in, that is wrapped in the context of Either<Error.
    // Imagine if you were to replace Either<Error,   with T<

    // Either<Error, Either<Error, CustomerId>>
    // T<            T<            CustomerId

    // So, again, we might hope that their is a Either.flatMap operation, that lets us map into the value
    // and undo the double wrapper/context/data structure problem. As you might imagine...

    const customerIdE: Either<CustomerIdError, CustomerId> = E.flatMap(toCustomerIdE)(asNumberE);

    expect(customerIdE).toEqual(E.right('customer:1234'))

    const customerId2E: Either<CustomerIdError, CustomerId> = pipe(
      '123',
      toNumberE,
      E.flatMap(toCustomerIdE)      // The failure happened here
    )
    expect(customerId2E).toEqual(E.left('Number out of range'))

    const customerId3E: Either<CustomerIdError, CustomerId> = pipe(
      'This is not a number',
      toNumberE,                  // This time, the failure happened here.
      E.flatMap(toCustomerIdE)
    )
    expect(customerId3E).toEqual(E.left('Not a number'))
  })

  test('TaskEither flatMap', async () => {
    // So, what if we combine what happened with Task, but now consider that errors could happen along the way.
    // For this example, the first api we hit takes a string, and returns a customer number or error.
    // The second api takes the customer number (if there is one) and returns data about them if they have
    // been completely setup.

    type Error = string;
    type CustomerData = {
      customerId: number,
      description: string,
      setupDateEpoch: number
    }

    // and let's pretend that the customerStr is also coming to us from a previous async Task that could have errored.
    const customerStr: TaskEither<Error, string> = TE.right("Hombre de Queso Inc.");
    const getCustomerId = (customerStr: string): TaskEither<Error, number> => TE.right(1);
    const getCustomerInfo = (customerId: number): TaskEither<Error, CustomerData> => TE.right({
      customerId: 1,
      description: 'abc',
      setupDateEpoch: Date.now()
    });

    const customerData: TaskEither<Error, CustomerData> = pipe(
      customerStr,
      TE.flatMap(getCustomerId),
      TE.flatMap(getCustomerInfo)
    );

    const customerDataExecuted:  Either<Error, CustomerData>= await customerData();
  })

  test('reader flatmap', () => {

    interface Config {
      context: string
    }

    const a: Reader<Config, number> = (config: Config) => 1;
    const numToString = (x: number): string => x.toString();
    const numToReaderString = (x: number): Reader<Config, string> => (config: Config) => `${x}: in context ${config.context}`;
    // Notice here, our function returns a Reader, and the value getting provided is also a Reader.
    const result: Reader<Config, string> = R.flatMap(numToReaderString)(a);

    const executedResult: string = result({context: 'prod'});
    expect(executedResult).toEqual('1: in context prod');


    // Which if reader wasn't there would be more like:
    const a2: number = 1;
    const result2: string = numToString(a2);
    expect(result2).toEqual('1')
  })
})


describe('Tasks (fp-ts) vs Promises (javascript)', () => {

  // Finally, a little aside on the relationship between Task (in fp-ts) and Promise (in JavaScript)
  // Ignore if it hurts your brain.
  const add1P = (n: number): Promise<number> => new Promise((resolve, reject) => {
    resolve(n + 1);
  });

  test('Javascript promises', async () => {
    const initialValue = 0;

    const result: Promise<number> = add1P(1);
    const resultExecuted: number = await result;

    expect(resultExecuted).toEqual(2)

    const result2 = add1P(1).then(x => x + 1);    // lambda that is number => number
    const result2Executed: number = await result2;
    expect(result2Executed).toEqual(3)

    const result3 = add1P(1).then(x => add1P(x)); // lambda that is number => Promise<number>
    const result3Executed: number = await result3;
    expect(result3Executed).toEqual(3);

    // Now ask yourself, how is it it was possible to put functions with different signatures into .then(...)
    // How is the system dealing with the fact that one returns a promise, but the other doesn't?
    // The answer : Promise.then(...) can basically operate as both Promise.map(...) and Promise.flatMap(...)
    // You can consider this one of two ways:
    // - javascript is a dynamic language can it can whatever it likes with types.
    // - the signature of the f in  .then(f) for the example above is effectively: (promiseResult: number) => number | Promise<number> | null | undefined
    //    and the javascript runtime will flatMap the Promises for you.

    // The other thing to consider is that Promises start to run immediately, but Tasks do nothing at all until they exec: await myTask();
    // This has the effect of removing code placement initiating execution order from influencing code execution.
  })
})