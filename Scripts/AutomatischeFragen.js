/**
  * Workflow:
  * Step 1: Login to gain Token
  * (Loop changing type of questions asked - textbook, generated, both, none)
  * (Loop incrementing training question count by 100)
  * Step 2: Create Dataset -> Upload Questions
  * Step 3: Configure Dataset

  * Step 4: Reset Dataset ML Model
  * Step 5: Train
  * Step 6: Evaluate
  *
  *
  * API Reference: https://qanswer-core1.univ-st-etienne.fr/swagger-ui.html#/
*/

var token;
var bb;

async function login() {
  let settings = {
    async: true,
    crossDomain: true,
    url: "http://qanswer-core1.univ-st-etienne.fr/api/user/signin",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    processData: false,
    data: '{"usernameOrEmail": "' + QANSWER_CREDENTIALS.user + '", "password":"' + QANSWER_CREDENTIALS.password + '"}',
  };

  $.ajax(settings).done(function (response) {
    token = response.accessToken;
    console.log("Logged in.");
  });
}

function loadSnikData() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/bb.nt");
  xhr.responseType = "blob";//force the HTTP response, response-type header to be blob
  xhr.onload = function()
  {
      bb = xhr.response;//xhr.response is now a blob object
  }
  xhr.send();
}

async function createDataset(accessToken, dataset) {

  const initdata = {
    "dataset": dataset,
    "file":
  };

  let settings = {
    async: true,
    crossDomain: true,
    url: "http://qanswer-core1.univ-st-etienne.fr/api/dataset/upload",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    processData: false,
    data: JSON.stringify(initdata)
  };
}

async function configureDataset(accessToken, dataset) {

  const config = {
    "autocompleteConfig": {
      "dataSuggestion": false,
      "graphSuggestion": false,
      "questionSuggestion": true
    },
    "dataset": dataset,
    "languages": ["en"],
    "numberTriples": 2,
    "propertyMappings": [
      "updatesPhases": {
        "lexicalization": "phases",
        "uri": "http://www.snik.eu/ontology/meta/updates"
      }
    ],
    "stopWords": {
      "additionalProp": [
        "a", "about", "all", "an", "and", "are", "as", "at", "be", "by", "can", "did", "do",
        "does", "from", "give", "goes", "had", "has", "have", "here", "how", "in", "into",
        "is", "its", "list", "many", "most", "my", "no", "of", "on", "or", "s", "show", "some",
        "something", "such", "tell", "the", "their", "these", "they", "this", "to", "using",
        "was", "were", "what", "which", "will", "with", "yes"
      ]
    },
    "uiMappings": {
      "description": [
        "http://www.w3.org/2000/01/rdf-schema#description",
        "http://schema.org/description",
        "http://www.w3.org/2004/02/skos/core#definition"
      ],
      "label": [
        "http://www.w3.org/2000/01/rdf-schema#label",
        "http://www.w3.org/2004/02/skos/core#altLabel"
      ]
    }
  };
  let settings = {
    async: true,
    crossDomain: true,
    url: "http://qanswer-core1.univ-st-etienne.fr/api/dataset/config",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    processData: false,
    data: JSON.stringify(config)
  };
  $.ajax(settings).done(function (response) {
    console.log("Configuration finished for " + dataset ".");
  });
}

async function main() {
  var dataset = "SNIK_BB_TEST";
  await login();
  loadSnikData();

  await createDataset(token, dataset);
  await configureDataset(token, dataset);

  // TODO: Loops
  // TODO: Dataset name in Format SNIK_BB_TYPE_NUM
}
// VIELLEICHT EINFACH GANZ ÄNDERN: SCHON ERSTELLTEN & KONFIGURIERTEN DATENSATZ VERWENDEN & DANN /api/dataset/set_default_model
