const q = [
  {
    question: "What are appropriate models for health information systems?",
    language: "en",
    id: 2,
    sparql: "SELECT DISTINCT ?s1 WHERE{ ?s1 rdfs:subClassOf+ bb:Model . }  ",
  },
  {
    question: "What is information management?",
    language: "en",
    id: 3,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:InformationManagement skos:definition ?o1 . }  ",
  },
  {
    question: "What are hospital information systems?",
    language: "en",
    id: 4,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:HospitalInformationSystem skos:definition ?o1 . }  ",
  },
  {
    question: "What are electronic health records?",
    language: "en",
    id: 6,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:ElectronicHealthRecord skos:definition ?o1 . }  ",
  },
  {
    question: "What are typical reference models for HIS?",
    language: "en",
    id: 9,
    sparql:
      "SELECT DISTINCT ?s1 WHERE{ ?s1 rdfs:subClassOf+ bb:ReferenceModel . }  ",
  },
  {
    question: "What are the main hospital functions?",
    language: "en",
    id: 10,
    sparql:
      "SELECT DISTINCT ?s1 WHERE{ ?s1 rdfs:subClassOf bb:HospitalFunction . }  ",
  },
  {
    question: "What are different architectures of HIS?",
    language: "en",
    id: 12,
    sparql:
      "SELECT DISTINCT ?s1 WHERE{ ?s1 rdfs:subClassOf+ bb:HisArchitecture . }  ",
  },
  {
    question: "What is meant by physical integration?",
    language: "en",
    id: 15,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:PhysicalIntegration skos:definition ?o1 . }  ",
  },
  {
    question:
      "Which strategies are appropriate for maintaining electronic health records in a transinstitutional health information system?",
    language: "en",
    id: 16,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:TransinstitutionalHealthInformationSystem meta:isAssociatedWith ?o1 . }  ",
  },
  {
    question: "What criteria for the overall HIS architecture exist?",
    language: "en",
    id: 22,
    sparql:
      "SELECT DISTINCT ?s1 WHERE{ ?s1 rdfs:subClassOf bb:QualityOfHISArchitecture . }  ",
  },
  {
    question: "What are the tasks and methods for strategic HIS monitoring?",
    language: "en",
    id: 27,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:StrategicHISMonitoring meta:updates | meta:functionComponent ?o1 . }  ",
  },
  {
    question: "What are the tasks and methods for strategic HIS directing?",
    language: "en",
    id: 28,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:StrategicHISDirecting meta:updates | meta:functionComponent ?o1 . }  ",
  },
  {
    question:
      "Which organizational units are involved in information management?",
    language: "en",
    id: 30,
    sparql:
      "SELECT DISTINCT ?s1 WHERE{ ?s1 meta:functionComponent bb:InformationManagement . }  ",
  },
  {
    question:
      "Which boards and persons are involved in information management?",
    language: "en",
    id: 31,
    sparql:
      "SELECT DISTINCT ?s1 WHERE{ ?s1 meta:isResponsibleForFunction bb:InformationManagement . }  ",
  },
  {
    question: "What are the typical tasks for strategic HIS planning?",
    language: "en",
    id: 32,
    sparql:
      "SELECT DISTINCT ?s1 WHERE{ ?s1 rdfs:subClassOf bb:StrategicHISPlanning . }  ",
  },
  {
    question: "What are the typical tasks of strategic HIS directing?",
    language: "en",
    id: 35,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:StrategicHISDirecting meta:uses ?o1 . }  ",
  },
  {
    question: "What are health care networks?",
    language: "en",
    id: 37,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:HealthCareNetwork skos:definition ?o1 . }  ",
  },
  {
    question: "How can health care networks be described?",
    language: "en",
    id: 38,
    sparql:
      "SELECT DISTINCT ?o1 WHERE{ bb:HealthCareNetwork skos:definition ?o1 . } ",
  },
];

var token;

$().ready(function () {
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
  });
  main();
});

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function ask() {
  // array with answers in format of table
  var answers = [];

  // loop through questions
  for(let x of q)
  {
    // settings for QAnswer API
    let settings = {
      async: true,
      crossDomain: true,
      url:
        "http://qanswer-core1.univ-st-etienne.fr/api/qa/full?question=" +
        encodeURIComponent(x.question) +
        "&lang=" +
        x.language +
        "&kb=SNIK%2FBB&user=" +
        QANSWER_CREDENTIALS.user,
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    };

    // ask QAnswer API
    const response = await $.ajax(settings);
    // sort by desc confidence
    response.queries.sort((a, b) => b.confidence - a.confidence);
    // query chosen by QAnswer is query with highest confidence
    const qAnswerQuery = response.queries[0];

    // precision, recall, f-score etc. berechnen
    var hand = await select(x.sparql, null, "https://www.snik.eu/sparql");
    var qakg = await select(
      qAnswerQuery.query,
      null,
      "https://www.snik.eu/sparql"
    );
    var intersection = hand.filter((value) => qakg.includes(value));

    var p = intersection.length / qakg.length;
    var r = intersection.length / hand.length;

    answers.push({
      id: x.id,
      question: escapeHtml(x.question),
      confidence: qAnswerQuery.confidence,
      answers: qakg.length,
      correct: hand.length,
      correctanswers: intersection.length,
      precision: p,
      recall: r,
      fscore: (2 * p * r) / (p + r),
      qanswerquery: escapeHtml(qAnswerQuery.query),
      correctquery: escapeHtml(x.sparql),
    });
  }

  answers.sort((a, b) => a.id - b.id);
  return answers;
}

async function main() {
  const answers = await ask();
  const qas = document.getElementById("qas");
  console.log(answers);
  console.log(answers.length);
  for(let a of answers) {

    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" +
      a.id +
      "</td><td>" +
      a.question +
      "</td><td>" +
      a.confidence +
      "</td><td>" +
      a.answers +
      "</td><td>" +
      a.correct +
      "</td><td>" +
      a.correctanswers +
      "</td><td>" +
      a.precision +
      "</td><td>" +
      a.recall +
      "</td><td>" +
      a.fscore +
      "</td><td>" +
      a.qanswerquery +
      "</td><td>" +
      a.correctquery +
      "</td>";
    qas.append(tr);
  }
}
