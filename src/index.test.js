import IPromise from './index';

describe('`i-promise` should work', () => {
  beforeEach(() => {
    jest.setTimeout(10000);
  });
  test('fulfilled', async () => {
    let p = new IPromise((resolve) => {
      resolve('res1');
    });
    await expect(p).resolves.toBe('res1');
  });
  test('rejected', async () => {
    let p = new IPromise((resolve, reject) => {
      reject('err1');
    });
    await expect(p).rejects.toEqual('err1');
  });
  test('throw in then', async () => {
    let p = new IPromise((resolve, reject) => {
      resolve('res1');
    });
    await expect(
      p.then((res) => {
        throw new Error('err1 in resolve ' + res);
      })
    ).rejects.toEqual(new Error('err1 in resolve res1'));
  });
  test('chain call', async () => {
    let p = new IPromise((resolve) => {
      setTimeout(() => {
        resolve('res1');
      }, 1000);
    });
    const p1 = p.then((res) => {
      return 'res2';
    });
    await expect(p).resolves.toEqual('res1');
    await expect(p1).resolves.toEqual('res2');
    await expect(p1.then(() => 'res3')).resolves.toBe('res3');
    await expect(p.then('direct then value')).resolves.toBe('res1');
  });
  test('static resolve/reject', async () => {
    await expect(IPromise.resolve('res1')).resolves.toBe('res1');
    await expect(IPromise.resolve('res1').then(() => 'res2')).resolves.toBe(
      'res2'
    );

    await expect(IPromise.reject('err1')).rejects.toBe('err1');
    await expect(IPromise.reject('err1').then(() => 'res2')).rejects.toBe(
      'err1'
    );
  });

  test('return promise should be flattened', async () => {
    let p1 = new IPromise((resolve) => {
      resolve(Promise.resolve('res1'));
    });

    await expect(p1).resolves.toBe('res1');
    p1 = new IPromise((resolve) => {
      resolve(Promise.resolve(Promise.resolve('res2')));
    });
    p1 = p1.then((res) => {
      return 'res3';
    });
    await expect(p1).resolves.toBe('res3');
  });
  test('static `all`', async () => {
    await expect(
      IPromise.all([
        new IPromise((resolve) => {
          setTimeout(() => {
            resolve('res1');
          }, 2000);
        }),
        new IPromise((resolve) => {
          setTimeout(() => {
            resolve('res2');
          }, 1000);
        })
      ])
    ).resolves.toEqual(['res1', 'res2']);
    await expect(
      IPromise.all([
        new IPromise((resolve, reject) => {
          setTimeout(() => {
            reject('err1');
          }, 2000);
        }),
        new IPromise((resolve) => {
          setTimeout(() => {
            resolve('res2');
          }, 1000);
        })
      ])
    ).rejects.toEqual('err1');
  });
  test('static `any`', async () => {
    await expect(
      IPromise.any([
        new IPromise((resolve) => {
          setTimeout(() => {
            resolve('res1');
          }, 2000);
        }),
        new IPromise((resolve, reject) => {
          setTimeout(() => {
            reject('err2');
          }, 1000);
        })
      ])
    ).resolves.toEqual('res1');
    await expect(
      IPromise.any([
        new IPromise((resolve, reject) => {
          setTimeout(() => {
            reject('err1');
          }, 2000);
        }),
        new IPromise((resolve, reject) => {
          setTimeout(() => {
            reject('err2');
          }, 1000);
        })
      ])
    ).rejects.toEqual(new Error(['err1', 'err2']));
  });
  test('static `race`', async () => {
    await expect(
      IPromise.race([
        new IPromise((resolve, reject) => {
          setTimeout(() => {
            reject('err1');
          }, 1000);
        }),
        new IPromise((resolve, reject) => {
          setTimeout(() => {
            resolve('res2');
          }, 2000);
        })
      ])
    ).rejects.toEqual('err1');
    await expect(
      IPromise.race([
        new IPromise((resolve, reject) => {
          setTimeout(() => {
            resolve('res1');
          }, 1000);
        }),
        new IPromise((resolve, reject) => {
          setTimeout(() => {
            reject('err2');
          }, 2000);
        })
      ])
    ).resolves.toEqual('res1');
  });
});
