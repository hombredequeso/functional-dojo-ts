
describe('not referentially transparency', () => {

  const parseToNumber = (s: string): number => {
    const parseResult = parseInt(s);
    if (Number.isNaN(parseResult)) {
      throw 'Not a number';
    }
    return parseResult;
  }

  const createCustomer = (s: string) => {
    const customer = {
      id: parseToNumber(s)
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

    const customer = undefined;
    try {
      const customer = createCustomer(customerId);
    } catch (e) {
      const customer = null;
    }

    // now move on with customer, which could be a Customer or null.
  })

  // And what happens at a later time, if someone see the createCustomer function
  // and uses it somewhere else. Everything is ok, right up to the point where it
  // unexpectedly blows up because of parseToNumber.

  // Or, you could handle the exception in createCustomer.
  // And everything is ok. Until someone sees parseToNumber and uses that in some other
  // context, without reading the implementation code in parseToNumber 
  // (and any and every method/function that it may call that could also throw an exception)
  // to determine if it might throw any exceptions.
})