/** 
 * Automatically trains and evaluates QAnswer KG using the API documented at:
 * https://app.qanswer.ai/swagger-ui.html
 * 
 * QAnswer: https://app.qanswer.ai/qa-systems
 * (formerly https://qanswer-frontend.univ-st-etienne.fr/)
 * 
 * QAnswer is trained with simple natural language questions and answers in SPARQL leading to the required solution,
 * automatically generated from SNIK.
 * Also, there are a some questions from textbooks, which are also used to train the model.
 * To measure the effects of the training, the number of questions is to be incremented from 0 to the total amount,
 * minus 100 quetsions used for evaluation.
 * The usage of textbook quetions is toggleable.
 * 
 * @author Hannes R. Brunsch
 * 
 */

// type definitions for documentation
/**
 * A response from QAnswer after it being asked a question.
 * @typedef {Object} QAnswerAnswer
 * @property {string} sparql - The SPARQL query QAnswer generated
 * @property {number} confidence - QAnswer's confidence in the answer
 */
/**
 * The evaluation for a single generated question.
 * Contains less data than {@link EvaluationSingle}.
 * @see {@link EvaluationSingleTB}
 * 
 * @typedef {Object} EvaluationSingle
 * @property {number} confidence - QAnswer confidence score
 * @property {number} precision - Percentage of given answers that were correct
 * @property {number} recall - Percentage of all gold standard answers that were given
 * @property {number} fscore - Geometric middle of precision and recall
 */
/**
 * The evaluation for a single textbook question.
 * Contains more data than {@link EvaluationSingle}.
 * @see {@link EvaluationSingle}
 * 
 * @typedef {Object} EvaluationSingleTB
 * @property {string} question - The natural langauge question asked
 * @property {string} correctQuery - Correct SPARQL query
 * @property {string} qAnswerQuery - QAnswer answer SPARQL query
 * @property {number} confidence - QAnswer confidence score
 * @property {number} precision - Percentage of given answers that were correct
 * @property {number} recall - Percentage of all gold standard answers that were given
 * @property {number} fscore - Geometric middle of precision and recall
 * @property {number} intersection - Number of answers correct query and QAnswer query share
 */
/**
 * A Question-Answer-Pair.
 * 
 * @typedef {Object} QAPair
 * @property {string} question - Natural language Question
 * @property {string} answer - SPARQL query answer
 */
/**
 * All answers for a singular question.
 * Only to be used with {@link AnswerList}.
 * @see {@link correct_answers}
 * 
 * @typedef {Object} Answers
 * @property {string} sparql - Correct SPARQL-Query
 * @property {string[]} answers - Answers (URIs) for the question
 */
/**
 * List of {@link Answers}.
 * Natural language key refers to {@link Answers} object.
 * @see {@link Answers}
 * 
 * @typedef {Object.<string, Answers>} AnswerList
 */

/**
 * QAnswer verification token required for identification to the API.
 * Effectively a constant, should NOT be changed by anything other than the login method.
 * @see {@link login()} - Set when signing into the application.
 */
var token;

/**
 * Automatically generated Question-Answer-Pairs used for training
 * 
 * @type {QAPair[]}
 */
var generatedQAPairsTraining = [];
/**
 * Question-Answer-Pairs gathered from the textbook used for training
 * 
 * @type {QAPair[]}
 */
var textbookQAPairsTraining = [];

/**
 * Automatically generated Question-Answer-Pairs used for evaluation
 * 
 * @type {QAPair[]}
 */
var generatedQAPairsEvaluation = [];
/**
 * Question-Answer-Pairs gathered from the textbook used for evaluation
 * 
 * @type {QAPair[]}
 */
var textbookQAPairsEvaluation = [];

/**
 * All correct Answers for each and every question.
 * Natural language question as keys, {@link Answers} object as data.
 * 
 * @see {@link evaluate_pair()} - Used here to check Answers.
 * @type {AnswerList}
 */
var correct_answers = {};

/**
 * Toggle for the usage of textbook question.
 * Set by some input in HTML file.
 * @see {@link main} - Used only in loop of this method.
 */
var textbookQuestionToggle = false;

/**
 * Name of the knowledge base to test.
 * Configured in QAnswer settings.
 * Set only in here.
 * 
 * @type {string}
 * @const
 */
const kb_name = "snik_bb_autotest";

