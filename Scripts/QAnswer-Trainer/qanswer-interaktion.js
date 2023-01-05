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


/**
 * QAnswer verification token required for identification to the API.
 * Effectively a constant, should NOT be changed by anything other than the login method.
 * @see login Set when signing into the application.
 */
var token;

/**
 * Question-Answer-Pairs in the form:
 * 	
 * let single_qa_pair = [
 *  "Natural language question", "Answer as a SPARQL query"
 * ]
 * 
 */
var generatedQAPairsTraining = {};
var textbookQAPairsTraining = {};

/**
 * Question-answer-pairs used for evaluation, form:
 *  {
 *      "question": "string",
 *      "answerSparql": "string"
 *  }
 * 
 */
var textbookQAPairsEvaluation = {};
var generatedQAPairsEvaluation = {};


/**
 * Toggle for the usage of textbook question.
 * Set by some input in HTML file.
 * @see main Used only in loop of this method.
 */
var textbookQuestionToggle = false;

/**
 * Name of the knowledge base to test.
 * Configured in QAnswer settings.
 * Set only in here.
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
 */
async function main() {



    // login
    await login();
    console.info("Logged in");
    console.info("Starting loop");
    console.time("Time required to finish loop");
    
    // 10 new questions per iteration
    for(let i = 0; i < generatedQAPairsTraining.length; i += 10) {

        // Start of a (collapsed) console group.
        console.groupCollapsed("Fragenanzahl: " + i + "; Lehrbuchfragen: " + textbookQuestionToggle);

        // number of questions to add
        let count = 10;

        // Define how many questions should be added, when
        // (a) The array is almost at its end
        // (b) The test just started, meaning no questions should be used for training.
        // Default: count stays 10
        if((i + 10) >= generatedQAPairsTraining.length) {
            count = generatedQAPairsTraining.length - i; // i.e. 1003 - 990 = 13 to add
        } else if(i == 0) {
            count = 0; // no questions added at all
        }
        console.info("Count of " + count + " QA-pairs to upload, making a total of " + (count +  i) + " pairs");

        // add questions (feedback) individually
        // when count = 0, no questions are provided feedback for at all.
        // Questions already provided feedback for will stay
        console.groupCollapsed("Questions-Answer-Pairs");
        for(j = 0; j < count; j++) {
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

/**
 * Logs into QAnswer to obtain the verification token.
 * @see token Set by this method.
 * @see QANSWER_CREDENTIALS Array containing username and password has to be provided.
 * 
 * API called: /api/user/signin
 * 
 */
async function login() {
    let settings = {
        async: true,
        crossDomain: true,
        url: "http://app.qanswer.ai/api/user/signin",
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
}

/**
 * Uploads one question-answer pair with parameters.
 * 
 * API called: /api/feedback/create
 * 
 * @param {array} question_answer_pair One-dimensional array containing question-answer-pair to evaluate,
 * the first index (0) containing the natural language question as a string,
 * the second one (1) containing the answer (as a SPARQL query) as a string.
 */
async function provide_feedback(question_answer_pair) {

    let question = question_answer_pair[0];
    let answer = question_answer_pair[1];
    
    // log to pair console
    console.log(`Question: ${question}\nAnswer: ${answer}`);

    // arguments for api call settings
    let args = `"context": [
      "correct": true,
      "knowledgebase": [
        ${kb_name}
      ],
      "language": [
        "en"
      ],
      "question": ${question},
      "questionId": -1,
      "sparql": ${answer},
      "sparqlKB": ${kb_name}",
      "user": ${QANSWER_CREDENTIALS.user},
      "validated": true
    ]`;

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
  let args = [ kb_name ];
  let settings = {
    async: true,
    crossDomain: true,
    url: "http://app.qanswer.ai/api/feedback/create",
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
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
  let args = [ kb_name ];
  let settings = {
    async: true,
    crossDomain: true,
    url: "http://app.qanswer.ai/api/dataset/set_default_model",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      processData: false,
      data: args
    }
  };

  await $.ajax(settings);
}

/**
 * Evaluates the performance of a single question-answer-pair on both QAnswer and SNIK.
 * Returns array of key indicators.
 *  
 * @param {array} question_answer_pair One-dimensional array containing question-answer-pair to evaluate,
 * the first index (0) containing the natural language question as a string,
 * the second one (1) containing the answer (as a SPARQL query) as a string.
 */
async function eval_pair(question_answer_pair) {

}