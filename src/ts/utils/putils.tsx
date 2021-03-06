import Kefir, { Observable } from 'kefir';
import {
  and,
  curry,
  fromPairs,
  isEmpty,
  isNil,
  map,
  propEq,
  reduce,
} from 'ramda'; // Function
import { Msg } from '../types/msgTypes';
import { curProp } from '../types/types';

//project utilities
export const flattenModule = (
  window: { [x: string]: unknown },
  R: ArrayLike<unknown> | { [s: string]: unknown }
) => Object.entries(R).forEach(([name, exported]) => (window[name] = exported));
export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
export const inspect = curry((prepend, data) => {
  console.log(prepend, data);
  return data;
});
export const wInspect = curry((log, prepend, data) => {
  log(prepend, data);
  return data;
});
export const toggleDebug = (window: { console: {} }, debug) => {
  if (!debug) {
    console.log('CANCELING CONSOLE');
    if (!isNil(window)) if (!window.console) window.console = {};
    var methods = ['log', 'debug', 'warn', 'trace', 'time', 'timeEnd', 'info'];
    for (var i = 0; i < methods.length; i++) {
      console[methods[i]] = function () {};
    }
  }
};
export const timeFn = curry((text, fn: (...arg0: any) => any) => {
  return (...args) => {
    console.time(`[TIME] ${text}`);
    const res = fn(...args);
    console.timeEnd(`[TIME] ${text}`);
    return res;
  };
});

export const asyncTimeFn = curry((text, fn: (...arg0: any) => any): any => {
  return async (...args) => {
    console.time(`[TIME] ${text}`);
    const res = await fn(...args);
    console.timeEnd(`[TIME] ${text}`);
    return res;
  };
});

export const wTimeFn = curry((log, text, fn: (...args: any) => any) => {
  return (...args) => {
    const t0 = performance.now();
    const res = fn(...args);
    const t1 = performance.now();
    log(`[INFO] Call to ${text} took ${t1 - t0} milliseconds.`, {});
    return res;
  };
}); //timeFn for worker
//
// stream utilities
export const currentValue = function (this: Observable<any, Error>) {
  //doesn't really belong in putils, should be a dedicated filefor extending kefi
  var result;
  var save = function (x) {
    result = x;
  };
  this.onValue(save);
  this.offValue(save);
  return result;
};
export const curVal = (stream: curProp<any>) => stream.currentValue();
export const streamAnd = (streams: Observable<any, any>[]) =>
  Kefir.combine(streams, (...args) => reduce(and, true, args));
export const toVal = (val, stream: Observable<any, any>) =>
  stream.map(() => val).toProperty(() => val);
// export function promiseStream<T0,T1>(stream: Observable<T0,any>, promise_fn: (arg0: T0) => Promise<T1>): Property<T1, any> {return stream.flatMapLatest(x=>Kefir.fromPromise(promise_fn(x)))}
// export const promiseStream = (stream , promise_fn) => {return stream.flatMapLatest(x=>Kefir.fromPromise(promise_fn(x)))}
export const promiseStream = curry(
  <T, S>(
    promise_fn: (arg0: T) => Promise<S>,
    stream: Observable<T, any>
  ): Observable<S, any> => {
    return stream.flatMapLatest((x) => Kefir.fromPromise(promise_fn(x)));
  }
);
export const waitFor = curry(
  <T,>(
    waited: Observable<any, any>,
    waiter: Observable<T, any>
  ): Observable<T, any> => waiter.bufferWhileBy(waited).flatten()
); // makeSafe :: Stream -> Stream
export const makeMsgStream = curry(
  (msg$: Observable<Msg, any>, name: string): Observable<Msg, any> =>
    msg$.filter(propEq('type', name))
);
export const errorFilter = curry(
  <T,>(name: string, stream: Observable<T, any>): Observable<T, any> =>
    stream.filterErrors((e) => {
      console.error(`[ERROR] from ${name}`, { stream, e });
      return false;
    })
);

// Functional utils
export const isExist = (x) => !(isNil(x) || isEmpty(x));
export const nullFn = () => {};
export const renameKeys = (keysMap: { [x: string]: any }) => (
  obj: ArrayLike<unknown> | { [s: string]: unknown }
) =>
  Object.entries(obj).reduce(
    (a, [k, v]) =>
      k in keysMap ? { ...a, [keysMap[k]]: v } : { ...a, [k]: v },
    {}
  );
// export const list2Obj = curry((key: string, list: {key:string}[]):object => pipe(map(x=>[x[key], x]), fromPairs)(list))
export const list2Obj = curry((key: string, list: { key: string }[]): object =>
  fromPairs(map((x) => [x[key], x], list))
);
