function limitText(text, maxLength) {
    return text.length > maxLength
        ? text.slice(0, maxLength)
        : text;
}

function renderTopStrengths(container, text) {
    const strengthItems = (text || "")
        .replace(/^Strong skills in:\s*/i, "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 4);

    if (!container) {
        return;
    }

    if (strengthItems.length) {
        container.innerHTML = `
            <div class="strength-list-items">
                ${strengthItems.map(item => `
                    <div class="strength-item">
                        <span class="strength-badge">
                            <i data-lucide="check"></i>
                        </span>
                        <span>${item}</span>
                    </div>
                `).join("")}
            </div>
        `;
    } else {
        container.innerHTML = '<div class="strength-empty">No major strengths detected.</div>';
    }

    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");
}

function formatSuggestionText(text) {
    const rawText = String(text || "").trim();

    if (!rawText) {
        return "<p>No guidance available yet.</p>";
    }

    const paragraphs = rawText
        .split(/\n{2,}/)
        .map(part => part.trim())
        .filter(Boolean);

    const keywords = [
        "ATS", "skills", "projects", "keywords", "resume", "role",
        "match", "improve", "strength", "career", "interview",
        "confidence", "experience", "summary", "metrics"
    ];

    return paragraphs.map(paragraph => {
        const escaped = escapeHTML(paragraph).replace(/\n/g, "<br>");
        return `<p>${escaped.replace(/\b(${keywords.join("|")})\b/gi, "<strong>$1</strong>")}</p>`;
    }).join("");
}

function renderAISuggestions(container, text) {
    const formatted = formatSuggestionText(text);
    if (container) {
        container.innerHTML = formatted;
    }
    const panel = document.getElementById("aiSuggestionsPanel");
    if (panel) {
        panel.innerHTML = formatted;
    }
}

function buildFallbackSuggestions(data) {
    const role = (data.roles || "target role")
        .split(",")[0]
        .trim();

    const missingSkills = (data.missingSkills || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 3);

    const strengths = (data.strengths || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 3);

    const parts = [];

    if (strengths.length) {
        parts.push(
            `Your resume already shows strong strength in ${strengths.join(", ")}.`
        );
    }

    if (missingSkills.length) {
        parts.push(
            `To improve your match, add more evidence for ${missingSkills.join(", ")}.`
        );
    }

    parts.push(
        `Tailor your summary and bullet points with role-specific keywords so ATS can clearly recognize your fit for ${role}.`
    );
    parts.push(
        `Focus on 2–3 measurable achievements and keep formatting clean, simple, and easy to scan.`
    );

    return parts.join(" ");
}

function getAIErrorMessage(error) {
    if (!error) {
        return "AI suggestions are temporarily unavailable. Please try again later.";
    }

    if (error.message) {
        return "AI suggestions failed: " + error.message;
    }

    return "AI suggestions are temporarily unavailable. Please try again later.";
}

async function getAISuggestions(resume, jd) {
    const trimmedResume = limitText(resume || "", 7000);
    const trimmedJd = limitText(jd || "", 3000);

    try {
        const response = await fetch("http://localhost:8080/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                resumeText: trimmedResume,
                jobDescription: trimmedJd
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Backend analysis request failed.");
        }

        const text = await response.text();
        return text || "AI suggestions could not be generated right now.";
    } catch (error) {
        console.error(error);
        return getAIErrorMessage(error);
    }
}

// Helper function to update circular progress rings with conic-gradient animation
function updateProgressRing(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Find the parent progress-ring div
    const progressRing = element.closest('.progress-ring');
    if (!progressRing) return;

    // Determine the color based on the progress-ring class
    const colorMap = {
        'progress-ring-blue': '#60a5fa',
        'progress-ring-purple': '#a78bfa',
        'progress-ring-green': '#4ade80',
        'progress-ring-orange': '#fbbf24'
    };

    let color = '#60a5fa'; // default blue
    for (const [className, hexColor] of Object.entries(colorMap)) {
        if (progressRing.classList.contains(className)) {
            color = hexColor;
            break;
        }
    }

    // Calculate angle: percentage * 3.6 degrees (360 / 100)
    const angle = (percentage / 100) * 360;

    // Animate from 0 to final angle using requestAnimationFrame for smooth progress
    let currentAngle = 0;
    const animationDuration = 800; // milliseconds
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        currentAngle = angle * progress;

        progressRing.style.background = `conic-gradient(${color} 0deg ${currentAngle}deg, rgba(255,255,255,0.1) ${currentAngle}deg)`;

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

const rawData = localStorage.getItem("analysisData");
const data = rawData ? JSON.parse(rawData) : null;

if (data && typeof data === "object") {

    const progressBar =
        document.getElementById("progressBar");

    const progressText =
        document.getElementById("progressText");

    setTimeout(() => {

        progressBar.style.width = "15%";
        progressText.textContent =
            "Matching skills...";

        document.getElementById("matchedSkills").textContent =
            data.matchedSkills || "No matched skills found.";

        document.getElementById("skillsCount").textContent =
            data.matchedSkills
                ? data.matchedSkills.split(",").length
                : 0;

    }, 80);

    setTimeout(() => {

        progressBar.style.width = "30%";
        progressText.textContent =
            "Finding missing skills...";

        document.getElementById("missingSkills").textContent =
            data.missingSkills || "No major gaps found.";

        document.getElementById("missingCount").textContent =
            data.missingSkills
                ? data.missingSkills.split(",").length
                : 0;

    }, 180);

    setTimeout(() => {

        progressBar.style.width = "45%";
        progressText.textContent =
            "Calculating match score...";

        const matchScore = data.matchScore || 0;
        document.getElementById("quickMatch").textContent =
            matchScore + "%";

        document.getElementById("score").textContent =
            matchScore + "%";

        document.getElementById(
    "matchBar"
).style.width =
    matchScore + "%";

        // Update circular progress ring
        updateProgressRing("quickMatch", matchScore);    

    }, 260);

    setTimeout(() => {

        progressBar.style.width = "60%";
        progressText.textContent =
            "Calculating ATS score...";

        const atsScore = data.atsScore || 0;

        document.getElementById(
    "quickATS"
).textContent =
    atsScore;

document.getElementById(
    "atsScore"
).textContent =
    atsScore + "%";

document.getElementById(
    "atsBar"
).style.width =
    atsScore + "%";

        // Update circular progress ring
        updateProgressRing("quickATS", atsScore);    

const gaugeFill =
    document.getElementById(
        "gaugeFill"
    );

if (gaugeFill) {
    const rotation =
        (atsScore / 100) * 180;

    gaugeFill.style.transform =
        "rotate(" +
        rotation +
        "deg)";
}

let status = "ATS optimization needed";

if (atsScore >= 90) {
    status = "Excellent ATS compatibility";
} else if (atsScore >= 80) {
    status = "Strong ATS match";
} else if (atsScore >= 70) {
    status = "Good ATS resume";
} else if (atsScore >= 60) {
    status = "Needs minor ATS improvements";
} else {
    status = "Needs ATS optimization";
}

document.getElementById("atsStatus").textContent = status;

    }, 340);

setTimeout(() => {

    progressBar.style.width = "70%";

    progressText.textContent =
        "🚀 Evaluating Career Readiness...";

    const careerReadiness = data.careerReadiness || 0;
    document.getElementById(
        "careerReadiness"
    ).textContent =
        careerReadiness + "%";

    // Update circular progress ring
    updateProgressRing("careerReadiness", careerReadiness);

}, 1200);    

    setTimeout(() => {

        progressBar.style.width = "75%";
        progressText.textContent =
            "Analyzing strengths...";

        renderTopStrengths(
            document.getElementById("strengths"),
            data.strengths || ""
        );

    }, 1400);

    setTimeout(() => {

        progressBar.style.width = "85%";
        progressText.textContent =
            "Analyzing weaknesses...";

        document.getElementById("weaknesses").textContent =
            data.weaknesses || "No major weaknesses detected.";

    }, 1600);

    setTimeout(() => {

        progressBar.style.width = "95%";
        progressText.textContent =
            "Loading AI suggestions...";

        renderAISuggestions(
            document.getElementById("aiSuggestions"),
            data.suggestions || buildFallbackSuggestions(data)
        );

    }, 1800);

    setTimeout(() => {

    progressBar.style.width = "100%";
    progressText.textContent =
        "🎉 Analysis Complete!";

    document.getElementById("recommendedRoles").textContent =
        data.roles;

    let salaryHTML = "";

if(data.roles.includes("Java Developer")){

salaryHTML += `
<div class="salary-card">
    <div class="salary-role">
        Java Developer
    </div>
    <div class="salary-range">
        ₹5 - ₹12 LPA
    </div>
</div>

<div class="salary-card">
    <div class="salary-role">
        Backend Developer
    </div>
    <div class="salary-range">
        ₹6 - ₹15 LPA
    </div>
</div>
`;
}

if(data.roles.includes("Frontend Developer")){

salaryHTML += `
<div class="salary-card">
    <div class="salary-role">
        Frontend Developer
    </div>
    <div class="salary-range">
        ₹5 - ₹11 LPA
    </div>
</div>

<div class="salary-card">
    <div class="salary-role">
        React Developer
    </div>
    <div class="salary-range">
        ₹6 - ₹14 LPA
    </div>
</div>
`;
}

if(data.roles.includes("Python Developer")){

salaryHTML += `
<div class="salary-card">
    <div class="salary-role">
        Python Developer
    </div>
    <div class="salary-range">
        ₹5 - ₹13 LPA
    </div>
</div>

<div class="salary-card">
    <div class="salary-role">
        Django Developer
    </div>
    <div class="salary-range">
        ₹6 - ₹14 LPA
    </div>
</div>
`;
}

if(data.roles.includes("Cloud Engineer")){

salaryHTML += `
<div class="salary-card">
    <div class="salary-role">
        Cloud Engineer
    </div>
    <div class="salary-range">
        ₹8 - ₹20 LPA
    </div>
</div>

<div class="salary-card">
    <div class="salary-role">
        DevOps Engineer
    </div>
    <div class="salary-range">
        ₹8 - ₹18 LPA
    </div>
</div>
`;
}

if(salaryHTML === ""){

salaryHTML = `
<div class="salary-card">
    <div class="salary-role">
        Software Developer
    </div>
    <div class="salary-range">
        ₹4 - ₹10 LPA
    </div>
</div>
`;
}

document.getElementById(
    "salaryInsights"
).innerHTML = salaryHTML;    

    document.getElementById("topSkills").innerHTML =
    data.matchedSkills
        .split(",")
        .map(skill =>
            `<span class="skill-tag matched">${skill.trim()}</span>`
        )
        .join("");

document.getElementById("topMissing").innerHTML =
    data.missingSkills
        .split(",")
        .map(skill =>
            `<span class="skill-tag missing">${skill.trim()}</span>`
        )
        .join("");    

    const careerRoadmapElem = document.getElementById("careerRoadmap");
    if (careerRoadmapElem) {
        careerRoadmapElem.innerText = data.roadmap;
    }

    const interviewQuestionsElem = document.getElementById("interviewQuestions");
    if (interviewQuestionsElem) {
        interviewQuestionsElem.innerText = data.interviewQuestions;
    }

    const careerPotential = data.careerPotential || 0;
    document.getElementById("careerPotential").textContent =
        careerPotential + "%";

    // Update circular progress ring
    updateProgressRing("careerPotential", careerPotential);

    const ctx = document.getElementById("skillRadar");

    if (ctx && window.Chart) {
        const radarValues = [
            Math.min(100, Number(data.matchScore) || 78),
            Math.min(100, Number(data.atsScore) || 72),
            84,
            66,
            74,
            80
        ];

        new Chart(ctx, {
            type: "radar",
            data: {
                labels: [
                    "Programming",
                    "Database",
                    "Frontend",
                    "Cloud",
                    "Analytics",
                    "Communication"
                ],
                datasets: [{
                    label: "Skill Score",
                    data: radarValues,
                    fill: true,
                    backgroundColor: "rgba(59,130,246,0.3)",
                    borderColor: "#3b82f6",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: {
                            color: "white"
                        },
                        pointLabels: {
                            color: "white"
                        },
                        grid: {
                            color: "#374151"
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: "white"
                        }
                    }
                }
            }
        });
    }


// CAREER FIT

document.getElementById("careerFit").innerHTML = `
<div class="fit-row">
<span>Java Developer</span>
<div class="fit-bar">
<div class="fit-fill" style="width:90%"></div>
</div>
</div>

<div class="fit-row">
<span>Backend Developer</span>
<div class="fit-bar">
<div class="fit-fill" style="width:85%"></div>
</div>
</div>

<div class="fit-row">
<span>Software Engineer</span>
<div class="fit-bar">
<div class="fit-fill" style="width:75%"></div>
</div>
</div>

<div class="fit-row">
<span>Full Stack Developer</span>
<div class="fit-bar">
<div class="fit-fill" style="width:65%"></div>
</div>
</div>
`;    

    document.getElementById("healthReport").innerText =
        data.healthReport;

    document.getElementById("recruiterFeedback").textContent =
        data.recruiterFeedback;
  

}, 2100);

    if (data.resumeText && data.jobDescriptionText) {

        const fallbackSuggestion = buildFallbackSuggestions(data);
        renderAISuggestions(
            document.getElementById("aiSuggestions"),
            fallbackSuggestion
        );

        getAISuggestions(
            data.resumeText,
            data.jobDescriptionText
        ).then(function(aiResponse) {

            const normalized =
                !aiResponse ||
                /AI suggestions|could not be generated|temporarily unavailable|failed|Analysis Failed/i.test(aiResponse)
                    ? fallbackSuggestion
                    : aiResponse;

            data.suggestions = normalized;

            localStorage.setItem(
                "analysisData",
                JSON.stringify(data)
            );

            renderAISuggestions(
                document.getElementById("aiSuggestions"),
                normalized
            );

        }).catch(function() {
            renderAISuggestions(
                document.getElementById("aiSuggestions"),
                fallbackSuggestion
            );
        });
    }

}
document.getElementById("downloadReport")
.addEventListener("click", function () {

    if (!data || typeof data !== "object") {
        alert("Complete an analysis first to download a report.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const candidateName =
        data.candidateName || "Candidate";

    const matchScore =
        document.getElementById("quickMatch").textContent;

    const atsScore =
        document.getElementById("quickATS").textContent;

    const careerReadiness =
        document.getElementById("careerReadiness").textContent;

    const matchedSkills =
        document.getElementById("matchedSkills").textContent;

    const missingSkills =
        document.getElementById("missingSkills").textContent;

    const strengths =
        document.getElementById("strengths").textContent;

    const weaknesses =
        document.getElementById("weaknesses").textContent;

    const roles =
        document.getElementById("recommendedRoles").textContent;

    const suggestions =
        document.getElementById("aiSuggestions").textContent;

    let rating = "Needs Improvement (3/5)";

    if (parseInt(atsScore) >= 85) {
        rating = "Excellent (5/5)";
    } else if (parseInt(atsScore) >= 70) {
        rating = "Good (4/5)";
    }

    const today = new Date();

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 20;
    const contentWidth = 170;

    function addSection(title, text, y, isTitleBold = true) {
        const wrappedText = pdf.splitTextToSize(
            text || "No data available.",
            contentWidth
        );
        const textHeight = wrappedText.length * 5;
        const sectionGap = 10;
        const neededHeight = 12 + textHeight + sectionGap;

        if (y + neededHeight > pageHeight - 12) {
            pdf.addPage();
            y = 18;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", isTitleBold ? "bold" : "normal");
        pdf.text(title, marginX, y);

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text(wrappedText, marginX, y + 9);

        return y + neededHeight;
    }

    // HEADER
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 35, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("ResuMate Report", marginX, 22);

    pdf.setFontSize(11);
    pdf.text("Career Intelligence Platform", marginX, 30);

    pdf.setTextColor(0, 0, 0);

    // Candidate Info
    pdf.setFontSize(12);
    pdf.text("Candidate: " + candidateName, marginX, 50);
    pdf.text("Generated: " + today.toLocaleDateString(), 120, 50);
    pdf.line(marginX, 58, pageWidth - marginX, 58);

    // TITLE
    pdf.setFontSize(16);
    pdf.text("Performance Summary", marginX, 70);

    // MATCH SCORE CARD
    pdf.setFillColor(220, 252, 231);
    pdf.rect(15, 80, 55, 35, "F");
    pdf.rect(15, 80, 55, 35);
    pdf.setFontSize(11);
    pdf.text("Match Score", 22, 95);
    pdf.setFontSize(18);
    pdf.text(matchScore, 28, 108);

    // ATS CARD
    pdf.setFillColor(219, 234, 254);
    pdf.rect(78, 80, 55, 35, "F");
    pdf.rect(78, 80, 55, 35);
    pdf.setFontSize(11);
    pdf.text("ATS Score", 88, 95);
    pdf.setFontSize(18);
    pdf.text(atsScore, 97, 108);

    // CAREER CARD
    pdf.setFillColor(254, 249, 195);
    pdf.rect(141, 80, 55, 35, "F");
    pdf.rect(141, 80, 55, 35);
    pdf.setFontSize(10);
    pdf.text("Career Ready", 148, 95);
    pdf.setFontSize(12);
    pdf.text(
        String(careerReadiness).replace(/[^\x00-\x7F]/g, ""),
        146,
        108
    );

    // RATING
    pdf.setFontSize(14);
    pdf.text("Overall Rating", marginX, 135);
    pdf.setFontSize(12);
    pdf.text(rating, marginX, 145);

    // MATCHED SKILLS
    pdf.setFillColor(240, 253, 244);
    pdf.rect(15, 155, 180, 30, "F");
    pdf.text("Matched Skills", 20, 168);
    pdf.text(pdf.splitTextToSize(matchedSkills, 160), 20, 178);

    // MISSING SKILLS
    pdf.setFillColor(254, 242, 242);
    pdf.rect(15, 195, 180, 30, "F");
    pdf.text("Missing Skills", 20, 208);
    pdf.text(pdf.splitTextToSize(missingSkills, 160), 20, 218);

    pdf.setFontSize(10);
    pdf.text("Generated by ResuMate", 20, 285);

    // Second Page
    pdf.addPage();

    // HEADER
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 25, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text("Detailed Analysis", marginX, 16);

    pdf.setTextColor(0, 0, 0);

    let y = 38;
    y = addSection("Strengths", strengths, y);
    y = addSection("Weaknesses", weaknesses, y);
    y = addSection("Recommended Roles", roles, y);
    y = addSection("Career Roadmap", data.roadmap || "", y);
    y = addSection("Interview Questions", data.interviewQuestions || "", y);
    y = addSection("AI Suggestions", suggestions, y);

    // ACTION PLAN
    if (y + 40 > pageHeight - 12) {
        pdf.addPage();
        y = 18;
    }

    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Career Action Plan", marginX, y);

    y += 10;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text("• Improve missing skills", marginX + 5, y);
    pdf.text("• Build 2-3 practical projects", marginX + 5, y + 8);
    pdf.text("• Optimize ATS keywords", marginX + 5, y + 16);
    pdf.text("• Update resume regularly", marginX + 5, y + 24);

    pdf.line(marginX, y + 36, pageWidth - marginX, y + 36);
    pdf.text(
        "ResuMate Career Intelligence Platform",
        marginX,
        y + 45
    );

    pdf.save("ResuMate_Report.pdf");
});