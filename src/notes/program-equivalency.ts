
// Showing program equivalency between two programs:
// program #1: cancels an order, mutating the state of the order object.
// program #2: cancels the order, does not mutate the state of the order,
//              rather creates a new order object.

// NOTE: getOrder and saveOrder for both are clearly dummy functions,
//       massively simplified because what they do is not important to the point.
//       Compare the 'it' functions, which focus in on the code which is the business domain.


describe('program #1', () => {

  enum OrderStatus {
    OrderPlaced,
    OrderFulfilled,
    OrderCancelled
  };

  interface Order {
    orderId: string,
    status: OrderStatus
  }

  class OrderRepository {
    getOrder(orderId: string): Order {
      return {
        orderId,
        status: OrderStatus.OrderPlaced
      }
    }
    saveOrder(order: Order): void {
      return;
    }
  }

  function cancelOrder(order: Order):void {
    if (order.status !== OrderStatus.OrderFulfilled) {
      order.status = OrderStatus.OrderCancelled;
    }
  }

  it('cancelOrder mutates the order', () => {
    const orderRepository = new OrderRepository();
    const orderId: string = '123';
    const order = orderRepository.getOrder(orderId);

    // ==========================
    // State changes
    cancelOrder(order);
    // ==========================

    orderRepository.saveOrder(order);
  })
})


describe('program #2', () => {

  enum OrderStatus {
    OrderPlaced,
    OrderFulfilled,
    OrderCancelled
  };

  interface Order {
    orderId: string,
    status: OrderStatus
  }

  function getOrder(orderId: string): Order {
    return {
      orderId,
      status: OrderStatus.OrderPlaced
    };
  }

  function saveOrder(order: Order): void {
    return;
  }

  function cancelOrder(order: Order): Order | null {
    if (order.status == OrderStatus.OrderFulfilled) {
      return null;
    }
    const updatedOrder: Order = {
      orderId : order.orderId,
      status : OrderStatus.OrderCancelled
    };
    return updatedOrder;
  }


  it('cancelOrder does not mutate the order', () => {
    const orderId: string = '123';
    const order = getOrder(orderId);

    // ==========================
    // Purely functional:
    const updatedOrder = cancelOrder(order);
    // ==========================

    if (updatedOrder) {
      saveOrder(updatedOrder);
    }
  })
})