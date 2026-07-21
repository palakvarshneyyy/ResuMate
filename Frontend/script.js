function buildLocalFallbackSuggestions(resumeText, jdText) {
    const resume = (resumeText || "").toLowerCase();
    const jd = (jdText || "").toLowerCase();
    const suggestions = [];
    const keywords = ["java", "spring boot", "react", "javascript", "html", "css", "python", "aws", "docker", "mysql", "sql", "git", "github"];
    const matchedKeywords = keywords.filter(function(keyword) {
        return resume.includes(keyword) && jd.includes(keyword);
    });
    const missingKeywords = keywords.filter(function(keyword) {
        return jd.includes(keyword) && !resume.includes(keyword);
    });

    if (matchedKeywords.length > 0) {
        suggestions.push("Your resume already highlights " + matchedKeywords.slice(0, 3).join(", ") + " clearly.");
    }

    if (missingKeywords.length > 0) {
        suggestions.push("Add evidence for " + missingKeywords.slice(0, 3).join(", ") + " to improve ATS alignment.");
    }

    suggestions.push("Keep formatting simple, remove irrelevant details, and emphasize measurable achievements.");
    return suggestions.join(" ");
}

async function getAISuggestions(resume, jd) {

    try {

        const response = await fetch("http://localhost:8080/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                resumeText: resume,
                jobDescription: jd
            })
        });

        if (!response.ok) {
            return buildLocalFallbackSuggestions(resume, jd);
        }

        const text = await response.text();
        return text && text.trim() ? text.trim() : buildLocalFallbackSuggestions(resume, jd);

    } catch (error) {

        console.error(error);
        return buildLocalFallbackSuggestions(resume, jd);

    }

}


const resumeInput = document.getElementById("resume");
const dropArea =
    document.getElementById(
        "dropArea"
    );
const analyzeBtn = document.getElementById("analyzeBtn");
const jobDescription = document.getElementById("jobDescription");
const uploadResumeBtn = document.getElementById("uploadResumeBtn");
const uploadIcon = document.getElementById("uploadIcon");
const uploadFileName = document.getElementById("uploadFileName");
const uploadHint = document.getElementById("uploadHint");
const uploadStatus = document.getElementById("uploadStatus");
const uploadProgressBar = document.getElementById("uploadProgressBar");

let resumeText = "";
let uploadInProgress = false;

function setUploadProgress(value) {
    if (uploadProgressBar) {
        uploadProgressBar.style.width = Math.max(0, Math.min(100, value)) + "%";
    }
}

function setUploadState(type, fileName, message, progress) {
    const stateIcon = {
        idle: "📄",
        loading: "⏳",
        success: "✅",
        error: "⚠️"
    };

    if (uploadIcon) {
        uploadIcon.textContent = stateIcon[type] || stateIcon.idle;
    }

    if (uploadFileName) {
        uploadFileName.textContent = fileName || "Drag & Drop Resume Here";
    }

    if (uploadHint) {
        uploadHint.textContent = message || "PDF or DOCX up to 5MB";
    }

    if (uploadStatus) {
        uploadStatus.textContent = message || "";
        uploadStatus.className = "upload-status " + type;
    }

    setUploadProgress(progress || 0);
}

function validateResumeFile(file) {
    const maxSize = 5 * 1024 * 1024;
    const extension = typeof window.ResumeUtils?.getFileExtension === "function"
        ? window.ResumeUtils.getFileExtension(file)
        : "";

    if (!file) {
        throw new Error("No file selected.");
    }

    if (extension !== "pdf" && extension !== "docx") {
        throw new Error("Please upload a PDF or DOCX resume.");
    }

    if (file.size > maxSize) {
        throw new Error("Resume file must be 5MB or smaller.");
    }

    return extension;
}

async function handleResumeUpload(file) {
    if (uploadInProgress) {
        return;
    }

    uploadInProgress = true;
    resumeText = "";
    analyzeBtn.disabled = true;

    try {
        const extension = validateResumeFile(file);

        setUploadState(
            "loading",
            file.name,
            "Uploading " + extension.toUpperCase() + " resume...",
            5
        );

        const text = await window.ResumeUtils.extractResumeText(
            file,
            pdfjsLib,
            null,
            function(progress) {
                setUploadProgress(progress);
            }
        );

        if (!text || text.trim() === "") {
            throw new Error("No readable text found in resume.");
        }

        resumeText = text.toLowerCase();

        setUploadState(
            "success",
            file.name,
            "Resume uploaded successfully.",
            100
        );
    } catch (error) {
        console.error(error);

        resumeText = "";
        resumeInput.value = "";

        setUploadState(
            "error",
            file && file.name ? file.name : "",
            error.message || "Unable to upload resume.",
            0
        );
    } finally {
        uploadInProgress = false;
        analyzeBtn.disabled = false;
    }
}

resumeInput.addEventListener("change", async function(event) {
    const file = event.target.files && event.target.files[0]
        ? event.target.files[0]
        : null;

    if (!file) {
        setUploadState("idle", "", "PDF or DOCX up to 5MB", 0);
        return;
    }

    await handleResumeUpload(file);
});

