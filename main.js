/* =========================================
   MinTalk - לוגיקה סופית ומתוקנת
   ניהול תקשורת SCORM 1.2 ודיווח נתונים ל-LMS
   ========================================= */

let isScormConnected = false;

// 1. אתחול המערכת בעת טעינת הדף
document.addEventListener('DOMContentLoaded', function () {
    
    // ניסיון התחברות ל-SCORM
    if (window.pipwerks && pipwerks.SCORM) {
        isScormConnected = pipwerks.SCORM.init();
        
        if (isScormConnected) {
            console.log("SCORM Connected");
            fetchLearnerName(); 
        } else {
            console.warn("SCORM failed: החיבור נכשל או שמופעל לוקאלית");
        }
    }

    // 2. חיבור המאזין ללחצן "צרו קשר"
    const submitBtn = document.getElementById('btn-submit-lms');
    if (submitBtn) {
        submitBtn.addEventListener('click', handleFormSubmit);
        console.log("Button listener attached!"); 
    }
});

/**
 * פונקציה לטיפול בשליחת הטופס ודיווח נתונים
 */
function handleFormSubmit() {
    // איסוף נתונים משלושה שדות לפחות (דרישת מטלה 5.d)
    const firstName = document.getElementById('firstName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;

    // ולידציה בסיסית
    if (!firstName || !phone || !email) {
        alert("נא למלא את כל השדות לפני השליחה");
        return;
    }

    if (isScormConnected) {
        // דיווח 3 שדות נתונים כאינטראקציות ל-LMS
        reportInteraction(0, "contact_name", firstName);
        reportInteraction(1, "contact_phone", phone);
        reportInteraction(2, "contact_email", email);

        // עדכון ציון וסטטוס השלמה
        pipwerks.SCORM.set('cmi.core.score.raw', '100'); 
        pipwerks.SCORM.set('cmi.core.lesson_status', 'completed'); 
        pipwerks.SCORM.save(); 
        
        alert("הנתונים נשלחו בהצלחה למערכת הלמידה!");
        pipwerks.SCORM.quit(); 
    } else {
        alert("הטופס תקין, אך אין חיבור ל-LMS (מצב הרצה מקומי).");
    }
}

/**
 * מנגנון חיפוש יציב (סעיף 4.c במטלה)
 */
function filterContent() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const units = document.getElementsByClassName('content-unit');
    
    for (let i = 0; i < units.length; i++) {
        const title = units[i].querySelector('.card-title').innerText.toLowerCase();
        units[i].style.display = title.includes(input) ? "" : "none";
    }
}

/**
 * שליפת שם הלומד מה-LMS
 */
function fetchLearnerName() {
    if (!isScormConnected) return; 
    const learnerName = pipwerks.SCORM.get('cmi.core.student_name');
    if (learnerName) {
        const nameEl = document.getElementById('learner-name');
        if (nameEl) nameEl.textContent = learnerName;
    }
}

/**
 * עזר לדיווח אינטראקציות
 */
function reportInteraction(index, id, response) {
    pipwerks.SCORM.set(`cmi.interactions.${index}.id`, id);
    pipwerks.SCORM.set(`cmi.interactions.${index}.type`, "fill-in");
    pipwerks.SCORM.set(`cmi.interactions.${index}.student_response`, response);
    pipwerks.SCORM.set(`cmi.interactions.${index}.result`, "correct");
}

// וידוא סגירת קשר בעת עזיבת הדף
window.addEventListener('beforeunload', function() {
    if (isScormConnected) pipwerks.SCORM.quit();
});
