
enum OrderState {
    Submitted,
    Cancelled
}

describe('fp order', () => {
    // 14 lines
    type Order = {
        readonly id: string;
        readonly state: OrderState
    }

    const createOrder = (id: string): Order => ({
        id: id,
        state: OrderState.Submitted
    });

    const cancel = (order: Order): Order => ({
        id: order.id,
        state: OrderState.Cancelled
    })


  test('create', () => {
    const order: Order = createOrder('123');

    expect(order).toEqual({
        id: '123',
        state: OrderState.Submitted
    })
  })

  test('cancel', () => {

    const order: Order = createOrder('123');
    const cancelledOrder: Order = cancel(order);

    expect(order).toEqual({
        id: '123',
        state: OrderState.Submitted
    })
    expect(cancelledOrder).toEqual({
        id: '123',
        state: OrderState.Cancelled
    })
  })
})

describe('oo order', () => {

  // 20 lines
  class Order {
      private _id: string;
      private _state: OrderState;
  
      constructor(id: string) {
          this._id = id;
          this._state = OrderState.Submitted;
      }
  
      cancel(): void {
          this._state = OrderState.Cancelled;
      }
  
      get id():string {
          return this._id;
      }
      get state(): OrderState {
          return this._state;
      }
  }


  test('create', () => {
    const order = new Order('123');

    // How to test????
    // Need to add the accessors (get ...)

    expect(order.id).toEqual('123');
    expect(order.state).toEqual(OrderState.Submitted);
  })

  test('cancel', () => {
    const order = new Order('123');
    order.cancel();

    expect(order.id).toEqual('123');
    expect(order.state).toEqual(OrderState.Cancelled);

  })
})


describe('oo order with lines', () => {

  // 48 lines
  class OrderLine {
    private _description: string;
    private _amount: number;

    constructor(description: string, amount: number) {
        this._description = description;
        this._amount = amount;
    }

    get description(): string {
        return this._description;
    }

    get amount(): number {
        return this._amount;
    }
  }

  class Order {
      private _id: string;
      private _state: OrderState;
      private _lines: OrderLine[];
  
      constructor(id: string) {
          this._id = id;
          this._lines = [];
          this._state = OrderState.Submitted;
      }

      addLine(line: OrderLine): void {
        this._lines.push(line);
      }
  
      cancel(): void {
          this._state = OrderState.Cancelled;
      }
  
      get id():string {
          return this._id;
      }
      get state(): OrderState {
          return this._state;
      }

      get lines() {
        return this._lines;
      }
  }


  test('create', () => {
    const order = new Order('123');

    expect(order.id).toEqual('123');
    expect(order.state).toEqual(OrderState.Submitted);
    expect(order.lines).toEqual([]);
  })


  test('add line', () => {
    const order = new Order('123');
    const orderLine  = new OrderLine('line1', 100);
    order.addLine(orderLine);

    // questions.
    // 'order' has probably changed.
    // 'orderLine', has it changed?
    // The point is, we don't know, it may have.
    // In this fake trival example it is clear, but in other examples, it is less clear.

    expect(order.id).toEqual('123');
    expect(order.state).toEqual(OrderState.Submitted);
    // I'm going to test like this, but for all we know, orderLine has actually changed.
    expect(order.lines).toEqual([orderLine]);
    // Possibly we should be doing something like testing whatever line properties we are interested in.
    expect(order.lines.length).toBe(1)
    // ... etc
  })

  test('cancel', () => {
    const order = new Order('123');
    order.cancel();

    expect(order.id).toEqual('123');
    expect(order.state).toEqual(OrderState.Cancelled);
    expect(order.lines).toEqual([]);
  })

  // The only point to this is to show how it turns out to be quite difficult to actually
  // prevent object state mutation via surruptious means.
  // Arguably, the lines() accessor only exists for testing purposes. 
  test('do not do this to the lines', () => {
    const order = new Order('123');
    const orderLine  = new OrderLine('line1', 100);
    order.addLine(orderLine);
    const lines = order.lines;
    lines.pop();

    // Arguably problematic because allows for making changes
    // to the lines outside the class.
    expect(order.lines).toEqual([]);

  })
})

describe('fp order with lines', () => {
    // 27 lines
    type OrderLine = {
        readonly description: string,
        readonly amount: number
    }
    type Order = {
        readonly id: string;
        readonly state: OrderState
        readonly lines: ReadonlyArray<OrderLine>
    }

    const createOrder = (id: string): Order => ({
        id: id,
        state: OrderState.Submitted,
        lines: []
    });

    const cancel = (order: Order): Order => ({
        id: order.id,
        state: OrderState.Cancelled,
        lines: order.lines
    })

    const addLine = (order: Order, line: OrderLine): Order => ({
        id: order.id,
        state: order.state,
        lines: [...order.lines, line]
    })

  test('create', () => {
    const order: Order = createOrder('123');

    expect(order).toEqual({
        id: '123',
        state: OrderState.Submitted,
        lines: []
    })
  })

  test('cancel', () => {

    const order: Order = createOrder('123');
    const cancelledOrder: Order = cancel(order);

    expect(cancelledOrder).toEqual({
        id: '123',
        state: OrderState.Cancelled,
        lines: []
    })
  })

  test('add line', () => {
    const order: Order = createOrder('123');
    const newLine: OrderLine = {
        description: 'line 1',
        amount: 100
    };
    const updatedOrder = addLine(order, newLine);

    // None of order, newLine, or updatedOrder have changed.

    expect(updatedOrder).toEqual({
        id: '123',
        state: OrderState.Submitted,
        lines: [newLine]
    })
  })
})

// Now we add logic: you can't add a line to a cancelled order
// Let's assume we want to explicitly know when adding a line fails.

