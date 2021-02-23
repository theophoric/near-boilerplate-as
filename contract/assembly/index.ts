/*
 * This is an example of an AssemblyScript smart contract with two simple,
 * symmetric functions:
 *
 * 1. setGreeting: accepts a greeting, such as "howdy", and records it for the
 *    user (account_id) who sent the request
 * 2. getGreeting: accepts an account_id and returns the greeting saved for it,
 *    defaulting to "Hello"
 *
 * Learn more about writing NEAR smart contracts with AssemblyScript:
 * https://docs.near.org/docs/roles/developer/contracts/assemblyscript
 *
 */

import { context, logging, persist, storage } from 'near-sdk-as'

const DEFAULT_GREETING = 'Hello';

type AccountId = string;

// A single top-level @nearBindgen class can be exported to define the contract state and interface.  this decorator provides persistence and serialization for the class.
// NOTE :: currently class inheritance is not supported
// e.g. the following would not work:
// export class GreeterContract extends BaseContract { ... }
@nearBindgen
export class GreeterContract {

  private account_greetings: Map<AccountId, string> = new Map<AccountId, string>();
  private isInit: bool = false;
  
  // constructor will be exported as "new"
  // the state of the contract will be automatically persisted after constructor is invoked (without @mutateState decorator)
  constructor(public default_greeting: string = DEFAULT_GREETING) {
    this.isInit = true;
  }

  // methods are public by default
  getGreeting(accountId: AccountId): string {
    this.assertInit();
    if (this.account_greetings.has(accountId)) {
      return this.account_greetings.get(accountId);
    } else {
      return  this.default_greeting;
    }
  }

  // the @mutateState() decorator will persist the contract state at the end of the method's execution.  It will _only_ do this when invoked externally via function call (I think -- todo: confirm -T)
  @mutateState()
  setGreeting(message: string): void {
    this.assertInit();
    const account_id = context.sender;
    logging.log(
      // String interpolation (`like ${this}`) is a work in progress:
      // https://github.com/AssemblyScript/assemblyscript/pull/1115
      'Saving greeting "' + message + '" for account "' + account_id + '"'
    )
    this.account_greetings.set(account_id, message);
  }

  // can explicitly define methods as public
  public changeDefault(message: string): void {
    this.assertInit();
    this.internalChangeDefault(message);
  }

  // "private" key word protects internal functions
  @mutateState()
  private internalChangeDefault(message: string): void {
    this.default_greeting = message;
    // in methods not decorated with @mutateState(), "persist(this)" can be used to trigger contract state persistence 
    // persist(this);
  }

  private assertInit(): void {
    assert((this.isInit), "Contract must be initialized with 'new' method before this function can be called");
  }


  // NOTE :: property getters / setters are currently NOT ALLOWED
  // private _some_var: string;
  // get some_var(): string { 
  //   return this._some_var;
  // }
  // set some_var(value: string) {
  //   this._some_var = value;
  //   persist(this);
  // }
}

// Addional methods can be exported
export function ping(): string {
  // use storage module to persist data outside of main contract class
  let counter = storage.getPrimitive<u16>("counter", 0) ;
  counter ++; 
  storage.set<u16>("counter", counter);
  return "pong: " + counter.toString();
}

// NOTE :: Not allowed to export functions that share a name with contract methods
// export function getGreeting(accountId: AccountId): string {
//   return "Hello"
// }
