function asyncExecute(func) {
  setTimeout(func, 0);
}

function isThenable(value) {
  return value && typeof value === 'object' && typeof value.then === 'function';
}

const PromiseState = {
  Pending: 'pending',
  Fulfilled: 'fulfilled',
  Rejected: 'rejected'
};

class IPromise {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw Error(`Promise resolver ${executor} is not a function`);
    }
    this._state = PromiseState.Pending;
    this._result = undefined;
    this._fulfilledTasks = [];
    this._rejectedTasks = [];
    this._finalTasks = [];
    this._resolve = (value) => {
      if (this._state !== PromiseState.Pending) {
        return this;
      }
      if (isThenable(value)) {
        value.then(
          (res) => this._doFulfill(res),
          (err) => this._doReject(err)
        );
      } else {
        this._doFulfill(value);
      }
    };
    this._reject = (error) => {
      if (this._state !== PromiseState.Pending) {
        return this;
      }

      if (isThenable(error)) {
        error.then(
          (res) => this._doFulfill(res),
          (err) => this._doReject(err)
        );
      } else {
        this._doReject(error);
      }
    };
    executor(this._resolve, this._reject);
  }

  _doFulfill(value) {
    this._state = PromiseState.Fulfilled;
    this._result = value;
    this._fulfilledTasks.map(asyncExecute);

    this._fulfilledTasks = [];
    this._rejectedTasks = [];
  }

  _doReject(error) {
    this._state = PromiseState.Rejected;
    this._result = error;
    this._rejectedTasks.map(asyncExecute);

    this._fulfilledTasks = [];
    this._rejectedTasks = [];
  }

  then(onFulfilled, onRejected) {
    const promise = new IPromise((resolve, reject) => {
      const fulfilledTask = () => {
        if (typeof onFulfilled === 'function') {
          try {
            const result = onFulfilled(this._result);
            return resolve(result);
          } catch (err) {
            reject(err);
          }
        } else {
          return resolve(this._result);
        }
      };
      const rejectedTask = () => {
        if (typeof onRejected === 'function') {
          try {
            const result = onRejected(this._result);
            return resolve(result);
          } catch (err) {
            reject(err);
          }
        } else {
          return reject(this._result);
        }
      };
      switch (this._state) {
        case PromiseState.Fulfilled:
          asyncExecute(fulfilledTask);
          break;
        case PromiseState.Rejected:
          asyncExecute(rejectedTask);
          break;
        case PromiseState.Pending:
          this._fulfilledTasks.push(fulfilledTask);
          this._rejectedTasks.push(rejectedTask);
          break;
        default:
          break;
      }
    });

    return promise;
  }
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  // TODO:
  finally() {}
  static resolve(value) {
    return new IPromise((resolve) => resolve(value));
  }
  static reject(err) {
    return new IPromise((_, reject) => reject(err));
  }
  static allSettled(promises) {
    promises;
  }
  static all(promises) {
    return new IPromise((resolve, reject) => {
      const results = [];
      let counter = 0;
      promises.forEach((p, index) => {
        p.then(
          (res) => {
            results[index] = res;
            ++counter === promises.length && resolve(results);
          },
          (err) => reject(err)
        );
      });
    });
  }
  static race(promises) {
    return new IPromise((resolve, reject) => {
      promises.forEach((p) => {
        p.then(
          (res) => resolve(res),
          (err) => reject(err)
        );
      });
    });
  }
  static any(promises) {
    return new IPromise((resolve, reject) => {
      let counter = 0;
      const errors = [];
      promises.forEach((p, index) => {
        p.then(
          (res) => resolve(res),
          (err) => {
            errors[index] = err;
            ++counter === promises.length && reject(new Error(errors));
          }
        );
      });
    });
  }
}

export default IPromise;
