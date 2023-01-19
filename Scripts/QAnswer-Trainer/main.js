import { main } from "./qanswer-interaktion.js";
import { retreive_pairs } from "./fragen-einteilung.js";

$().ready(function () {
    $("#systemEvaluation").click(async () => {
        console.log("Click on systemEvaluation");
        let textbookQuestionToggle = $("#useTextbookQuestionsCheckbox").is(":checked");
        await main(textbookQuestionToggle);
    });

    $("#generatePairs").click(async () => {
        console.log("Click on generatePairs");
        await retreive_pairs();
    });
});