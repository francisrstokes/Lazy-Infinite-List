// data Infinite a
function Infinite(gen) {
  this.gen = gen;
  this.transformations = [];
};

// indexingSet :: Infinite Integer
const indexingSet = new Infinite(function*(){
  let x = 0;
  for (;;) yield x++;
});

// _copy :: Infinite a ~> Infinite a
Infinite.prototype._copy = function () {
  const newInfinite = Infinite.of(this.gen);
  newInfinite.transformations = this.transformations.slice();
  return newInfinite;
};

// _transform :: (String, Function) -> Infinite a ~> Infinite b
Infinite.prototype._transform = function (type, fn) {
  const newInfinite = this._copy();
  newInfinite.transformations.push({ type, fn });
  return newInfinite;
};

// zip :: Infinite a ~> Infinite b -> Infinite [a, b]
Infinite.prototype.zip = function (inf) {
  if (!(inf instanceof Infinite)) {
    throw new Error(`Argument to zip must be another Infinite`);
  }
  const newInfinite = this._copy();
  newInfinite.transformations.push({ type: 'zip', other: inf });
  return newInfinite;
};

// map :: Infinite a ~> (a -> b) -> Infinite b
Infinite.prototype['fantasy-land/map'] = Infinite.prototype.map = function (fn) {
  return this._transform('map', fn);
};

// mapIndexed :: Infinite a ~> (a -> Integer -> b) -> Infinite b
Infinite.prototype.mapIndexed = function (fn) {
  return this.zip(indexingSet)
    .map(([x, i]) => fn(x, i));
};

// filter :: Infinite a ~> (a -> Bool) -> Infinite b
Infinite.prototype['fantasy-land/filter'] = Infinite.prototype.filter = function (fn) {
  return this._transform('filter', fn);
};

// filterIndexed :: Infinite a ~> (a -> Integer -> Bool) -> Infinite a
Infinite.prototype.filterIndexed = function (fn) {
  return this.zip(indexingSet)
    .filter(([x, i]) => fn(x, i))
    .map(([x]) => x);
};

// filterDependent :: Infinite a ~> (a -> [a] -> Bool) -> Infinite b
Infinite.prototype.filterDependent = function (fn) {
  return this._transform('filterDependent', fn);
};

// take :: Infinite a ~> Integer -> [a]
Infinite.prototype.take = function (n) {
  const iterator = this.gen();
  return interpret(iterator, n, this.transformations);
};

// nth :: Infinite a ~> Integer -> a
Infinite.prototype.nth = function (n) {
  const iterator = this.gen();
  const res = interpret(iterator, n, this.transformations);
  return res[n-1];
};

// interpret :: Iterator a -> Integer -> [a]
const interpret = (iterator, n, transformations) => {
  let last;
  let out = new Array(n);
  let i = 0;

  const zips = transformations.map(t =>
    (t.type === 'zip')
    ? { iterator: t.other.gen(), transformations: t.other.transformations }
    : undefined
  );

  while (i < n) {
    const {value, done} = iterator.next(last);
    last = value;
    if (done) break;

    let filtered = false;
    let x = value;
    for (let ti = 0; ti < transformations.length; ti++) {
      if (transformations[ti].type === 'map') {
        x = transformations[ti].fn(x);
      } else if (transformations[ti].type === 'filter' && !transformations[ti].fn(x)) {
        filtered = true;
      } else if (transformations[ti].type === 'filterDependent' && !transformations[ti].fn(x, out.slice(0, i))) {
        filtered = true;
      } else if (transformations[ti].type === 'zip') {
        const zv = interpret(zips[ti].iterator, 1, zips[ti].transformations)[0];
        x = [x, zv];
      }

      if (filtered) break;
    }

    if (!filtered) {
      out[i++] = x;
    }
    filtered = false;
  }

  return out;
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

module.exports = Infinite;
