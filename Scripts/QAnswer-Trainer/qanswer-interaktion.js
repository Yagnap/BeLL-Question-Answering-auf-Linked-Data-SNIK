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
 * @see {@link EvaluationSingle}
 * 
 * @typedef {Object} EvaluationIteration
 * @property {number} confidence - QAnswer confidence score
 * @property {number} precision - Percentage of given answers that were correct
 * @property {number} recall - Percentage of all gold standard answers that were given
 * @property {number} fscore - Geometric middle of precision and recall
 * @property {number} count - Number of questions the system was trained with at that point
 */
/**
 * The evaluation for a single textbook question.
 * 
 * @typedef {Object} EvaluationSingle
 * @property {string} question - The natural langauge question asked
 * @property {string} correct_query - Correct SPARQL query
 * @property {string} qanswer_query - QAnswer answer SPARQL query
 * @property {number} confidence - QAnswer confidence score
 * @property {number} precision - Percentage of given answers that were correct
 * @property {number} recall - Percentage of all gold standard answers that were given
 * @property {number} fscore - Geometric middle of precision and recall
 * @property {number} answer_count_correct - Correct number of answers that the correct query produces
 * @property {number} answer_count_qanswer - Number of answers that this question produces using QAnswer's query
 * @property {number} intersection - Number of answers correct query and QAnswer query share
 * @property {number} count - Number of training questions used to train the model evaluating this question
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
 * @property {string[]} answers - Answers (bindings) for the question
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
import generatedQAPairsTraining from "./Data/generated-training.json" assert {type : "json"};
/**
 * Question-Answer-Pairs gathered from the textbook used for training
 * 
 * @type {QAPair[]}
 */
import textbookQAPairsTraining from "./Data/bb_fragen_train.json" assert {type : "json"};

/**
 * Automatically generated Question-Answer-Pairs used for evaluation
 * 
 * @type {QAPair[]}
 */
import generatedQAPairsEvaluation from "./Data/generated-testing.json" assert {type : "json"};
/**
 * Question-Answer-Pairs gathered from the textbook used for evaluation
 * 
 * @type {QAPair[]}
 */
import textbookQAPairsEvaluation from "./Data/bb_fragen_test.json" assert {type : "json"};

/**
 * Collected evaluations of automatically generated questions.
 * @see {@link evaluate_iteration}
 * @type {Array.<EvaluationIteration>}
 */
var evaluations_generated = [];
/**
 * Collected evaluations of textbook questions, sorted by natural language question.
 * @see {@link evaluate_iteration}
 * @type {Array.<string, Array.<EvaluationSingle>>}
 */
var evaluations_textbook = [];

/**
 * All correct Answers for each and every question.
 * Natural language question as keys, {@link Answers} object as data.
 * 
 * @see {@link evaluate_pair()} - Used here to check Answers.
 * @type {AnswerList}
 */
var correct_answers = [];

/**
 * Toggle for the usage of textbook question.
 * Set by some input in HTML file.
 * @see {@link main} - Used only in loop of this method.
 */
//var textbookQuestionToggle = false;

/**
 * Name of the knowledge base to test.
 * Configured in QAnswer settings.
 * Set only in here.
 * 
 * @type {string}
 * @const
 */
