import * as A from 'fp-ts/lib/Array'
import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';


import { IO } from 'fp-ts/lib/IO';
import * as Io from 'fp-ts/lib/IO';


import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import * as ROA from 'fp-ts/ReadonlyArray'
import * as Str from 'fp-ts/lib/string'

import {TaskEither} from 'fp-ts/lib/TaskEither'
import * as TE from 'fp-ts/lib/TaskEither'

import { pipe, flow } from 'fp-ts/lib/function';

const todo: any = (s: string) => {
  throw 'todo ' + s;
}

const wordToDigit = new Map<string, number>([
  ['zero', 0],
  ['one', 1],
  ['two', 2],
  ['three', 3],
  ['four', 4],
  ['five', 5],
  ['six', 6],
  ['seven', 7],
  ['eight', 8],
  ['nine', 9],
]);

const nonLettersRegex = /[^a-zA-Z]/g;
const splitOnSpace = (s: string): string[] => s.split(' ');
const getDigit = (s: string): Option<number> => O.fromNullable(wordToDigit.get(s))

// Misc definitions and data used elsewhere:
type Invoice = {
  description: string,
  total: number
}
type CustomerId = string;

const customerInvoices: Map<string, Invoice[]> = new Map([
  ['customer1', [{description: 'invoice1', total: 1},{description: 'invoice1', total: 2}]],
  ['customer2', [{description: 'invoice3', total: 3}]],
  ['customer3', [{description: 'invoice4', total: 4},{description: 'invoice5', total: 5}]],
])


describe('array flatmap, fp-ts edition - i.e. chain = flatMap', () => {
  

  test('1. array chain', () => {

    const getInvoices = (customerId: string): Invoice[] => customerInvoices.get(customerId) || [];

    // Use the function above to go from the customerId's to an array of all the invoices, from all the customers, in one array.
    // This array of invoices will then be used to calculate the total for the customer's invoices.
    const customerIds: CustomerId[] = ['customer2', 'customer3', 'customer4'];
    const allInvoices: Invoice[] = todo('#1')

    const allCustomerTotal: number = pipe(
      allInvoices,
      A.reduce(0, (total, invoice) => total + invoice.total)
    )

    expect(allCustomerTotal).toEqual(12);
  })


  test('2. array chain', () => {

    const lines: string[] = [
      "Line number one",
      "two is better than one",
      "Pythagoras considered three the perfect number",
      "four and five begin with f",
      "six, seven, eight, nine",
      "zero, Or should this be on line one ?"
    ];

    const replaceNonLettersWith = 
      (replacement: string) => 
        (s: string): string => 
          s.replace(nonLettersRegex, replacement);

    const getDigits = (s: string): number[] => 
      pipe(s, splitOnSpace, A.map(getDigit), A.compact)

    // Use the functions immediately above to get from the lines 
    // to an array with the number of digits in each word on all the lines

    // start with the lines and get the number of characters in each word
    const digits: number[] = todo('#2');

    expect (digits).toEqual([1,2,1,3,4,5,6,7,8,9,0,1]);
  })

})

type Email = string;
type PhoneNumber = string;

type ContactDetails = {
  email: Option<Email>,
  phone: Option<PhoneNumber>
}
type Customer = {
  name: string,
  contactDetails: Option<ContactDetails>,
  rating: number
}

const customerDetails: Map<CustomerId, Customer> = new Map<CustomerId, Customer>([
  [
    'customer1',
    {
      name: 'customer1Name',
      contactDetails: O.some({
        email: O.some('customer1@gmail.com'),
        phone: O.none
      }),
      rating: 1
    }
  ],
  [
    'customer2',
    {
      name: 'customer2Name',
      contactDetails: O.some({
        email: O.none,
        phone: O.none
      }),
      rating: 2
    }
  ],
  [
    'customer3',
    {
      name: 'customer3Name',
      contactDetails: O.none,
      rating: 3
    }
  ],
  [
    'customer99',
    {
      name: 'customer99Name',
      contactDetails: O.none,
      rating: -1
    }
  ]
]);

describe('Option Chain', () => {


  test('3. Option Chain, using flow', () => {

    const getCustomer = (customerId: CustomerId): Option<Customer> => O.fromNullable(customerDetails.get(customerId))

    // Construct a function that goes:
    // CustomerId => Customer => ContactDetails => email (string)
    // i.e. it will be very similar to a pipe, but the customerId will need to be provided to invoke the function created using flow.
    const getCustomerEmail : (customerId: CustomerId)=> Option<Email> = todo('#3')

    expect(getCustomerEmail('customer1')).toEqual(O.some('customer1@gmail.com'));
    expect(getCustomerEmail('customer2')).toEqual(O.none);
    expect(getCustomerEmail('customer3')).toEqual(O.none);
    expect(getCustomerEmail('customer4')).toEqual(O.none);
  })

})

