
describe('to except or not to except', () => {

  const parseToNumberE = (s: string): number => {
    const parseResult = parseInt(s);
    if (Number.isNaN(parseResult)) {
      throw 'Not a number';
    }
    return parseResult;
  }


  const parseToNumberOrNull = (s: string): number|null => {
    const parseResult = parseInt(s);
    if (Number.isNaN(parseResult)) {
      return null;
    }
    return parseResult;
  }

  type Customer = {
    id: number
  }

  const createCustomer = (s: string): Customer => {
    const customer = {
      id: parseToNumberE(s)
    }
    return customer;
  }

  test('create a customer', () => {
    const customerId = '123';

    const customer123 = createCustomer(customerId);
    expect(customer123).toStrictEqual({id: 123});

    // What about:

    const invalidCustomerId = 'abc';
    try {
      const customerAbc = createCustomer(invalidCustomerId);
    } catch (e) {
      expect(e).toStrictEqual('Not a number')
    }
  })

  // So, the point in the code where a customer is created is likely to look like this:

  test('pretend this is the production code', () => {
    // The customerId actually comes in from somewhere else, say an http request
    const customerId = '123';

    let successfullyCreatedCustomer = false;
    let customer = undefined;
    try {
      customer = createCustomer(customerId);
      successfullyCreatedCustomer = true;
    } catch (e) {
      successfullyCreatedCustomer = false;
    }

    // Instead of expectation, production code might be doing something like
    // setting http status code.
    expect(successfullyCreatedCustomer).toStrictEqual(true)
  })

  // And what happens at a later time, if someone sees the createCustomer function
  // and uses it somewhere else. 
  // If they use it on the basis of it's signature, it says:
  //    const createCustomer = (s: string): Customer => {
  // so (unless they read the entire function, and every function called by that function, 
  // and every function called by those functions, and ...) 
  // it is likely they will use it as the signature advertises.
  // Everything will be ok, until it runs with a non-numeric (s: string) value, and then
  // an exception will happen - maybe unexpectedly in production.

  // How do you know 
  //    const createCustomer = (s: string): Customer => {
  // throws an exception? You have to read the function, and every function that function calls
  // and see if any of them throw exceptions.
  // (or you can start writing comments in the code warning everyone that is what it does!)

  // Alternatively (as one possible option).

  // In real code this allows for different errors conditions to be surfaced.
  type CreateCustomerError = 'Invalid-Customer-id';

  const createCustomer2 = (s: string): Customer | CreateCustomerError => {
    const id = parseToNumberOrNull(s);
    return (id !== null) ? {id} : 'Invalid-Customer-id'
  }

  // Now, it is impossible to use createCustomer2 without taking into account that it could result in errors,
  // because the type system tells you as much.
  // The signature of the function declares all possible outcomes.
  // Exceptions, if they were to occur, are restricted to truly exceptional conditions: e.g. OutOfMemory.
  // Taking a string, parsing it, and discovering it isn't a number is not exceptional, 
  // it is a perfectly normal, expected outcome.
  
})