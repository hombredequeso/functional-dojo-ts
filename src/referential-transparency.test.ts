

type Customer = {
  id: number,
  orderCount: number
}
type Order = {
  id: string
}

describe('not referentially transparency', () => {

  const createCustomer = (customerId: number): Customer => {
    return {
      id: customerId,
      orderCount: 0
    };
  }

  const createOrder = (customer: Customer): Order => {
    const orderId = customer.orderCount + 1;
    const order = {
      id: `customer:${customer.id}.${orderId}`
    }
    customer.orderCount = orderId;
    return order;
  }

  const getCustomerStatistics = (customer: Customer): string => {
    return `customer number ${customer.id} has placed ${customer.orderCount} orders`;
  }


  test('Reasoning about sequences of statements', () => {
    const customer: Customer = createCustomer(123)
    const order: Order = createOrder(customer);

    expect(order).toStrictEqual({id: 'customer:123.1'});

    // Without looking at the createOrder function, identify what has changed in customer and order
    // at different points in the program.
    // The problem: who knows? You can't easily reason about the state of the system, without looking
    // at what every single function does.
  })


  test('so now I add this to the program', () => {
    const customer: Customer = createCustomer(123)
    const customerStats = getCustomerStatistics(customer);
    const order: Order = createOrder(customer);

    expect(order).toStrictEqual({id: 'customer:123.1'});


    // Note the mental gymastics at this point in reading the program.
    // We know that there is 1 order, but it says '0 orders'.
    // So we look back and see that it is because of where getCustomerStatistics 
    //   was called in the sequence of statements

    expect(customerStats).toStrictEqual('customer number 123 has placed 0 orders');
  })


  test('but can I do this??', () => {
    const customer: Customer = createCustomer(123)
    
    const order: Order = createOrder(customer);

    // switch the order of the statements:
    // surely I can do this, because getCustomerStatistics only depends on the customer...
    // and hopefully createOrder does what it says, and JUST creates a new order...
    const customerStats = getCustomerStatistics(customer);

    expect(order).toStrictEqual({id: 'customer:123.1'});

    // But no, it doesn't, because customerStats has now changed.
    // (notice the 'not' added to the expectation)
    expect(customerStats).not.toStrictEqual('customer number 123 has placed 0 orders');
    expect(customerStats).toStrictEqual('customer number 123 has placed 1 orders');
  })

  // The problem is that it is not possible to reason about the program simply by reading it.
  // Any data could be changed at any time.
  // And the problem, of course, is very simplified here. If the customer entity had links to anything
  // else, that too could have changed.
})




describe('is referentially transparent: Immutability edition', () => {

  const createCustomer = (customerId: number): Customer => {
    return {
      id: customerId,
      orderCount: 0
    };
  }

  const getNextCustomerOrderId = (customer: Customer): [string, Customer] => {
    const nextCustomerOrderId = customer.orderCount + 1;
    const orderId = `customer:${customer.id}.${nextCustomerOrderId}`
    const updatedCustomer: Customer = {
      id: customer.id,
      orderCount: nextCustomerOrderId
    }
    return [orderId, updatedCustomer];
  }

  const createOrder = (orderId: string): Order => {
    const order = {
      id: orderId
    }
    return order;
  }

  const getCustomerStatistics = (customer: Customer): string => {
    return `customer number ${customer.id} has placed ${customer.orderCount} orders`;
  }

  test('Reasoning about sequences of statements', () => {
    const customer: Customer = createCustomer(123)
    const customerStatsBeforeNewOrder: string = getCustomerStatistics(customer);
    const [customerOrderId, updatedCustomer]: [string, Customer] = 
      getNextCustomerOrderId(customer);
    const order: Order = createOrder(customerOrderId);
    const customerStatsAfterNewOrder: string = getCustomerStatistics(updatedCustomer);

    expect(order).toStrictEqual({id: 'customer:123.1'});
    expect(customerStatsBeforeNewOrder).toStrictEqual('customer number 123 has placed 0 orders');
    expect(customerStatsAfterNewOrder).toStrictEqual('customer number 123 has placed 1 orders');
  })

  test('so as long as an entity exists, I can switch the order of statements around', () => {
    const customer: Customer = createCustomer(123)
    const [customerOrderId, updatedCustomer]: [string, Customer] = getNextCustomerOrderId(customer);
    const order: Order = createOrder(customerOrderId);

    expect(order).toStrictEqual({id: 'customer:123.1'});

    const customerStatsAfterNewOrder = getCustomerStatistics(updatedCustomer);
    const customerStatsBeforeNewOrder = getCustomerStatistics(customer);

    expect(customerStatsBeforeNewOrder).toStrictEqual('customer number 123 has placed 0 orders');
    expect(customerStatsAfterNewOrder).toStrictEqual('customer number 123 has placed 1 orders');
  })

  // A couple of observations:
  // * so long as an entity exists (i.e. the code compiles) the order of statements can be switched around
  // * what, if anything could be considered the 'business logic' here, namely that revolving around
  //   the incrementing number which controls the order numbers, is now effectively squeezed out of
  //   it's hidden place inside a method which mutates state, and into the open.
  // * the coding changes to the business logic didn't happen 'automatically', it required
  //   some sort of intelligent refactoring, and notably, this could have been done in different ways.
  //   But the point is that the requirement of immutability forced us into rethinking what was going on.
  // * that business logic is now explictly apparent in the addition of the getNextCustomerOrderId.
  // * createOrder is now severed from the tyranny of a dependency on the entire 'Customer' entity,
  //   and reduced to it's simplest possible dependencies, a string for the id.

})
