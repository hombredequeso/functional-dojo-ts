import express from "express"


import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import { Option } from 'fp-ts/lib/Option';
import * as O from 'fp-ts/lib/Option';

import { Either } from 'fp-ts/lib/Either';
import * as E from 'fp-ts/lib/Either';

import * as TE from 'fp-ts/TaskEither';
import type { TaskEither } from 'fp-ts/lib/TaskEither';
import { pipe } from 'fp-ts/lib/function';
import { ord } from "fp-ts";

const app: express.Application = express();
app.use(express.json());


const infoEndpoint = (req: express.Request, res: express.Response): void => {
  res.send({
    app: 'functional dojo test app'
  })
}

type OrderStatus = 'OPEN' | 'CANCELLED' | 'COMPLETED';

type Order = {
  id: string,
  description: string,
  updates: string[],
  status: OrderStatus
};

// axios world
const orders: Map<string, Order> = new Map<string,Order>([
  ["123", {id: "123", description: "order123", updates: [], status: 'OPEN'}]
]);

const dummyDbGetOrder = (id: string): Promise<Order> => {
  const order = orders.get(id);
  if (order) {
    return Promise.resolve(order);
  }
  return Promise.reject('does not exist');
}

// Functional domain world

// Get the axios http request into the functional world, as TaskEither<Error, Order>
const httpGet = (id:string): TaskEither<Error, Order> => TE.tryCatch<Error, Order>(
  () => dummyDbGetOrder(id),
  reason => new Error(String(reason))
)

const getOrder = (id: string): Task<Option<Order>> => {
  const httpGetResult = httpGet(id);
  const b = T.map(O.fromEither)(httpGetResult);
  return b;
}

// Cancel order:

type OrderDoesNotExist = {id: string, _type: 'order-does-not-exist'}
const orderDoesNotExist = (id: string): OrderDoesNotExist => ({id, _type: 'order-does-not-exist'});

type InvalidOrderState = {order: Order, _type: 'invalid-order-state'}
const invalidOrderState = (order: Order): InvalidOrderState => ({order, _type: 'invalid-order-state'});


// Domain
type CancelOrderError = OrderDoesNotExist | InvalidOrderState;

const cancelOrderDomain = (order: Order): Either<CancelOrderError, Order> => {
  return order.status === 'OPEN' ?
  E.right({ ...order, status: 'CANCELLED'}):
  E.left(invalidOrderState(order));
};

// Lift
const cancelOrderDomainTE = (order: Order): TaskEither<CancelOrderError, Order> => TE.fromEither(cancelOrderDomain(order))

// Pipeline
const cancelOrderTE = (id: string): TaskEither<CancelOrderError, Order> => {
  return pipe(
    id,
    getOrder,
    TE.fromTaskOption<CancelOrderError>(() => orderDoesNotExist(id)),
    TE.chain(cancelOrderDomainTE)
  );
}

// Update order: 

// Domain
type UpdateOrderError = OrderDoesNotExist | InvalidOrderState;
const updateOrderDomain = (order: Order, update: string): Either<UpdateOrderError, Order> => {
  return order.status === 'OPEN' ?
  E.right({ ...order, updates: order.updates.concat(update)}):
  E.left(invalidOrderState(order));
}

// Lift
const updateOrderDomainTE = (update: string) => (order: Order): TaskEither<UpdateOrderError, Order> => TE.fromEither(updateOrderDomain(order, update))

// Pipeline
const updateOrderTE = (id: string, update: string): TaskEither<UpdateOrderError, Order> => {
  return pipe(
    id,
    getOrder,
    TE.fromTaskOption<UpdateOrderError>(() => orderDoesNotExist(id)),
    TE.chain(updateOrderDomainTE(update))
  );
}

// HTTP world

const getOrderEndpoint = async (req: express.Request, res: express.Response): Promise<void> => {
  const orderId: string = req.params.orderId;

  const order: Task<Option<Order>> = getOrder(orderId)

  const executedResult: Option<Order> = await order();
  O.match(
    () => {res.statusCode = 404;  return res.send(); },
    (order) => res.json(order)
  )(executedResult);

  return;
}

const getCancelHttpStatusCode = (error: CancelOrderError): number => {
  switch(error._type){
    case "order-does-not-exist": return 404;
    case "invalid-order-state": return 309;
  }
}

const getUpdateErrorHttpStatusCode = (error: UpdateOrderError): number => {
  switch(error._type){
    case "order-does-not-exist": return 404;
    case "invalid-order-state": return 309;
  }
}

const cancelOrderEndpoint = async (req: express.Request, res: express.Response): Promise<void> => {
  const orderId: string = req.params.orderId;

  const cancelledOrder: Task<Either<CancelOrderError, Order>> = cancelOrderTE(orderId);

  const executedResult: Either<CancelOrderError, Order> = await cancelledOrder();
  E.match(
    (error: CancelOrderError) => {res.statusCode = getCancelHttpStatusCode(error);  return res.send(); },
    (order) => res.json(order)
  )(executedResult);

  return;
}


const updateOrderEndpoint = async (req: express.Request, res: express.Response): Promise<void> => {
  const orderId: string = req.params.orderId;
  const update: string = req.body.toString();

  const updatedOrder: Task<Either<UpdateOrderError, Order>> = updateOrderTE(orderId, update);

  const executedResult: Either<UpdateOrderError, Order> = await updatedOrder();
  E.match(
    (error: UpdateOrderError) => {res.statusCode = getUpdateErrorHttpStatusCode(error);  return res.send(); },
    (order) => res.json(order)
  )(executedResult);

  return;
}

app.get('/info', infoEndpoint);
app.get("/order/:orderId", getOrderEndpoint)
app.post("/order/:orderId/cancel", cancelOrderEndpoint);
app.post("/order/:orderId/update", updateOrderEndpoint)

const port = 8080
app.listen(port, () => {
  console.log(`app running on localhost:${port}`);
})