const kb_name = "SNIK_BB";

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
export async function main(use_textbook_question_training) {
  console.groupCollapsed("Number of QA Pairs");
  console.log("Following are the lengths of the arrays containing the QA Pairs");
  console.log("generated training: " + generatedQAPairsTraining.length);
  console.log("generated testing: " + generatedQAPairsEvaluation.length);
  console.log("textbook training: " + textbookQAPairsTraining.length);
  console.log("textbook testing: " + textbookQAPairsEvaluation.length);
  console.groupEnd();

  // retreive correct answers
  console.groupCollapsed("Retrieving correct answers from SNIK");
  await snik_retreive_correct_answers();
  console.groupEnd();
  // login
  await login();
  console.info("Logged in");
  console.info("Starting loop");
  console.time("Time required to finish loop");

  if (use_textbook_question_training) {

    console.info("Textbook are being questions used");

    // upload textbook question if required
    console.groupCollapsed("Textbuchfragen");
    for(let textbook_pair of textbookQAPairsTraining) {
      await provide_feedback(textbook_pair);
    }
    console.groupEnd();
  } else {
    console.info("No textbook questions are being used");
  }

  console.groupCollapsed("Loop");
  // 10 new questions per iteration
  for (let i = 0; i < length; i += 10) {

    // Start of a (collapsed) console group.
    console.groupCollapsed("Fragenanzahl: " + i + "; Lehrbuchfragen: " + use_textbook_question_training);

    // number of questions to add
    let count = 10;

    // Define how many questions should be added, when
    // (a) The array is almost at its end
    // (b) The test just started, meaning no questions should be used for training.
    // Default: count stays 10
    if ((i + 10) >= length) {
      count = length - i; // i.e. 1003 - 990 = 13 to add
      i = length; // for evaluation purposes
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
    await evaluate_iteration(i);
  }
  console.groupEnd();

  console.timeEnd("Time required to finish loop");
  console.info("Loop finished");

  // Evaluation of whole iteration for the textbook questions
  let csv_textbook = textbook_csv_generation();
  let csv_generated = generated_csv_generation();

  // whether or not textbook questions were used for training
  let file_name_append = use_textbook_question_training ? "-withtb" : "";
  // output
  output("Textbuchfragen", "textbook" + file_name_append + ".csv", csv_textbook, "text/csv");
  output("Automatisch generierte Textbuchfragen", "generated" + file_name_append + ".csv", csv_generated, "text/csv");

  // reset model AND questions, in case method is called multiple times
  await reset_model();
  await reset_qapairs();

  console.info("Model reset and all feedback removed");
}

/**
 * Retreives bindings from the given answers to the questions.
 * @see {@link correct_answers}
 */
async function snik_retreive_correct_answers() {
  for (let pair of generatedQAPairsEvaluation) {
    correct_answers[pair.question] = {
      sparql: pair.answer,
      answers: await select(pair.answer, null, "https://www.snik.eu/sparql")
    };
  }
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

  const body = {
    "usernameOrEmail": QANSWER_CREDENTIALS.user,
    "password": QANSWER_CREDENTIALS.password
  };
  const url = "https://app.qanswer.ai/api/user/signin";
  const settings = {
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
    },
	"body": JSON.stringify(body),
  };
	console.log(JSON.stringify(settings));
	const response = await fetch(url, settings);
	const json = await response.json();
    token = json.accessToken;
}

/**
 * Uploads one question-answer pair with parameters.
 * 
 * API called: /api/feedback/create
 * 
 * @param {QAPair} question_answer_pair Object containing question-answer-pair to evaluate, question and answer 
 */
