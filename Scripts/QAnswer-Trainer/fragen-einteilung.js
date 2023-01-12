/**
 * generates simple question-answer-pairs
 */
async function retreivePairs() {
  const query_subject = `SELECT DISTINCT REPLACE(REPLACE(REPLACE(REPLACE(
    CONCAT("What ",?pl, " ", ?ol, "?"),
    "What is responsible", "Who is responsible"),
    "What approves", "Who approves"),
    "What is involved", "Who is involved"),
    "What .* component", "What has the component") as ?question,
CONCAT("SELECT DISTINCT ?s WHERE { ?s <", STR(?p), "> <", STR(?o), ">. }") as ?sparql
FROM sniko:meta
FROM sniko:bb
{
?s ?p ?o.
?p rdfs:domain [rdfs:subClassOf meta:Top].
?p rdfs:range [rdfs:subClassOf meta:Top].
?s a [rdfs:subClassOf meta:Top].
?o a [rdfs:subClassOf meta:Top].
?p rdfs:label ?pl. FILTER(langmatches(lang(?pl),"en")).
?o rdfs:label ?ol. FILTER(langmatches(lang(?ol),"en")).
}
ORDER BY RAND()`;
  const query_object = `SELECT DISTINCT CONCAT(
    "What ", REPLACE(REPLACE(REPLACE(
    STR(?pl), ".* component", CONCAT("are components of ", STR(?sl))),
    "^is ([a-z]* [a-z]*)", CONCAT("is ", STR(?sl), " $1")),
    "^([a-z]*e)s", CONCAT("is $1d by ", STR(?sl))),
    "?") as ?question,
CONCAT ("SELECT DISTINCT ?o WHERE { <", STR(?s), "> <", STR(?p), "> ?o. }") as ?sparql
FROM sniko:meta
FROM sniko:bb
{
 ?s ?p ?o.
 ?p rdfs:domain [rdfs:subClassOf meta:Top].
 ?p rdfs:range [rdfs:subClassOf meta:Top].
 ?s a [rdfs:subClassOf meta:Top].
 ?o a [rdfs:subClassOf meta:Top].
 ?s rdfs:label ?sl. FILTER(langmatches(lang(?sl),"en")).
 ?p rdfs:label ?pl. FILTER(langmatches(lang(?pl),"en")).
}
ORDER BY RAND()`;

  let bindings_subject = await select(query_subject, null, "https://www.snik.eu/sparql");
  let bindings_object = await select(query_object, null, "https://www.snik.eu/sparql");

  let array_subject = decode_bindings(bindings_subject);
  let array_object = decode_bindings(bindings_object);
  // every generated question in one array
  let qa_pairs_combined = array_subject.concat(array_object);

  sort(qa_pairs_combined);
}

function decode_bindings(bindings) {

  let result = [];

  for(let b of bindings) {
    result.push({ question: b.question.value, answer: b.sparql.value })
  }

  return result;
} 

function sort(qaPairs) {
  qaPairs = shuffle(qaPairs);

  let halfLength = Math.ceil(qaPairs.length / 2);
  let trainingPairs = qaPairs.slice(0, halfLength);
  let testPairs = qaPairs.slice(halfLength);


  console.groupCollapsed("Training pairs");
  let trainString = JSON.stringify(trainingPairs);
  console.log(trainString);
  console.groupEnd();

  console.groupCollapsed("Testing pairs");
  let testString = JSON.stringify(testPairs);
  console.log(testString);
  console.groupEnd();

  output("Automatisch generierte Trainingsfragen", "generated-training.json", trainString, "application/json");
  output("Automatisch generierte Testfragen", "generated-testing.json", testString, "application/json");

}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;

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