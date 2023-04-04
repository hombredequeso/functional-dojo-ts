import { Reader } from 'fp-ts/lib/Reader';
import * as R from 'fp-ts/lib/Reader';


import { Task } from 'fp-ts/lib/Task';
import * as T from 'fp-ts/lib/Task';

import * as RT from 'fp-ts/lib/ReaderTask'

import { pipe } from 'fp-ts/lib/function';

type CustomerId = string;

type Customer = {
  id: CustomerId,
  name: string
}

type Invoice =  {
  id: CustomerId,
  message: string,
  amount: number
}

describe('reader', () => {

  const getCustomer = (id: CustomerId): Task<Customer> => 
    T.of({id, name: `customer ${id}`})
  
  const invoiceCustomer = (invoice: Invoice): Task<Invoice> => T.of(invoice);

  const createInvoiceMessage = (amount: number) => (customer: Customer): Invoice => ({
    id: customer.id,
    message: `Hello ${customer.name}, you have been invoiced for ${amount}`,
    amount: amount
  });

  const invoiceCustomerPipeline = (id: CustomerId, amount: number): Task<Invoice> => 
    pipe(
      getCustomer(id),
      T.map(createInvoiceMessage(amount)),
      T.chain(invoiceCustomer)
    );

  test('domain logic only', async () => {
    const invoice: Invoice = await invoiceCustomerPipeline('123', 456)();

    expect(invoice).toEqual({
        amount: 456,
       id: "123",
       message: "Hello customer 123, you have been invoiced for 456",
    });
  })


  const getCustomer2 = (baseUrl: string) => (id: CustomerId) : Task<Customer> => 
    T.of({id, name: `customer ${id}`})

  const invoiceCustomer2 = (baseUrl: string) => (invoice: Invoice):Task<Invoice> => T.of(invoice);

  type Config = {
    customerapiBaseUrl: string,
    invoiceApiBaseUrl: string,
    locale: string
  }

  const invoiceCustomerPipeline2 = (id: CustomerId, amount: number, config: Config): Task<Invoice> => 
    pipe(
      getCustomer2(config.customerapiBaseUrl)(id),
      T.map(createInvoiceMessage(amount)),
      T.chain(invoiceCustomer2(config.invoiceApiBaseUrl))
    );


    // That's one way to do it. But we can do it another way...


  const getCustomer3 =  (id: CustomerId) : Reader<Config, Task<Customer>> => 
    RT.of({id, name: `customer ${id}`})

  const invoiceCustomer3 = (invoice: Invoice):Reader<Config, Task<Invoice>> => RT.of(invoice);


  const invoiceCustomerPipeline3 = (id: CustomerId, amount: number, config: Config): Reader<Config, Task<Invoice>> => 
    pipe(
      getCustomer3(id),
      RT.map(createInvoiceMessage(amount)),
      RT.chain(invoiceCustomer3)
    );

    // Now compare:
    // invoiceCustomerPipeline vs invoiceCustomerPipeline3
    // invoiceCustomerPipeline2 vs invoiceCustomerPipeline3
    //
    // invoiceCustomerPipeline2 has a whole of of configuration manipulation in the business domain pipeline.
    // But in invoiceCustomerPipeline3 that has been pushed into Reader, oddly, part of the RETURN type.
    // 

    // FYI: so an actual implementation of getCustomer3 might look like:
    // which lets us use the (config.customerapiBaseUrl) when we go to execute the Task part

  const getCustomer3b =  (id: CustomerId) : Reader<Config, Task<Customer>> => 
    (config: Config) => T.of({id, name: `customer ${id}`})

  // Pretend we wanted to now use the locale to generate different invoice messages.
  // Building on the Reader< concept we _could_ ...


  const createInvoiceMessageRT = (amount: number) => (customer: Customer): Reader<Config, Task<Invoice>> => (config: Config) => (T.of({
    id: customer.id,
    message: `Hello ${customer.name}, you have been invoiced for ${amount}, but in the language of ${config.locale}`,
    amount: amount
  }));

  const invoiceCustomerPipeline4 = (id: CustomerId, amount: number, config: Config): Reader<Config, Task<Invoice>> => 
    pipe(
      getCustomer3(id),
      RT.chain(createInvoiceMessageRT(amount)),
      RT.chain(invoiceCustomer3)
    );

  // Reader is analogically, dependency injection for functional programming.
})