/**
 * Main function called by button clicked in index.php
 * Contains whole pipeline for:
 * 
 * 0. Retreive correct answers from SNIK
 * 1. Log into the API to gather the verification token
 * 2. Repeat the following, incrementing the number of automatically generated questions each run
 *      a. Upload feedback (question-answer-pairs) one by one
 *      b. Training
 *      c. Evaluation
 *      d. Reset model
 * 3. Evaluation of evaluations
 * 4. Output
 * 
 * @see {@link snik_retreive_correct_answers()} for step 0
 * @see {@link login()} for step 1
 * @see {@link provide_feedback()} for step 2a
 * @see {@link train_model()} for step 2b
 * @see {@link evaluatie_iteration()} for step 2c
 * @see {@link reset_model()} for step 2d
 * @see {@link final_evaluation()} for step 3
 */
async function main() {

  // retreive correct answers
  await snik_retreive_correct_answers();

  // login
  await login();
  console.info("Logged in");
  console.info("Starting loop");
  console.time("Time required to finish loop");

  // 10 new questions per iteration
  for (let i = 0; i < generatedQAPairsTraining.length; i += 10) {

    // Start of a (collapsed) console group.
    console.groupCollapsed("Fragenanzahl: " + i + "; Lehrbuchfragen: " + textbookQuestionToggle);

    // number of questions to add
    let count = 10;

    // Define how many questions should be added, when
    // (a) The array is almost at its end
    // (b) The test just started, meaning no questions should be used for training.
    // Default: count stays 10
    if ((i + 10) >= generatedQAPairsTraining.length) {
      count = generatedQAPairsTraining.length - i; // i.e. 1003 - 990 = 13 to add
    } else if (i == 0) {
      count = 0; // no questions added at all
    }
    console.info("Count of " + count + " QA-pairs to upload, making a total of " + (count + i) + " pairs");

    // add questions (feedback) individually
    // when count = 0, no questions are provided feedback for at all.
    // Questions already provided feedback for will stay
    console.groupCollapsed("Questions-Answer-Pairs");
    for (j = 0; j < count; j++) {
      await provide_feedback(generatedQAPairsTraining[i + j]);
    }
    console.groupEnd();


    // Reset model
    await reset_model();
    console.info("Model reset");

    // End of console group for amount of questions.
    console.groupEnd();

    // Evaluation of step

  }

  console.timeEnd("Time required to finish loop");
  console.info("Loop finished");

  // Evaluation of whole iteration

}

async function snik_retreive_correct_answers() {

}

/**
 * Logs into QAnswer to obtain the verification token.
 * @see {@link token} Set by this method.
 * @see QANSWER_CREDENTIALS Array containing username and password has to be provided.
 * 
 * API called: /api/user/signin
 * 
 */
async function login() {

  let args = {
    "usernameOrEmail": QANSWER_CREDENTIALS.user,
    "password": QANSWER_CREDENTIALS.password
  }
  let settings = {
    async: true,
    crossDomain: true,
    url: "http://app.qanswer.ai/api/user/signin",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      processData: false,
      data: args
    }
  };

  $.ajax(settings).done(function (response) {
    token = response.accessToken;
  });
}

/**
 * Uploads one question-answer pair with parameters.
 * 
 * API called: /api/feedback/create
 * 
 * @param {array} question_answer_pair Object containing question-answer-pair to evaluate, question and answer 
 */
async function provide_feedback(question_answer_pair) {

  let nl_question = question_answer_pair.question;
  let correct_answer = question_answer_pair.answer;

  // log to pair console
  console.log(`Question: ${nl_question}\nAnswer: ${correct_answer}`);

  // arguments for api call settings
  let args = {
    correct: true,
    knowledgebase: [kb_name],
    language: ["en"],
    question: nl_question,
    questionId: -1,
    sparql: correct_answer,
    sparqlKB: kb_name,
    user: QANSWER_CREDENTIALS.user,
    validated: true
  };

  // settings for api call
  let settings = {
    async: true,
    crossDomain: true,
    url: "http://app.qanswer.ai/api/feedback/create",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      processData: false,
      data: args
    }
  };

  // api call
  await $.ajax(settings);
}

/**
 * Trains the model with the feedback provided before.
 * 
 * API called: /api/feedback/train
 */
async function train_model() {
  let args = [kb_name];
  let settings = {
    async: true,
    crossDomain: true,
    url: "http://app.qanswer.ai/api/feedback/train",
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      processData: false,
      data: args
    }
  };

  await $.ajax(settings);
}

/**
 * Resets the ML model of the Dataset to the default ones.
 * 
 * API called: /api/dataset/set_default_model
 */
async function reset_model() {
  let args = [kb_name];
  let settings = {
    async: true,
    crossDomain: true,
    url: "http://app.qanswer.ai/api/dataset/set_default_model",
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      processData: false,
      data: args
    }
  };

  await $.ajax(settings);
}

