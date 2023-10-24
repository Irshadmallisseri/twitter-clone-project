/*
JavaScript hoisting
let x = [1, 2, 3, 4];
let y = x.map((num) => num * 2);
let z = y.reduce((acc, curr) => acc + curr, 0);

console.log(z);

let a = [1, 2, 3, 4, 5];
let result = a.some((val) => {
  return val % 2 === 0;
});

console.log(result);
let x = [1, 2, 3];
let y = x.find((n) => n > 1);

console.log(y);*/

console.log(3+ +"3")