async function provide_feedback(question_answer_pair) {

  let nl_question = question_answer_pair.question;
  let correct_answer = question_answer_pair.answer;

  // log to pair console
  console.log(`Question: ${nl_question}\nAnswer: ${correct_answer}`);

  // arguments for api call settings
  const body = {
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

    const url = "https://app.qanswer.ai/api/feedback/create";
  // settings for api call
  const settings = {
    "method": "POST",
    "headers": {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "processData": false,
    },
      "body": JSON.stringify(body)
  };

  // api call
  const response = await fetch(url, settings);
const json = await response.json();
}

/**
 * Trains the model with the feedback provided before.
 * 
 * API called: /api/feedback/train
 */
async function train_model() {
  const body = [kb_name];
    const url = "https://app.qanswer.ai/api/feedback/train";
  const settings = {
    "crossDomain": true,
    "method": "GET",
    "headers": {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "processData": false,
    },
    "dataType": "jsonp",
      "body": JSON.stringify(body)
  };

  const response = await fetch(url, settings);
const json = await response.json();
}

/**
 * Resets the ML model of the Dataset to the default ones.
 * 
 * API called: /api/dataset/set_default_model
 */
async function reset_model() {
   const url = "https://app.qanswer.ai/api/dataset/set_default_model?kbs="+kb_name;
  const settings = {
    "crossDomain": true,
    "method": "POST",
    "headers": {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "processData": false,
    },
    "dataType": "jsonp",
  };

  const response = await fetch(url, settings);
const json = await response.json();
}

/**
 * Removes all feedback given.
 * 
 * API called: ​/api​/feedback​/remove-all-questions
 */
async function reset_qapairs() {
  const body = { knowledgeGraphs: [kb_name]};
  const url = "https://app.qanswer.ai/api/feedback/remove-all-questions";
  const settings = {
    "crossDomain": true,
    "method": "POST",
    "headers": {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "processData": false,
    },
      "body": JSON.stringify(body),
    "dataType": "jsonp"
  };

  const response = await fetch(url, settings);
const json = await response.json();
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

  const body = {
    question: nl_question,
    lang: "en",
    kb: [kb_name],
    user: [QANSWER_CREDENTIALS.user]
  };

   const url = "https://app.qanswer.ai/api/qa/full";
  const settings = {
    "crossDomain": true,
    "method": "GET",
    "headers": {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "processData": false
    },
      "body": JSON.stringify(body),
    "dataType": "jsonp"
  };

  // ask QAnswer API
  const response = await fetch(url, settings);
  const json = await response.json();
  // sort by desc confidence --> highest confidence at index 0
  // response.queries contains all queries QAnswer finds
  json.queries.sort((a, b) => b.confidence - a.confidence);
  // query chosen by QAnswer is query with highest confidence
  let qanswer_query = json.queries[0];

  let ret = {
    answer: qanswer_query.query,
    confidence: qanswer_query.confidence
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
 * @param {number} number_of_questions - The total number of generated training questions used to train the model
 * @returns {EvaluationSingle} Evaluation of the pair, containing all details (in case it is a textbook question)
 * 
 * @see {@link evaluate_iteration()}
 */
async function evaluate_pair(question_answer_pair, number_of_questions) {

  let nl_question = question_answer_pair.question;
  let correct_answer = question_answer_pair.answer;

  // Asking QAnswer question
  let qAnswer_answer = ask_qanswer(nl_question);

  // all answers both queries produce
  let all_correct_answers = correct_answers[nl_question];
  let all_qanswer_answers = await select(qAnswer_answer.sparql, null, "https://www.snik.eu/sparql");

  // All answers contained in both queries. Do not need to check for duplicates because of keyword DISTINCT.
  let intersection_of_answers = intersect(all_correct_answers, all_qanswer_answers);

  let intersection_length = intersection_of_answers.length;
  let correct_length = all_correct_answers.length;
  let qanswer_length = all_qanswer_answers.length;

  // calculating precision, recall, fscore - if answer set of one is empty, then the indicator using it is also set to 0
  let _precision = qanswer_length == 0 ? 0 : intersection_length / qanswer_length;
  let _recall = correct_length == 0 ? 0 : intersection_length / correct_length;
  let _fscore = (_precision + _recall) == 0 ? 0 : (2 * _precision * _recall) / (_precision + _recall);

  let evaluation = {
    question: nl_question,
    correct_query: correct_answer,
    qanswer_query: qAnswer_answer.sparql,
    confidence: qAnswer_answer.confidence,
    precision: _precision,
    recall: _recall,
    fscore: _fscore,
    answer_count_correct: all_correct_answers.length,
    answer_count_qanswer: all_qanswer_answers.length,
    intersection: intersection_length,
    count: number_of_questions
  };

  return evaluation;
}

/**
 * Evaluates the performacne of all testing questions on the more or less trained system
 * 
 * @param {number} number_of_questions - Total number of questions present in this round
 */
async function evaluate_iteration(number_of_questions) {

  // for averaging key indicators for auto-generated pairs
  let evaluation_generated = {
    confidence: 0,
    precision: 0,
    recall: 0,
    fscore: 0,
    count: number_of_questions
  }
  let i = 0;

  // automatically generated less detailed, mainly used to generate data to evaluate performance of key indicators
  for (let pair of generatedQAPairsEvaluation) {
    let pair_evaluation = evaluate_pair(pair, number_of_questions);
    evaluation_generated.confidence += pair_evaluation.confidence;
    evaluation_generated.precision += pair_evaluation.precision;
    evaluation_generated.recall += pair_evaluation.precision;
    evaluation_generated.fscore += pair_evaluation.precision;
    i++;
  }

  // textbook questions more detailed, looking at the individual quetsions more thorughly
  for (let pair of textbookQAPairsEvaluation) {
    let pair_evaluation = evaluate_pair(pair, number_of_questions);

    evaluations_textbook[pair.question].push(pair_evaluation);
  }

  // averaging and outputs
  evaluation_generated.confidence /= i;
  evaluation_generated.precision /= i;
  evaluation_generated.recall /= i;
  evaluation_generated.fscore /= i;
  evaluation_generated.push(evaluations_generated);

}

/**
 * Generating the CSV table for the textbook questions.
 * @returns {string} of CSV data
 */
function textbook_csv_generation() {
  let csv = "";
  // each textbook question represented in key of array
  for (let key in evaluations_textbook.keys()) {
    /** @type {Array.<EvaluationSingle>} */
    let question_evaluation = evaluations_textbook[key];

    // new header for each question
    csv += "Frage,Anzahl Trainingsfragen,Richtige Antwort,QAnswer-Antwort,Confidence,Precision,Recall,F-Score,Richtige Anzahl,QAnswer Anzahl,Schnittmenge\n";

    // each round represented
    for (/** @type {EvaluationSingle} */ let round of question_evaluation) {
      csv += round.question + ","
        + round.count + ","
        + round.correct_query + ","
        + round.qanswer_query + ","
        + round.confidence + ","
        + round.precision + ","
        + round.recall + ","
        + round.fscore + ","
        + round.answer_count_correct + ","
        + round.answer_count_qanswer + ", "
        + round.intersection + "\n";
    }
  }
  return csv;
}

/**
 * Generating the CSV table for the averaged out key indicators of the generated questions.
 * @returns {string} of CSV data
 */
function generated_csv_generation() {
  let csv = "";

  // new header for each question
  csv += "Frage,Anzahl Trainingsfragen,Confidence,Precision,Recall,F-Score\n";

  // each round represented
  for (let round of evaluations_generated) {
    csv += round.count + ","
      + round.confidence + ","
      + round.precision + ","
      + round.recall + ","
      + round.fscore + "\n";
  }
}

/**
 * Creates Paragraph and Button downloading the created data when clicked
 * 
 * @param {string} button_label - The label for the button that downloads the data
 * @param {string} file_name - Name that the file to download should have INCLUDING file extension
 * @param {string} data - The data that is downloaded
 * @param {string} datatype - Type of the data, i.e. "text/csv" or "application/json"
 */
export function output(button_label, file_name, data, datatype) {

  console.info(`Creating button with label ${button_label}, which will download the file ${file_name}`);

  // creating div that button and 
  const output_wrapper = document.getElementById("output-wrapper");
  const parent_div = document.createElement("div");
  parent_div.setAttribute("name", file_name)
  output_wrapper.append(parent_div);

  // creating URL for file to download
  const blob = new Blob([data], { type: datatype });
  let url = window.URL.createObjectURL(blob);

  // create <a></a>
  const anchor = document.createElement("a");
  anchor.setAttribute("name", file_name);
  anchor.setAttribute("href", url);
  anchor.setAttribute("download", file_name);

  // creates descriptive paragraph/label
  const description = document.createElement("p");
  description.innerHTML = button_label;

  // creates button
  const button = document.createElement("button");
  button.innerHTML = "Download";
  button.onclick = function () {
    // downloads file
    anchor.click();
  };

  // add all to parent div as children
  parent_div.append(description, button);

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

  for (let binding of bindings1) {
    for (let key of Object.keys(binding)) {
      b1.push(binding[key]["value"]);
    }
  }

  for (let binding of bindings2) {
    for (let key of Object.keys(binding)) {
      b2.push(binding[key]["value"]);
    }
  }

  var intersection = b1.filter((value) => b2.includes(value));
  return intersection;

}