describe('oo order with lines and logic', () => {

  // 48 lines
  class OrderLine {
    private _description: string;
    private _amount: number;

    constructor(description: string, amount: number) {
        this._description = description;
        this._amount = amount;
    }

    get description(): string {
        return this._description;
    }

    get amount(): number {
        return this._amount;
    }
  }

  class Order {
      private _id: string;
      private _state: OrderState;
      private _lines: OrderLine[];
  
      constructor(id: string) {
          this._id = id;
          this._lines = [];
          this._state = OrderState.Submitted;
      }

      addLine(line: OrderLine): void {
        if (this._state === OrderState.Cancelled) {
            throw new Error('Cannot add line, order is cancelled');
        }
        this._lines.push(line);
      }
  
      cancel(): void {
          this._state = OrderState.Cancelled;
      }
  
      get id():string {
          return this._id;
      }
      get state(): OrderState {
          return this._state;
      }

      get lines() {
        return this._lines;
      }
  }


  test('add line', () => {
    const order = new Order('123');
    order.cancel();
    const orderLine  = new OrderLine('line1', 100);

    // Aside from having to manage a secondary flow of control for errors (via exception handling)
    // a separate side problem might be the time involved in processing exceptions.
    // e.g. oo version regularly takes around 20ms to run, fp version <1ms
    expect(() => order.addLine(orderLine)).toThrow('Cannot add line, order is cancelled')
  })
})

describe('flow of control issues with exceptions', () => {

    const doSomething = (s: string): number => {
        const x:number = Number.parseInt(s);
        if (Number.isNaN(x)) {
            throw new Error(`${s} is not a number`)
        }
        return x;
    }

    const nextLevelUp = (s: string): number => {
        try {
            const result = doSomething(s)
            return result;
        } catch (e) {
            return 0;
        }
    }

    // What happens when someone sees doSomething and decides to use it
    //  on the basis that it is string -> number, but doesn't read the function
    //  and see that the result of the function is actually either a number or throwing an exception?
    // This is a trivial example, but when you get longer functions, and more layers, it
    // means you potentially end up having to read through methods you use, and the methods they use
    // and... etc.
    // The problem is there there are actually 2 control flows: success (using method return values),
    // and failure (using exceptions)
})


describe('fp order with lines and errors', () => {
    // 25 lines
    type OrderLine = {
        readonly description: string,
        readonly amount: number
    }
    type Order = {
        readonly id: string;
        readonly state: OrderState
        readonly lines: OrderLine[]
    }

    const createOrder = (id: string): Order => ({
        id: id,
        state: OrderState.Submitted,
        lines: []
    });

    const cancel = (order: Order): Order => ({
        id: order.id,
        state: OrderState.Cancelled,
        lines: order.lines
    })

    enum AddLineError {
        OrderCancelled
    }

    const addLine = (order: Order, line: OrderLine): Order | AddLineError  => {
        return order.state === OrderState.Cancelled ?
            AddLineError.OrderCancelled :
        {
            id: order.id,
            state: order.state,
            lines: [...order.lines, line]
        }
    }

  test('add line to cancelled', () => {
    const order: Order = createOrder('123');
    const cancelledOrder = cancel(order);
    const newLine: OrderLine = {
        description: 'line 1',
        amount: 100
    };
    const updatedOrderOrError: Order | AddLineError = addLine(cancelledOrder, newLine);

    expect(updatedOrderOrError).toEqual(AddLineError.OrderCancelled);
  })
})

// Modular/procedural/... (pre-oo / post-oo)


describe('fp order with lines and errors', () => {
    // 27 lines
    interface OrderLine  {
        description: string,
        amount: number
    }
    interface Order {
        id: string;
        state: OrderState
        lines: OrderLine[]
    }

    const createOrder = (id: string): Order => ({
        id: id,
        state: OrderState.Submitted,
        lines: []
    });


    const cancel = (order: Order) => {
        order.state = OrderState.Cancelled;
    }

    const addLine = (order: Order, line: OrderLine): void => {
        if (order.state === OrderState.Cancelled) {
            throw new Error('')
        }
        order.lines.push(line);
    }
  test('add line to cancelled', () => {
    const order: Order = createOrder('123');
    const newLine: OrderLine = {
        description: 'line 1',
        amount: 100
    };
    addLine(order, newLine);

    // Gets some of the benefits of succinctness from fp code.
    // But not referentially transparent.
  })
})



describe('ref trans generalized example', () => {
    interface A  {
        state: string
    }
    interface B {
        a: A,
        state: string
    }
    interface C {
        b: B,
        state: string
    }

    const doStuff = (a: A) => {
        // this could only alter A
        return;
    };

    const funkify = (c: C) => {
        // C has a reference to B, which has a reference to A. Any of them could be altered.
        return;
    }


  test('funkify', () => {
    const a: A = {state: 'a state'};
    doStuff(a);
    const b: B = {a: a, state: 'b state'};
    const c: C = {b: b, state: 'c state'};

    funkify(c);

    // So what has changed?
    // 
    // doStuff(a); - probably altered a's state.
    // funkify(c); - possibly any combination of a,b,c. (the entire state of our program - may we well use globals)
    //                  Also, changes to one may be influenced by the state of any of the others.
  })

  test('funkify #2', () => {
    // Would this do the same thing???
    const a: A = {state: 'a state'};
    const b2: B = {a: a, state: 'b state'};
    const c: C = {b: b2, state: 'c state'};

    funkify(c);
    doStuff(a);

    // The problem is that inter-object references can start to behave
    // in  the same way as global state, namely that changes to one object can
    // result in changes to any other objects (recursively) that the first object
    // refers to, and that changes are also affected by the state of any objects
    // that can be reached.
  })
})
