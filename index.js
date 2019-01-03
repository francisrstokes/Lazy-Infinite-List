// data Infinite a
function Infinite(gen) {
  this.gen = gen;
};

// indexingSet :: Infinite Integer
const indexingSet = new Infinite(function*(){
  let x = 0;
  for (;;) yield x++;
});

// drop :: Infinite a ~> Integer -> Infinite a
Infinite.prototype.drop = function (n) {
  if (typeof n !== 'number' || !(n < Infinity)) {
    throw new Error(`n must be a number less than Infinity`);
  }

  const that = this;
  return Infinite.of(function* () {
    const i = that.gen();
    let dropped = 0;
    while (dropped++ < n) i.next();

    while (true) {
      const v = i.next();
      if (v.done) break;
      yield v.value;
    }
  });
};

// intersperse :: Infinite a ~> Infinite b -> Infinite a|b
Infinite.prototype.intersperse = function (inf) {
  if (!(inf instanceof Infinite)) {
    throw new Error(`Argument to intersperse must be another Infinite`);
  }

  const that = this;
  return Infinite.of(function* () {
    const i = that.gen();
    const i2 = inf.gen();
    let useFirst = true;

    while (true) {
      const v = useFirst ? i.next() : i2.next();
      if (v.done) break;
      yield v.value;
      useFirst = !useFirst;
    }
  });
};

// zip :: Infinite a ~> Infinite b -> Infinite [a, b]
Infinite.prototype.zip = function (inf) {
  if (!(inf instanceof Infinite)) {
    throw new Error(`Argument to zip must be another Infinite`);
  }

  const that = this;
  return Infinite.of(function* () {
    const i1 = that.gen();
    const i2 = inf.gen();
    while (true) {
      const v1 = i1.next();
      const v2 = i2.next();
      if (v1.done || v2.done) break;
      yield [v1.value, v2.value];
    }
  });
};

// map :: Infinite a ~> (a -> b) -> Infinite b
Infinite.prototype['fantasy-land/map'] = Infinite.prototype.map = function (fn) {
  const that = this;
  return Infinite.of(function* () {
    const i = that.gen();
    while (true) {
      const v = i.next();
      if (v.done) break;
      yield fn(v.value);
    }
  });
};

// flatMap :: Infinite a ~> (a -> [b]) -> Infinite b
Infinite.prototype.flatMap = function (fn) {
  const that = this;
  return Infinite.of(function* () {
    const i = that.gen();
    while (true) {
      const v = i.next();
      if (v.done) break;
      const vs = fn(v.value);
      for (let j = 0; j < vs.length; j++) {
        yield vs[j];
      }
    }
  });
};

// mapIndexed :: Infinite a ~> (a -> Integer -> b) -> Infinite b
Infinite.prototype.mapIndexed = function (fn) {
  return this.zip(indexingSet)
    .map(([x, i]) => fn(x, i));
};

// filter :: Infinite a ~> (a -> Bool) -> Infinite b
Infinite.prototype['fantasy-land/filter'] = Infinite.prototype.filter = function (fn) {
  const that = this;
  return Infinite.of(function* () {
    const i = that.gen();
    while (true) {
      const v = i.next();
      if (v.done) break;
      if (fn(v.value)) {
        yield v.value;
      }
    }
  });
};

// filterIndexed :: Infinite a ~> (a -> Integer -> Bool) -> Infinite a
Infinite.prototype.filterIndexed = function (fn) {
  return this.zip(indexingSet)
    .filter(([x, i]) => fn(x, i))
    .map(([x]) => x);
};

// filterDependent :: Infinite a ~> (a -> [a] -> Bool) -> Infinite b
Infinite.prototype.filterDependent = function (fn) {
  const that = this;
  return Infinite.of(function* () {
    const i = that.gen();
    const prev = [];

    while (true) {
      const v = i.next();
      if (v.done) break;
      if (fn(v.value, prev)) {
        prev.push(v.value);
        yield v.value;
      }
    }
  });
};

// take :: Infinite a ~> Integer -> [a]
Infinite.prototype.take = function (n) {
  const i = this.gen();
  const concrete = new Array(n);
  let index = 0;
  while (index < n) {
    const v = i.next();
    if (v.done) return concrete.slice(0, index);
    concrete[index++] = v.value;
  }
  return concrete;
};

// nth :: Infinite a ~> Integer -> a
Infinite.prototype.nth = function (n) {
  return this.take(n)[n-1];
};

// of :: Generator a -> Infinite a
Infinite['fantasy-land/of'] = Infinite.of = gen => new Infinite(gen);

// from :: (a -> a) -> a -> Infinite a
Infinite.from = (fn, start) => Infinite.of(function* () {
  let x = start;
  while (true) {
    yield x;
    x = fn(x);
  }
});

// fromIterable :: Iterable a -> Infinite a
Infinite.fromIterable = it => {
  if (typeof it[Symbol.iterator] !== 'function') {
    throw new Error(`Cannot create Infinite from non-iterable`);
  }
  return Infinite.of(() => it[Symbol.iterator]());
};

module.exports = Infinite;
