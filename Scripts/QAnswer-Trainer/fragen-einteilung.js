function retreivePairs() {
    // TODO: Comments
    // TODO: import JSON file with questions from the SPARQL-queries
    // TODO: clean JSON data into 2D-Array with individual subarrays containing one QA-Pair
}

function sort(qaPairs) {
    qaPairs = shuffle(qaPairs);

    let halfLength = Math.ceil(qaPairs.length / 2);
    let trainingPairs = qaPairs.slice(0, halfLength);
    let testPairs = qaPairs.slice(halfLength);

    console.groupCollapsed("Training pairs");
    console.log(JSON.stringify(trainingPairs));
    console.groupEnd();
    
    console.groupCollapsed("Testing pairs");
    console.log(JSON.stringify(testPairs));
    console.groupEnd();

    // TODO: Better output into HTML page with copy button
    
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