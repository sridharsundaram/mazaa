// Copyright Mazaa Learn 2012
// @author Sridhar Sundaram

function shuffle(array, numChoices) {
  for (var i = 0; i < array.length - 1; i++) {
    var rnd = Math.floor(Math.random() * (array.length - i));
    var t = array[i];
    array[i] = array[i + rnd];
    array[i + rnd] = t;
  }
  return Math.floor(Math.random() * numChoices);
}

