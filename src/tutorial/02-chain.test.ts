
import { Tree } from 'fp-ts/lib/Tree';
import * as Tr from 'fp-ts/lib/Tree';

import * as A from 'fp-ts/lib/Array'
import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';


import { IO } from 'fp-ts/lib/IO';
import * as Io from 'fp-ts/lib/IO';

import * as S from 'fp-ts/lib/Set';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import { string } from 'fp-ts';
import { Reader } from 'fp-ts/lib/Reader';
import * as R from 'fp-ts/lib/Reader';

import * as N from 'fp-ts/lib/number'
import * as Str from 'fp-ts/lib/string'

import { pipe } from 'fp-ts/lib/function';

const getWordLengths = (s: string): number[] => (s.split(' ').map(word => word.length));

describe('map vs flatmap', () => {
  test('array map', () => {
    const a: string[] = ['A Day in the Life', 'The Great Gig in the Sky', 'Where the Streets Have no Name'];

    const result = a.map(getWordLengths);
    // const result = A.map(getWordLengths)(a);

    expect(result).toEqual(
      [
        [1,3,2,3,4], 
        [3,5,3,2,3,3], 
        [5,3,7,4,2,4]
      ]
    );
  })

  test('array flatmap', () => {
    const a: string[] = ['A Day in the Life', 'The Great Gig in the Sky', 'Where the Streets Have no Name'];

    const result = a.flatMap(getWordLengths);

    expect(result).toEqual(
      [
        1,3,2,3,4, 
        3,5,3,2,3,3, 
        5,3,7,4,2,4
      ]
    );
  })
});


describe('fp-ts chain (flatmap/bind)', () => {
  test('array map', () => {
    const a: string[] = ['A Day in the Life', 'The Great Gig in the Sky', 'Where the Streets Have no Name'];

    const result = A.map(getWordLengths)(a);

    expect(result).toEqual([
      [1, 3, 2, 3, 4],
      [3, 5, 3, 2, 3, 3],
      [5, 3, 7, 4, 2, 4]
    ]);
  });

  test('array chain', () => {
    const a: string[] = ['A Day in the Life', 'The Great Gig in the Sky', 'Where the Streets Have no Name'];

    const result = A.chain(getWordLengths)(a);

    expect(result).toEqual([1, 3, 2, 3, 4, 3, 5, 3, 2, 3, 3, 5, 3, 7, 4, 2, 4]);
  });

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

  test('option chain', () => {
    const a: string = '1234';

    const parsedA: Option<number> = toNumber(a);

    const customerIdOptionOption: Option<Option<string>> = O.map(toCustomerId)(parsedA);
    expect(customerIdOptionOption).toEqual(O.some(O.some('customer:1234')));

    const customerIdO: Option<string> = O.chain(toCustomerId)(parsedA);
    expect(customerIdO).toEqual(O.some('customer:1234'));

    const customerIdOv2: Option<string> = pipe(a, toNumber, O.chain(toCustomerId));

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
  const getCustomer = (customerId: CustomerId): Option<Customer> => O.fromNullable(customers.get(customerId));

  test('option chain 2', () => {
    const customerId1Str = '8765';
    const customerId2Str = '9999';

    const customer1Option: Option<Customer> = pipe(
      customerId1Str,
      toNumber,
      O.chain(toCustomerId),
      O.chain(getCustomer)
    );

    expect(customer1Option).toEqual(O.some({ name: 'Mary' }));

    const customer2Option: Option<Customer> = pipe(
      customerId2Str,
      toNumber,
      O.chain(toCustomerId),
      O.chain(getCustomer)
    );

    expect(customer2Option).toEqual(O.none);

    // Now there are 2 chains in a row, think about what is happening when toNumber returns none...

    const customer3Option: Option<Customer> = pipe(
      'Not a number',
      toNumber,                 // toNumber produced an Option<number> with value O.none;
      O.chain(toCustomerId),    // So O.chain will take every single value in the option, of which there are none, and transforms/maps the value, 
                                // and turns the double Option wrapping into just one Option
                                // But of course, there are no values in there. So it just returns/forwards on the O.none
      O.chain(getCustomer)      // The previous line produced O.none.
                                // Again, we O.chain over it, which gets each value in the option (of which there are none) and ... etc etc.
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
  const getSearchParameters = (userInput: String): Task<SearchParameters> => T.of({ keywords: userInput.split(' ') });

  const search = (searchParameters: SearchParameters): Task<SearchResult> => {
    const cannedDocuments = searchParameters.keywords.map((kw) => `${kw}.pdf`);
    return T.of({ documentName: cannedDocuments });
  };

  test('Task chain', async () => {
    const userInput: string = 'abc def';

    const searchParametersT: Task<SearchParameters> = getSearchParameters(userInput);
    const _searchResultTT: Task<Task<SearchResult>> = T.map((p: SearchParameters) => search(p))(searchParametersT);
    // So, T.map is not up to the job, because it leaves us with Task<Task<
    // But again, this is structurally the same thing we saw before.
    // So one would expect that maybe there is a Task.chain operation, that will map the value,
    // but also flatten out the Task<Task< into Task<

    const searchResultT: Task<SearchResult> = T.chain((p: SearchParameters) => search(p))(searchParametersT);

    const executedSearchResult: SearchResult = await searchResultT();

    expect(executedSearchResult).toEqual({ documentName: ['abc.pdf', 'def.pdf'] });

    // Rewritten as pipe:
    const searchResultT2: Task<SearchResult> = pipe(
      userInput,
      getSearchParameters,
      T.chain(search)
    );
    const executedSearchResult2: SearchResult = await searchResultT2();
    expect(executedSearchResult2).toEqual({ documentName: ['abc.pdf', 'def.pdf'] });
  });

  // Either

  // toNumberE is simply the Option version of toNumber, shifted into the Either version.
  // The error, of course, is a bit odd because there's only one sort of error.
  type CustomerIdError = string;
  const toNumberE = (s: string): Either<CustomerIdError, number> => E.fromOption(() => 'Not a number')(toNumber(s));

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

  test('either chain', () => {
    const stringIn = '1234';

    const asNumberE: Either<CustomerIdError,number> = toNumberE(stringIn);
    const _customerIdEE: Either<CustomerIdError, Either<CustomerIdError, CustomerId>> = E.map(toCustomerIdE)(asNumberE);

    // We are back with the double wrapper problem.
    // Also, this can make clearer why the left (Error) value is actually part of the structure.
    // CustomerId is the type we are interested in, that is wrapped in the context of Either<Error.
    // Imagine if you were to replace Either<Error,   with T<

    // Either<Error, Either<Error, CustomerId>>
    // T<            T<            CustomerId

    // So, again, we might hope that their is a Either.chain operation, that lets us map into the value
    // and undo the double wrapper/context/data structure problem. As you might imagine...

    const customerIdE: Either<CustomerIdError, CustomerId> = E.chain(toCustomerIdE)(asNumberE);

    expect(customerIdE).toEqual(E.right('customer:1234'))

    const customerId2E: Either<CustomerIdError, CustomerId> = pipe(
      '123',
      toNumberE,
      E.chain(toCustomerIdE)      // The failure happened here
    )
    expect(customerId2E).toEqual(E.left('Number out of range'))

    const customerId3E: Either<CustomerIdError, CustomerId> = pipe(
      'This is not a number',
      toNumberE,                  // This time, the failure happened here.
      E.chain(toCustomerIdE)
    )
    expect(customerId3E).toEqual(E.left('Not a number'))
  })
})
