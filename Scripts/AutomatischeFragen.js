/**
  * Workflow:
  * Step 1: Login to gain Token
  * (Loop changing type of questions asked - textbook, generated, both, none)
  * (Loop incrementing training question count by 100)
  * Step 2: Reset Dataset ML Model
  * Step 3: Train
  * Step 4: Evaluate
  *
  *
  * API Reference: https://qanswer-core1.univ-st-etienne.fr/swagger-ui.html#/
*/

var token;
const dataset = "SNIK_BB";

var noTraining;
var genOnly;
var bookOnly;
var both;

const trainbook = [{

}]; // TODO Trainingsfragen aus BB
const testbook = [{

}]; // TODO Testfragen aus BB

const traingen = [{

}]; // TODO Trainingsfragen automatisch generiert
const testgen = [{

}]; // TODO Testfragen automatisch generiert

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
    data: '{"usernameOrEmail": "' + QANSWER_CREDENTIALS.user + '", "password":"' + QANSWER_CREDENTIALS.password + '"}'
  };

  $.ajax(settings).done(function (response) {
    token = response.accessToken;
    console.log("Logged in.");
  });
}

async function resetModel() {
  let settings = {
    async: true,
    crossDomain: true,
    url: "​/api​/dataset​/set_default_model",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    processData: false,
    headers: {
      Authorization: "Bearer " + token,
    },
    data: [dataset]
  };

  $.ajax(settings).done(function (response) {
    token = response.accessToken;
    console.log("Reset model.");
  }); 
}

async function resetQAPairs() {
  let settings = {
    async: true,
    crossDomain: true,
    url: "​/api/feedback/remove-all-questions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    processData: false,
    headers: {
      Authorization: "Bearer " + token,
    },
    data: [dataset]
  };

  $.ajax(settings).done(function (response) {
    token = response.accessToken;
    console.log("Reset model.");
  }); 
}

async function uploadQuestions(questionAnswerPairsJSON) {
  let settings = {
    async: true,
    crossDomain: true,
    url: "​/api/feedback/admin/upload",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    processData: false,
    headers: {
      Authorization: "Bearer " + token,
    },
    data: JSON.stringify(questionAnswerPairsJSON)
  };

  $.ajax(settings).done(function (response) {
    token = response.accessToken;
    console.log("Uploaded question-answer-pairs.");
  }); 
}

async function train() {
  let settings = {
    async: true,
    crossDomain: true,
    url: "​/api/feedback/train",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    processData: false,
    headers: {
      Authorization: "Bearer " + token,
    },
    data: [dataset]
  };

  $.ajax(settings).done(function (response) {
    token = response.accessToken;
    console.log("Trained.");
  }); 
}

// TODO: AUSWERTUNG; IMMER ALLE FRAGEN ABFRAGEN, ABER GETRENNT RECHNEN
async function evaluate() {

}

async function main() {
  await login();
  // no training
  await resetModel();
  await resetQAPairs();
  noTraining = await evaluate();

  // only auto-generated questionsk
  genOnly = array();
  for(num = 100; num <= traingen.length; num+=100) {
    if(num > traingen.length) {
      num = traingen.length;
    }

    console.group("GENERATED - " + num);
    // Setup
    await resetModel();
    await resetQAPairs();

    // Training
    let questions = traingen.slice(0, num);
    await uploadQuestions(questions);

    let res = await evaluate();
    gen.array_push(res);
    
    console.groupEnd();
  }

  // only textbook questions for training
  console.group("TEXTBOOK ONLY");
  await resetModel();
  await resetQAPairs();
  
  await uploadQuestions(trainbook);
  await train();

  bookOnly = await evaluate();
  
  console.groupEnd();

  // training with both; only incrementing auto-generated count though
  both = array();
  for(num = 100; num <= traingen.length; num+=100) {
    if(num > traingen.length) {
      num = traingen.length;
    }
    // configure
    console.group("BOTH - " + num);
    await resetModel();
    await resetQAPairs();

    // Upload Questions & Train
    let qapairs = traingen.slice(0, num);
    qapairs = qapairs.concat(trainbook);
    
    await uploadQuestions(qapairs);
    await train();

    let res = await evaluate();
    both.push(res);

    console.groupEnd();
  }
}
