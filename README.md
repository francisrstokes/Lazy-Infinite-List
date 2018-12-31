# lazy-infinite
A Fantasy Land Compliant, Lazily Evaluated Infinite List Data Structure.

`lazy-infinite` uses generators to define a potentially infinite data structure, and allows you to describe transforming the elements in that structure without evaluating it.

## Installation

```bash
npm i lazy-infinite
```

## Usage

```javascript
const Infinite = require('lazy-infinite');

// Create a representation of an infinite structure
const naturalNumbers = Infinite.of(function*() {
  let x = 0;
  while (true) yield x++;
});

// Transform it to yield new infinite structures
const primes = naturalNumbers
  .filterDependent((x, list) => {
    if (!(x > 1 && (x % 2 === 1 || x === 2))) return false;
    for (let i = 0; i < list.length; i++) {
      const y = list[i];
      if (y > x / 2) break;
      if (x % y === 0) return false;
    }
    return true;
  });

// Concretely evaluate only what is required
const first1000Primes = primes.take(1000);
// -> [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, ...
```

## API

### Infinite.of

`Infinite.of :: Generator a -> Infinite a`

`Infinite.of` takes a potentially infinite generator function and returns an `Infinite` list.

```javascript
const odds = Infinite.of(function*() {
  let x = 1;
  while (true) {
    yield x;
    x += 2;
  }
});
```

### take

`take :: Infinite a ~> Integer -> [a]`

`take` receives an argument *n*, and returns a concrete list with *n* elements.

```javascript
naturalNumbers.take(5);
// -> [ 0, 1, 2, 3, 4 ]
```

### nth

`nth :: Infinite a ~> Integer -> a`

`nth` takes an argument *n* and returns the *nth* element of the concretely evaluated list.

**Example**
```javascript
primes.nth(5);
// -> 4
```

### map

`map :: Infinite a ~> (a -> b) -> Infinite b`

`map` takes a function and applies it to every element in the list.

**Example**
```javascript
naturalNumbers
  .map(x => -x)
  .take(5);
// -> [ -0, -1, -2, -3, -4 ]
```

### filter

`filter :: Infinite a ~> (a -> Bool) -> Infinite a`

`filter` takes a function, and drops any elements from the infinite list that return `false` when this function is applied.

**Example**
```javascript
naturalNumbers
  .filter(x => x % 2 === 0)
  .take(5);
// -> [ 0, 2, 4, 6, 8 ]
```

### filterDependent

`filterDependent :: Infinite a ~> (a -> [a] -> Bool) -> Infinite a`

`filterDependent` is just like [filter](#filter), except that the function it takes gets the *list of items before it* as the second argument.

**Example**
```javascript
naturalNumbers
  .filterDependent((x, list) => x !== list.length)
  .take(5);
// -> [ 1, 2, 3, 4, 5 ]
```

### zip

`zip :: Infinite a ~> Infinite b -> Infinite [a, b]`

`zip` takes another *Infinite*, and returns a new Infinite whose elements are an array with the original value and a corresponding value from the other infinte.

**Example**
```javascript
naturalNumbers
  .zip(primes)
  .take(5);
// -> [ [0, 2], [1, 3], [2, 5], [3, 7], [4, 11] ]
```

## Fantasy Land

Supports: `Functor` and `Filterable`.