/**
 * Asks a question to QAnswer.
 * 
 * API called: /api/qa/full
 * 
 * @param {string} nl_question Natural language question to ask.
 * @returns {QAnswerAnswer} Answer with most confidence as an object
 * 
 */
async function ask_qanswer(nl_question) {

  let args = {
    question: nl_question,
    lang: "en",
    kb: [kb_name],
    user: [QANSWER_CREDENTIALS.user]
  };

  let settings = {
    async: true,
    crossDomain: true,
    url: "http://app.qanswer.ai/api/qa/full",
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      processData: false,
      data: args
    }
  };

  // ask QAnswer API
  let response = await $.ajax(settings);
  // sort by desc confidence --> highest confidence at index 0
  // response.queries contains all queries QAnswer finds
  response.queries.sort((a, b) => b.confidence - a.confidence);
  // query chosen by QAnswer is query with highest confidence
  let qAnswerQuery = response.queries[0];

  let ret = {
    answer: qAnswerQuery.query,
    confidence: qAnswerQuery.confidence
  };

  return ret;

}

/**
 * Evaluates the performance of a single question-answer-pair on both QAnswer and SNIK.
 * Returns array of key indicators.
 *  
 * @param {QAPair} question_answer_pair - One-dimensional array containing question-answer-pair to evaluate,
 * the first index (0) containing the natural language question as a string,
 * the second one (1) containing the answer (as a SPARQL query) as a string.
 * @returns {EvaluationSingleTB} Evaluation of the pair, containing all details (in case it is a textbook question)
 * 
 * @see evaluate_iteration()
 */
async function evaluate_pair(question_answer_pair) {

  let nl_question = question_answer_pair.question;
  let correct_answer = question_answer_pair.answer;

  // Asking QAnswer question
  let qAnswer_answer = ask_qanswer(nl_question);

  // all answers both queries produce
  let all_correct_answers = correct_answers[nl_question];
  let all_qanswer_answers = await select(qAnswer_answer.sparql, null, "https://www.snik.eu/sparql/");

  // All answers contained in both queries. Do not need to check for duplicates because of keyword DISTINCT.
  let intersection_of_answers = all_correct_answers.filter(x => all_qanswer_answers.includes(x));

  let intersection_length = intersection_of_answers.length;
  let correct_length = all_correct_answers.length;
  let qanswer_length = all_qanswer_answers.length;

  // calculating precision, recall, fscore - if answer set of one is empty, then the indicator using it is also set to 0
  let _precision = qanswer_length == 0 ? 0 : intersection_length / qanswer_length;
  let _recall = correct_length == 0 ? 0 : intersection_length / correct_length;
  let _fscore = (_precision + _recall) == 0 ? 0 : (2 * _precision * _recall) / (_precision + _recall);

  let evaluation = {
    question: nl_question,
    correctquery: correct_answer,
    qanswerquery: qAnswerAnswer.sparql,
    confidence: qAnswerAnswer.confidence,
    precision: _precision,
    recall: _recall,
    fscore: _fscore,
    intersection: intersection_length
  };

  return evaluation;
}

/**
 * Evaluates the performacne of all testing questions on the more or less trained system
 */
async function evaluate_iteration() {

  // later filled with evaluations of QA-Pairs
  let collected_evaluations = array();

  for (let pair of generatedQAPairsEvaluation) {

    pair_evaluation = evaluate_pair(pair);


  }
}

/**
 * Averages key indicators.
 */
async function final_evaluation() {

}

/**
 * Finds all common elements of two binding objects.
 * No need to check for duplicates, since the keyword DISTINCT is used.
 * Only one value for each query, since these are simple questions.
 * 
 * @param {Object} bindings1 
 * @param {Object} bindings2 
 * @returns URIs that bindings1 and bindings2 have in common.
 */
function intersect(bindings1, bindings2) {

  // leere Arrays, aus denen später die Schnittmenge gebildet werden soll
  var b1 = [];
  var b2 = [];

  for(let binding of bindings1) {
    for(let key of Object.keys(binding)) {
      b1.push(binding[key]["value"]);
    }
  }

  for(let binding of bindings2) {
    for(let key of Object.keys(binding)) {
      b2.push(binding[key]["value"]);
    }
  }

  var intersection = b1.filter((value) => b2.includes(value));
  return intersection;

}

/**
 * Escapes characters which could damage the layout of an HTML page
 * 
 * @param {string} unsafe - String containing possibly unsafe characters
 * @returns {string} with some characters escaped
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}