type Bonus = {
  discountPercent: number
}

describe('Task Chain', () => {
  const dummyHash = (s: string):number => pipe( 
      s.split(''),
      A.reduce(0, (code, char) => (code + char.charCodeAt(0))%100)
    );

  // Task
  // customers always exist (not in real-life though) :-)
  const getCustomerT = (customerId: CustomerId): Task<Customer> => {
    return T.of({
        name: customerId,
        contactDetails: O.none,
        rating: dummyHash(customerId)
    })
  }

  const getBonuses = (rating: number): Task<Bonus> => {
    if (rating < 30) return T.of({discountPercent: 0})
    if (rating < 60) return T.of({discountPercent: 5})
    if (rating < 90) return T.of({discountPercent: 10})
    return T.of({discountPercent: 15})
  }

  test('4. Task chain', async () => {
    // Using the functions immediately above, get the discountPercentage starting from a customerId (where the customer is guaranteed to exist)

    const customerId = 'xyz';
    const discountPercent: Task<number> = todo('#4')

    expect(await discountPercent()).toEqual(10);
  })
})

type Error = string

describe('Either Chain', () => {

  const toNumberE = (s: string): Either<Error, number> => {
    if (s.length === 0)
      return E.left("Error: Empty string");
    const parseResult = parseInt(s);
    const validNumber: boolean = !Number.isNaN(parseResult) && (parseResult.toString() == s);
    return validNumber? E.right(parseResult): E.left(`Error: ${s} is not a number`);
  }

  const toCustomerId = (n: number): Either<Error, string> =>
    pipe(
      n,
      E.fromPredicate(() => n > 0 && n<Number.MAX_SAFE_INTEGER, () => `Invalid number for id: ${n}`),
      E.map((n) => `customer${n}`)
    );

  const getCustomerE = (customerId: CustomerId): Either<Error, Customer> => 
      E.fromNullableK('customer does not exist')((custId: string) => customerDetails.get(custId))(customerId);


  test('5. Either chain', async () => {
    // Based on some userInput that represents the numeric part of a customerId, get the customer.
    // the main sequence is: string -> number -> CustomerId -> Customer
    // ... but with errors along the way.

    const userInput = '2';
    const customer: Either<Error, Customer> = todo('#5')

    expect(customer).toEqual(E.right(
      {
        name: 'customer2Name',
        contactDetails: O.some({
          email: O.none,
          phone: O.none
        }),
        rating: 2
      })
    );

  })


  test('6. Either chain with flow', async () => {
    // Slightly alter the previous test to construct a 'program'
    // that can be used over and over again.

    const getCustomer: (s: string)=>Either<Error, Customer> = todo('#6');

    expect(getCustomer('hello world')).toEqual(E.left('Error: hello world is not a number'));
    expect(getCustomer('-9')).toEqual(E.left('Invalid number for id: -9'));
    expect(getCustomer('4')).toEqual(E.left('customer does not exist'));

    // Consider how each of these fails at a different point in the sequence that makes up getCustomer.
    // It can be thought of as a fast fail sequence of functions, where as soon as it hits an error condition,
    // it keeps propogating the error forward and does not further calculations.
  })
})

describe('TaskEither Chain', () => {

  const getCustomerTE = (customerId: CustomerId): TaskEither<Error, Customer> => 
      TE.fromNullableK('customer does not exist')((custId: string) => customerDetails.get(custId))(customerId);

  const getBonusesTE = (rating: number): TaskEither<Error, Bonus> => {
    if (rating < 0) return TE.left(`Invalid rating ${rating}`);
    if (rating < 30) return TE.of({discountPercent: 0})
    if (rating < 60) return TE.of({discountPercent: 5})
    if (rating < 90) return TE.of({discountPercent: 10})
    return TE.of({discountPercent: 15})
  }

  test('7. TaskEither chain', async () => {
    // Use the above functions to calculate the customerBonus starting from the customerId

    const customerId: CustomerId = 'customer1';
    const customerBonus: TaskEither<Error, Bonus> = todo('#7')

    const executedCustomerBonusProgram = await customerBonus();

    expect(executedCustomerBonusProgram).toEqual(E.right({discountPercent: 0}));


    const customer99Id: CustomerId = 'customer99';
    const customerBonus99: TaskEither<Error, Bonus> = todo('#7, same thing');

    const executedCustomerBonusProgram99 = await customerBonus99();

    expect(executedCustomerBonusProgram99).toEqual(E.left('Invalid rating -1'));
  })

})