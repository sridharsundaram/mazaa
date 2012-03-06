// Copyright Mazaa Learn 2012
// @author Sridhar Sundaram

/**
 * Swap ith and jth elements of array
 */
function swapArrayItems(array, i, j) {
  var t = array[i];
  array[i] = array[j];
  array[j] = t;  
}

/**
 * Shuffles elements of array
 * @param array
 */
function shuffle(array) {
  for (var i = 0; i < array.length - 1; i++) {
    var rnd = i + Math.floor(Math.random() * (array.length - i));
    swapArrayItems(array, i, rnd);
  }
}

/**
 * Randomly chooses numChoices indices given range low..high to choose from
 * Precondition: high - low + 1 > numChoices 
 * @param {Integer} low - low end of range inclusive
 * @param {Integer} high - high end of range inclusive
 * @param {Integer} numChoices - number of choices required
 * @param {Integer} ansIndex - index of answer
 * @return array of choice indices (no duplicates)
 */
function createChoices(low, high, numChoices, ansIndex) {
  var choiceIndices = [ansIndex];
  while (choiceIndices.length < numChoices) {
    var rnd = low + Math.floor(Math.random() * (high - low + 1));
    if (choiceIndices.indexOf(rnd) == -1) { 
      // TODO(ssundaram): this is inefficient - can be done better. 
      choiceIndices.push(rnd);
    }
  }
  return choiceIndices;
}

function QuestionAnswer() {
}

/**
 * Randomly creates numQuestions multiple-choice questions.
 * Given an array of [question, answer] pairs, outputs questions each with 
 * question, numChoices choices and answer.
 * @param {Array.<Array.<question, answer>>} qaArray - array of qa pairs
 * @param {Integer} numQuestions - number of questions to be generated
 * @param {Integer} numAnswerChoices - number of answer choices per question
 * @return {Array.<Object.<question, answer, Array.<choices>>} list of qa  
 */
QuestionAnswer.prototype.create = function(id, question, answer, opt_choices) {
  return { id: id, question: question, answer: answer, choices: opt_choices};
}

QuestionAnswer.prototype.compare = function(that) {
  return this.question == that.question &&
         this.answer == that.answer &&
         Array.equals(this.choices, that.choices);
}

var QA = new QuestionAnswer();

function createQuestions(qaArray, numQuestions, numAnswerChoices) {
  var qaList = [];
  for (var i = 0; i < numQuestions; i++) {
    // Choose the question-answer pair
    var qaIndex = i + Math.floor(Math.random() * (qaArray.length - i));
    // Generate choices - for now, we choose randomly
    var ansChoices = createChoices(0, qaArray.length - 1, numAnswerChoices,
                                   qaIndex);
    // Set up the choices
    var choices = [];
    for (var j = 0; j < numAnswerChoices; j++) {
      var choice = qaArray[ansChoices[j]].answer;
      choices.push({ choice: choice, 
                     correct: choice == qaArray[qaIndex].answer });
    }
    shuffle(choices);
    qaArray[qaIndex].choices = choices; 
    qaList.push(qaArray[qaIndex]);
    // Ensure this question-answer pair will not be used for another question.
    swapArrayItems(qaArray, i, qaIndex);
  }
  
  return qaList;
}
