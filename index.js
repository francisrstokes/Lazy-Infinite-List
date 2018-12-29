function Infinite(gen) {
  this.gen = gen;
  this.transformations = [];
};

Infinite.prototype._fork = function (type, fn) {
  const newInfinite = Infinite.of(this.gen);
  newInfinite.transformations = [
    ...this.transformations,
    { type, fn }
  ];
  return newInfinite;
}

Infinite.prototype['fantasy-land/map'] = Infinite.prototype.map = function (fn) {
  return this._fork('map', fn);
};
Infinite.prototype['fantasy-land/filter'] = Infinite.prototype.filter = function (fn) {
  return this._fork('filter', fn);
};
Infinite.prototype.dependentFilter = function (fn) {
  return this._fork('dependentFilter', fn);
};

Infinite.prototype.take = function (start, n) {
  const iterator = this.gen();
  return interpret(iterator, start, n, this.transformations);
};

const interpret = (iterator, start, n, transformations) => {
  let last;
  let out = [];

  while (out.length < (start + n)) {
    const {value, done} = iterator.next(last);
    last = value;
    if (done) break;

    let skip = false;

    let x = value;
    for (const T of transformations) {
      if (T.type === 'map') {
        x = T.fn(x);
      } else if (T.type === 'filter' && !T.fn(x)) {
        skip = true;
        break;
      } else if (T.type === 'dependentFilter' && !T.fn(x, out)) {
        skip = true;
      }
    }

    if (!skip) out.push(x);
    skip = false;
  }

  return out.slice(start, start + n);
};

Infinite['fantasy-land/of'] = Infinite.of = gen => new Infinite(gen);

module.exports = Infinite;
