function Infinite(gen) {
  this.gen = gen;
  this.transformations = [];
};

Infinite.prototype._copy = function () {
  const newInfinite = Infinite.of(this.gen);
  newInfinite.transformations = this.transformations.slice();
  return newInfinite;
};

Infinite.prototype._transform = function (type, fn) {
  const newInfinite = this._copy();
  newInfinite.transformations.push({ type, fn });
  return newInfinite;
};

Infinite.prototype.zip = function (inf) {
  if (!(inf instanceof Infinite)) {
    throw new Error(`Argument to zip must be another Infinite`);
  }
  return this._transform('zip', inf.gen);
};

Infinite.prototype['fantasy-land/map'] = Infinite.prototype.map = function (fn) {
  return this._transform('map', fn);
};
Infinite.prototype['fantasy-land/filter'] = Infinite.prototype.filter = function (fn) {
  return this._transform('filter', fn);
};
Infinite.prototype.filterDependent = function (fn) {
  return this._transform('filterDependent', fn);
};

Infinite.prototype.take = function (n) {
  const iterator = this.gen();
  return interpret(iterator, n, this.transformations);
};

Infinite.prototype.nth = function (n) {
  const iterator = this.gen();
  const res = interpret(iterator, n, this.transformations);
  return res[n-1];
};

const interpret = (iterator, n, transformations) => {
  let last;
  let out = new Array(n);
  let i = 0;

  const zips = transformations.map(t => (t.type === 'zip') ? t.fn() : undefined);

  while (i < n) {
    const {value, done} = iterator.next(last);
    last = value;
    if (done) break;

    let skip = false;

    let x = value;
    for (let ti = 0; ti < transformations.length; ti++) {
      if (transformations[ti].type === 'map') {
        x = transformations[ti].fn(x);
      } else if (transformations[ti].type === 'filter' && !transformations[ti].fn(x)) {
        skip = true;
        break;
      } else if (transformations[ti].type === 'filterDependent' && !transformations[ti].fn(x, out.slice(0, i))) {
        skip = true;
        break;
      } else if (transformations[ti].type === 'zip') {
        x = [x, zips[ti].next().value];
      }
    }

    if (!skip) {
      out[i++] = x;
    }
    skip = false;
  }

  return out;
};

Infinite['fantasy-land/of'] = Infinite.of = gen => new Infinite(gen);

module.exports = Infinite;
