const data =
JSON.parse(
localStorage.getItem("analysisData")
);

let questions = [];

if(!data || !data.roles){

questions = [

"Complete a resume analysis first to receive role-specific questions.",

"Tell me about your strongest project.",

"What skills are you currently improving?",

"How do you approach solving technical problems?",

"Why are you interested in this role?"

];

}

else if(data.roles.includes("Java")){

questions = [

"What are the main principles of OOP?",

"Difference between ArrayList and LinkedList?",

"What is Spring Boot?",

"What are REST APIs?",

"Explain Exception Handling in Java."

];

}

else if(data.roles.includes("Python")){

questions = [

"What are Python decorators?",

"Difference between List and Tuple?",

"What is Pandas?",

"What is NumPy?",

"Explain OOP in Python."

];

}

else{

questions = [

"Tell me about yourself.",

"What are your strengths?",

"Why should we hire you?",

"Describe a project you worked on.",

"Where do you see yourself in 5 years?"

];

}

let current = 0;

let timeLeft = 60;

const timer =
document.getElementById("timer");

setInterval(function(){

    if(timeLeft > 0){

        timeLeft--;

        timer.textContent =
        "⏳ " + timeLeft + "s";

    }

},1000);

const questionText =
document.getElementById(
"questionText"
);

const questionNumber =
document.getElementById(
"questionNumber"
);

function loadQuestion(){

questionText.textContent =
questions[current];

questionNumber.textContent =
"Question " +
(current + 1) +
" of " +
questions.length;

}

loadQuestion();

document.getElementById(
"nextBtn"
).addEventListener(
"click",
function(){

current++;

timeLeft = 60;

if(current < questions.length){

loadQuestion();

document.getElementById(
"answerBox"
).value = "";

}

else{

questionText.innerHTML =
"🎉 Mock Interview Completed!";

questionNumber.innerHTML =
"Great Job";

document.getElementById(
"nextBtn"
).style.display =
"none";

}

});
