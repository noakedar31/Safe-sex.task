/* =========================================
   MinTalk - לוגיקה מעודכנת לפי הנחיות המטלה
   מטרת הקוד: ניהול תקשורת SCORM 1.2, איסוף נתונים ודיווח ל-LMS
   ========================================= */

[cite_start]// משתנה גלובלי לבדיקת סטטוס החיבור למערכת ה-LMS [cite: 52]
let isScormConnected = false;

/**
 * אירוע טעינת העמוד (DOM Content Loaded)
 * [cite_start]מבצע את האתחול הראשוני של המערכת מול ה-Wrapper [cite: 52]
 */
document.addEventListener('DOMContentLoaded', function () {
    
    [cite_start]// 1. אתחול ה-SCORM באמצעות ה-Wrapper שנלמד (pipwerks) [cite: 52]
    if (window.pipwerks && pipwerks.SCORM) {
        
        [cite_start]// פונקציית init מחפשת את ה-API של ה-Moodle ומנסה להתחבר [cite: 52]
        isScormConnected = pipwerks.SCORM.init();
        
        if (isScormConnected) {
            console.log("SCORM Connected: החיבור למערכת הצליח");
            
            [cite_start]// שליפת שם הסטודנט מה-LMS והצגתו בדף [cite: 52]
            fetchLearnerName(); 
        } else {
            [cite_start]// הודעה שמופיעה כאשר הקובץ מורץ מקומית ולא בתוך Moodle [cite: 52]
            console.warn("SCORM failed: החיבור נכשל או שמופעל לוקאלית");
        }
    }

    [cite_start]// 2. הגדרת מאזין ללחיצה על כפתור שליחת הטופס [cite: 59]
    const submitBtn = document.getElementById('btn-submit-lms');
    if(submitBtn) {
        submitBtn.addEventListener('click', handleFormSubmit);
    }
});

/**
 * פונקציה לשליפת שם הלומד (cmi.core.student_name)
 * [cite_start]שימוש בתקן SCORM 1.2 כפי שמופיע במצגת [cite: 52]
 */
function fetchLearnerName() {
    if (!isScormConnected) return; 

    [cite_start]// שליפת השם מה-LMS בעזרת פונקציית ה-get של ה-Wrapper [cite: 52]
    const learnerName = pipwerks.SCORM.get('cmi.core.student_name');
    
    [cite_start]// אם חזר ערך תקין, נעדכן את האלמנט ב-HTML ליצירת פרסונליזציה [cite: 52]
    if (learnerName) {
        const nameEl = document.getElementById('learner-name');
        if (nameEl) nameEl.textContent = learnerName;
    }
}

/**
 * מנגנון חיפוש יציב (סעיף 4.c בהנחיות)
 * [cite_start]מבצע בדיקה מול שמות יחידות התוכן בזמן אמת [cite: 15, 17]
 */
function filterContent() {
    [cite_start]// שליפת ערך החיפוש והמרתו לאותיות קטנות (להתאמה מקסימלית) [cite: 18]
    const input = document.getElementById('searchInput').value.toLowerCase();
    
    [cite_start]// פנייה לכל יחידות התוכן (כרטיסים) בדף [cite: 59]
    const units = document.getElementsByClassName('content-unit');
    
    for (let i = 0; i < units.length; i++) {
        [cite_start]// בדיקה מול שם יחידת התוכן [cite: 17]
        const title = units[i].querySelector('.card-title').innerText.toLowerCase();
        
        [cite_start]// יחידות שהתאימו לטקסט נשארות מוצגות, והשאר מוסתרות [cite: 18]
        if (title.includes(input)) {
            units[i].style.display = ""; // הצגה
        } else {
            units[i].style.display = "none"; // הסתרה
        }
    }
}

/**
 * פונקציה המטפלת בשליחת הטופס
 * [cite_start]מבצעת ולידציה, דיווח 3 שדות (דרישת מטלה 5.d) ועדכון ציון [cite: 25, 52]
 */
function handleFormSubmit() {
    // א. [cite_start]איסוף נתונים מהשדות (לפחות 3 שדות נתונים נאספים) [cite: 25]
    const firstName = document.getElementById('firstName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;

    // בדיקת תקינות בסיסית - חובה למלא את כל השדות
    if(!firstName || !phone || !email) {
        alert("נא למלא את כל השדות לפני השליחה");
        return;
    }

    // ב. [cite_start]דיווח למערכת ה-LMS במידה ויש חיבור פעיל [cite: 52]
    if (isScormConnected) {
        
        [cite_start]// שליחת הנתונים כאינטראקציות - דיווח מוצלח חזרה למערכת [cite: 25, 52]
        [cite_start]// כל שדה מדווח בנפרד כדי לעמוד בדרישת "3 שדות מדווחים" [cite: 25]
        reportInteraction(0, "contact_name", firstName);
        reportInteraction(1, "contact_phone", phone);
        reportInteraction(2, "contact_email", email);

        // ג. [cite_start]עדכון ציון וסטטוס שיעור (Score & Status) בתקן 1.2 [cite: 52]
        pipwerks.SCORM.set('cmi.core.score.raw', '100'); // קביעת ציון
        pipwerks.SCORM.set('cmi.core.lesson_status', 'completed'); // סימון השלמה
        
        [cite_start]// שמירת הנתונים (Commit) לשרת - שלב קריטי למניעת אובדן מידע [cite: 52]
        pipwerks.SCORM.save(); 
        
        alert("הנתונים נשלחו בהצלחה למערכת הלמידה!");
        
        // ד. [cite_start]סגירת ה-Session של ה-SCORM בצורה מסודרת [cite: 52]
        pipwerks.SCORM.quit();
        
    } else {
        [cite_start]// הודעה למקרה שהלומד מריץ את הקובץ במחשב האישי ללא Moodle [cite: 52]
        alert("הטופס תקין, אך אין חיבור ל-LMS. הנתונים לא נשמרו (מצב הרצה מקומי).");
    }
}

/**
 * פונקציית עזר לדיווח אינטראקציה בודדת (cmi.interactions)
 * [cite_start]מקבלת אינדקס, מזהה ותשובה ומדווחת למערכת [cite: 52]
 */
function reportInteraction(index, id, response) {
    [cite_start]// הגדרת המזהה הייחודי לאינטראקציה [cite: 52]
    pipwerks.SCORM.set(`cmi.interactions.${index}.id`, id);
    [cite_start]// הגדרת סוג האינטראקציה (מילוי טקסט) [cite: 52]
    pipwerks.SCORM.set(`cmi.interactions.${index}.type`, "fill-in");
    [cite_start]// שמירת הערך שהמשתמש הזין בטופס [cite: 52]
    pipwerks.SCORM.set(`cmi.interactions.${index}.student_response`, response);
    [cite_start]// הגדרת התוצאה כ-'correct' (נכון) [cite: 52]
    pipwerks.SCORM.set(`cmi.interactions.${index}.result`, "correct");
}

/**
 * [cite_start]מאזין לסגירת החלון או רענון הדף [cite: 52]
 * מוודא סגירה תקינה של התקשורת מול ה-LMS למניעת תקלות דיווח
 */
window.addEventListener('beforeunload', function() {
    if(isScormConnected) {
        pipwerks.SCORM.quit();
    }
});