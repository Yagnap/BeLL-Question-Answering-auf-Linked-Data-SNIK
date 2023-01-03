function sort(qaPairs) {
    qaPairs = shuffle(qaPairs);

    let halfLength = Math.ceil(qaPairs.length / 2);
    let trainingPairs = qaPairs.slice(0, halfLength);
    let testPairs = qaPairs.slice(halfLength);
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
  }