dropArea.addEventListener(
    "click",
    (event) => {
        if (event.target === uploadResumeBtn || uploadInProgress) {
            return;
        }

        resumeInput.click();
    }
);

if (uploadResumeBtn) {
    uploadResumeBtn.addEventListener("click", function(event) {
        event.stopPropagation();

        if (!uploadInProgress) {
            resumeInput.click();
        }
    });
}

dropArea.addEventListener(
    "dragover",
    (e) => {

        e.preventDefault();

        dropArea.classList.add(
            "dragover"
        );
    }
);

dropArea.addEventListener(
    "dragleave",
    () => {

        dropArea.classList.remove(
            "dragover"
        );
    }
);

dropArea.addEventListener(
    "drop",
    async (e) => {

        e.preventDefault();

        dropArea.classList.remove(
            "dragover"
        );

        const files = e.dataTransfer && e.dataTransfer.files
            ? e.dataTransfer.files
            : [];

        if (!files || files.length === 0) {
            setUploadState("error", "", "Please drop a PDF or DOCX resume.", 0);
            return;
        }

        if (files.length > 1) {
            setUploadState("error", "", "Please upload one resume at a time.", 0);
            return;
        }

        await handleResumeUpload(files[0]);
    }
);

analyzeBtn.addEventListener("click", async function() {


if (resumeText === "") {
    alert("Please upload a resume first with a supported PDF or DOCX file.");
    return;
}
if (
    document.getElementById(
        "candidateName"
    ).value.trim() === ""
){
    alert(
        "Please enter candidate name."
    );
    return;
}

const jdText = jobDescription.value.toLowerCase();

const skills = [
"java",
"python",
"html",
"css",
"javascript",
"react",
"angular",
"node.js",
"express",
"spring boot",
"mysql",
"sql",
"mongodb",
"aws",
"docker",
"kubernetes",
"git",
"github",
"rest api",
"linux",
"c++",
"c",
"machine learning",
"data structures",
"algorithms"
];

let matched = [];
let missing = [];

skills.forEach(function(skill) {

    if (jdText.includes(skill)) {

        if (resumeText.includes(skill)) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }

    }

});

let matchPercentage = 0;

if ((matched.length + missing.length) > 0) {
    matchPercentage =
        (matched.length / (matched.length + missing.length)) * 100;
}

let ats = Math.round(
    (matchPercentage * 0.8) +
    (matched.length * 2)
);

ats = Math.min(100, ats);

let roles = [];

if(resumeText.includes("java"))
    roles.push("Java Developer");

if(resumeText.includes("react"))
    roles.push("Frontend Developer");

if(resumeText.includes("aws"))
    roles.push("Cloud Engineer");

if(resumeText.includes("python"))
    roles.push("Python Developer");

if(roles.length === 0)
    roles.push("Software Developer");

let roadmap = "";

if(roles.includes("Java Developer")){

    roadmap =
    "1. Master Core Java\n" +
    "2. Learn Spring Boot\n" +
    "3. Build REST APIs\n" +
    "4. Learn MySQL\n" +
    "5. Deploy Projects on AWS\n" +
    "6. Become Backend Developer";
}

else if(roles.includes("Frontend Developer")){

    roadmap =
    "1. Master HTML CSS JavaScript\n" +
    "2. Learn React\n" +
    "3. Build Responsive Projects\n" +
    "4. Learn APIs\n" +
    "5. Learn State Management\n" +
    "6. Become Frontend Developer";
}

else if(roles.includes("Cloud Engineer")){

    roadmap =
    "1. Learn Linux\n" +
    "2. Learn Networking\n" +
    "3. Learn AWS Services\n" +
    "4. Learn Docker\n" +
    "5. Learn Kubernetes\n" +
    "6. Become Cloud Engineer";
}

else if(roles.includes("Python Developer")){

    roadmap =
    "1. Master Python\n" +
    "2. Learn Django/Flask\n" +
    "3. Work with Databases\n" +
    "4. Build APIs\n" +
    "5. Deploy Applications\n" +
    "6. Become Python Developer";
}

else{

    roadmap =
    "1. Learn Programming Fundamentals\n" +
    "2. Build Projects\n" +
    "3. Learn Git & GitHub\n" +
    "4. Practice DSA\n" +
    "5. Build Portfolio\n" +
    "6. Apply for Jobs";
}

let interviewQuestions = "";

if(roles.includes("Java Developer")){

    interviewQuestions =
    "1. What are the main principles of OOP?\n\n" +
    "2. Explain the difference between ArrayList and LinkedList.\n\n" +
    "3. What is Spring Boot and why is it used?\n\n" +
    "4. What are REST APIs?\n\n" +
    "5. Explain Exception Handling in Java.";
}

else if(roles.includes("Frontend Developer")){

    interviewQuestions =
    "1. What is the Virtual DOM?\n\n" +
    "2. Explain React Hooks.\n\n" +
    "3. Difference between let, const and var?\n\n" +
    "4. How do APIs work?\n\n" +
    "5. How do you optimize website performance?";
}

else if(roles.includes("Cloud Engineer")){

    interviewQuestions =
    "1. What is AWS?\n\n" +
    "2. Difference between EC2 and S3?\n\n" +
    "3. What is Docker?\n\n" +
    "4. What is Kubernetes?\n\n" +
    "5. Explain Load Balancing.";
}

else if(roles.includes("Python Developer")){

    interviewQuestions =
    "1. Difference between List and Tuple?\n\n" +
    "2. What are Python decorators?\n\n" +
    "3. What is Flask?\n\n" +
    "4. Explain Python OOP.\n\n" +
    "5. What are generators?";
}

else{

    interviewQuestions =
    "1. Tell me about yourself.\n\n" +
    "2. Explain your strongest project.\n\n" +
    "3. What are your strengths?\n\n" +
    "4. How do you solve problems?\n\n" +
    "5. Why should we hire you?";
}

const strengthsText =
    matched.length > 0
        ? "Strong skills in: " + matched.join(", ")
        : "No major strengths detected.";

const weaknessesText =
    missing.length > 0
        ? "Need improvement in: " + missing.join(", ")
        : "No major weaknesses detected.";

const candidateName =
    document.getElementById(
        "candidateName"
    ).value;

document.getElementById(
    "loadingScreen"
).style.display = "flex";

analyzeBtn.disabled = true;
analyzeBtn.textContent = "Analyzing...";

let careerPotential = Math.round(
    (ats * 0.5) +
    (matchPercentage * 0.5)
);

let readinessLevel = "";

if(careerPotential >= 85)
    readinessLevel = "🔥 Excellent";

else if(careerPotential >= 70)
    readinessLevel = "⚡ Good";

else if(careerPotential >= 50)
    readinessLevel = "📈 Average";

else
    readinessLevel = "📚 Needs Improvement";

let healthReport = [];

if(resumeText.includes("github"))
    healthReport.push("✅ GitHub Found");
else
    healthReport.push("❌ GitHub Missing");

if(resumeText.includes("linkedin"))
    healthReport.push("✅ LinkedIn Found");
else
    healthReport.push("❌ LinkedIn Missing");

if(resumeText.includes("project"))
    healthReport.push("✅ Projects Found");
else
    healthReport.push("❌ Projects Missing");

let recruiterFeedback = "";

if(ats >= 85){
    recruiterFeedback =
    "Excellent profile. Strong ATS compatibility and good alignment with the job requirements.";
}
else if(ats >= 70){
    recruiterFeedback =
    "Good profile with solid technical foundations. Adding a few missing skills could significantly improve interview chances.";
}
else{
    recruiterFeedback =
    "Profile requires improvement. Focus on missing skills, projects, and resume optimization before applying.";
}

const aiSuggestions = await getAISuggestions(
    resumeText,
    jdText
);

const analysisData = {
    candidateName: candidateName,

    careerPotential: careerPotential,

    careerReadiness: Math.min(100, Math.round((matchPercentage * 0.6) + (ats * 0.4) + 5)),
    
    careerReadinessText: readinessLevel,

    matchScore: matchPercentage.toFixed(0),

    atsScore: ats,

    matchedSkills: matched.join(", "),

    missingSkills: missing.join(", "),

    strengths: strengthsText,

    weaknesses: weaknessesText,

    suggestions: aiSuggestions,

    roles: roles.join(", "),

    roadmap: roadmap,

    interviewQuestions: interviewQuestions,

    resumeText: resumeText,

    jobDescriptionText: jdText,

    healthReport: healthReport.join("\n"),

    recruiterFeedback: recruiterFeedback
};

localStorage.setItem(
    "analysisData",
    JSON.stringify(analysisData)
);

setTimeout(function(){

    window.location.href =
        "results.html";

},500);

});
function openFeatures() {

    document.getElementById(
        "featuresModal"
    ).style.display = "block";
}

function closeFeatures() {

    document.getElementById(
        "featuresModal"
    ).style.display = "none";
}

function openAbout() {

    document.getElementById(
        "aboutModal"
    ).style.display = "block";
}

function closeAbout() {

    document.getElementById(
        "aboutModal"
    ).style.display = "none";
}

function goHome() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function scrollToUpload() {
    document.querySelector(".container").scrollIntoView({
        behavior: "smooth"
    });
}

function loadDemo() {

    document.getElementById("candidateName").value =
        "John Doe";

    document.getElementById("jobDescription").value =
        `Java Developer

Required Skills:
Java
Spring Boot
MySQL
Git
REST APIs
HTML
CSS
JavaScript`;

}

window.onclick = function(event) {

    const featuresModal =
        document.getElementById("featuresModal");

    const aboutModal =
        document.getElementById("aboutModal");

    if(event.target === featuresModal) {
        closeFeatures();
    }

    if(event.target === aboutModal) {
        closeAbout();
    }
    
};

