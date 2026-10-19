/**
 * ==============================================================================
 * GOALS 4 MY LIFE INC. — AUNTIES & UNCLES MENTORSHIP PROGRAM
 * Google Apps Script Backend (Code.gs)
 * ==============================================================================
 * 
 * Account Owner: vence31@gmail.com
 * Form Submissions & Email Notifications Destination: info@goalsformylife.com
 *
 * HOW IT WORKS:
 * 1. Even though this script and the Google Sheet live in your personal Google
 *    account (vence31@gmail.com), all email alerts for new Volunteer applications
 *    and Family enrollments are sent directly to info@goalsformylife.com.
 * 2. When someone submits from the website, their data is recorded into the Google Sheet
 *    ("Volunteers" or "Families" tab), and an instant notification email is dispatched.
 * 3. The Applications Dashboard (dashboard.html) reads data securely using READ_TOKEN.
 *
 * HOW TO UPDATE IN GOOGLE APPS SCRIPT:
 * 1. Open your Google Sheet in your vence31@gmail.com account.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace all existing code in Code.gs with this file.
 * 4. Click Save (Disk icon).
 * 5. CRITICAL STEP TO ACTIVATE:
 *    Click "Deploy" (top right) > "Manage deployments".
 *    Click the pencil icon (Edit) on your Active deployment.
 *    Under "Version", select "New version".
 *    Click "Deploy".
 * ==============================================================================
 */

// CONFIGURATION
const NOTIFICATION_EMAIL = "info@goalsformylife.com";
const SUBMIT_TOKEN = "pi_06b34e008be649089c0c0711";
const READ_TOKEN = "pi_read_cc6e17b892e449ffb406";

const VOLUNTEER_SHEET_NAME = "Volunteers";
const FAMILY_SHEET_NAME = "Families";

// Volunteer Columns
const VOLUNTEER_HEADERS = [
  "timestamp", "refNum", "formType", "name", "date", "address", "city", "state", "zip",
  "phone", "email", "preferredContact", "dob", "occupation", "employer",
  "emergencyContactName", "emergencyContactRelationship", "emergencyContactPhone",
  "whyBecome", "giftsToShare", "skills", "preferredPopulation", "availability",
  "volunteeredBefore", "mentoredYouth", "willingToComplete",
  "ref1Name", "ref1Phone", "ref1Relationship", "ref2Name", "ref2Phone", "ref2Relationship",
  "hasSig", "signDate"
];

// Family Columns
const FAMILY_HEADERS = [
  "timestamp", "refNum", "formType", "parentName", "phone", "email", "address",
  "emergencyContact", "childNames", "childDob", "school", "grade",
  "medicalConcerns", "allergies", "transportationNeeds", "goals", "childStrengths",
  "challenges", "youthEnjoy", "favSubject", "favHobby", "dreamJob", "favSport",
  "favMusic", "helpWith", "hasSig", "signDate"
];

/**
 * Handle POST requests (Primary submission route)
 */
function doPost(e) {
  try {
    const data = parsePayload(e);
    return processSubmission(data);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle GET requests (Dashboard fetching & fallback submissions)
 */
function doGet(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const action = p.action;

    // 1. Dashboard data request
    if (action === "get_intakes") {
      if (p.token !== READ_TOKEN) {
        return jsonResponse({ success: false, message: "Unauthorized read token" });
      }
      return jsonResponse(getIntakesData());
    }

    // 2. Fallback submission via GET
    if (action === "submit_volunteer" || action === "submit_family") {
      return processSubmission(p);
    }

    return jsonResponse({
      success: true,
      service: "Goals 4 My Life — Aunties & Uncles Mentorship API",
      recipientEmail: NOTIFICATION_EMAIL,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Parse incoming payload from either url-encoded parameters or JSON body
 */
function parsePayload(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_) {
      // If not raw JSON, check parameter map
    }
  }
  return e.parameter || {};
}

/**
 * Process either volunteer or family form submission
 */
function processSubmission(data) {
  // Validate token
  const token = data.token || "";
  if (token !== SUBMIT_TOKEN) {
    return jsonResponse({ success: false, message: "Invalid submission token" });
  }

  const action = data.action;
  const now = new Date();

  if (action === "submit_volunteer") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, VOLUNTEER_SHEET_NAME, VOLUNTEER_HEADERS);

    const refNum = data.refNum || ("VOL-" + now.getTime().toString(36).toUpperCase().slice(-6));
    const row = [
      now.toISOString(),
      refNum,
      "Volunteer",
      data.name || "",
      data.date || "",
      data.address || "",
      data.city || "",
      data.state || "",
      data.zip || "",
      data.phone || "",
      data.email || "",
      data.preferredContact || "",
      data.dob || "",
      data.occupation || "",
      data.employer || "",
      data.emergencyContactName || "",
      data.emergencyContactRelationship || "",
      data.emergencyContactPhone || "",
      data.whyBecome || "",
      data.giftsToShare || "",
      data.skills || "",
      data.preferredPopulation || "",
      data.availability || "",
      data.volunteeredBefore || "",
      data.mentoredYouth || "",
      data.willingToComplete || "",
      data.ref1Name || "",
      data.ref1Phone || "",
      data.ref1Relationship || "",
      data.ref2Name || "",
      data.ref2Phone || "",
      data.ref2Relationship || "",
      data.hasSig || "NO",
      data.signDate || ""
    ];

    sheet.appendRow(row);

    // Send instant email notification to info@goalsformylife.com
    sendVolunteerEmail(data, refNum);

    return jsonResponse({ success: true, refNum: refNum, type: "volunteer" });
  }

  if (action === "submit_family") {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, FAMILY_SHEET_NAME, FAMILY_HEADERS);

    const refNum = data.refNum || ("FAM-" + now.getTime().toString(36).toUpperCase().slice(-6));
    const row = [
      now.toISOString(),
      refNum,
      "Family",
      data.parentName || "",
      data.phone || "",
      data.email || "",
      data.address || "",
      data.emergencyContact || "",
      data.childNames || "",
      data.childDob || "",
      data.school || "",
      data.grade || "",
      data.medicalConcerns || "",
      data.allergies || "",
      data.transportationNeeds || "",
      data.goals || "",
      data.childStrengths || "",
      data.challenges || "",
      data.youthEnjoy || "",
      data.favSubject || "",
      data.favHobby || "",
      data.dreamJob || "",
      data.favSport || "",
      data.favMusic || "",
      data.helpWith || "",
      data.hasSig || "NO",
      data.signDate || ""
    ];

    sheet.appendRow(row);

    // Send instant email notification to info@goalsformylife.com
    sendFamilyEmail(data, refNum);

    return jsonResponse({ success: true, refNum: refNum, type: "family" });
  }

  return jsonResponse({ success: false, message: "Unknown action: " + action });
}

/**
 * Dispatch notification email for Volunteer application to info@goalsformylife.com
 */
function sendVolunteerEmail(data, refNum) {
  const targetEmail = NOTIFICATION_EMAIL;
  const applicantName = data.name || "Unknown Volunteer";
  const applicantEmail = data.email || "";
  const applicantPhone = data.phone || "Not provided";

  const subject = `[New Volunteer Application] ${applicantName} (${refNum})`;

  const htmlBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 24px; color: #222;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #e03030, #b71c1c); padding: 20px 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">Goals 4 My Life — Aunties & Uncles Mentorship</h2>
        <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">New Volunteer Mentor Application Received</div>
      </div>
      <div style="padding: 24px;">
        <div style="display: inline-block; background: #fee2e2; color: #b91c1c; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 20px; margin-bottom: 16px;">
          Reference #${refNum}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #666; width: 160px;">Applicant Name:</td><td style="padding: 8px 0; font-weight: bold; color: #111;">${applicantName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${applicantPhone}" style="color: #b91c1c; text-decoration: none;">${applicantPhone}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${applicantEmail}" style="color: #b91c1c; text-decoration: none;">${applicantEmail || "None"}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Location:</td><td style="padding: 8px 0;">${data.city || ""}, ${data.state || ""} ${data.zip || ""}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Occupation:</td><td style="padding: 8px 0;">${data.occupation || "N/A"} (${data.employer || "N/A"})</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Preferred Contact:</td><td style="padding: 8px 0;">${data.preferredContact || "N/A"}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Signed Agreement:</td><td style="padding: 8px 0; font-weight: bold; color: ${data.hasSig === "YES" ? "#15803d" : "#b91c1c"};">${data.hasSig === "YES" ? "YES (Signed)" : "NO"}</td></tr>
        </table>

        <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px;">Why They Want to Mentor:</h4>
          <p style="background: #fdf2f2; padding: 12px; border-radius: 8px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${data.whyBecome || "No statement provided"}</p>
        </div>

        <div style="margin-top: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px;">Gifts & Life Experiences to Share:</h4>
          <p style="background: #fdf2f2; padding: 12px; border-radius: 8px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${data.giftsToShare || "No details provided"}</p>
        </div>

        <div style="margin-top: 16px; font-size: 13px;">
          <strong>Skills Offered:</strong> ${data.skills || "None listed"}<br>
          <strong>Preferred Youth:</strong> ${data.preferredPopulation || "Any"}<br>
          <strong>Weekly Availability:</strong> ${data.availability || "Flexible"}<br>
          <strong>Clearances Willing:</strong> ${data.willingToComplete || "None"}
        </div>
      </div>
      <div style="background: #f9f9f9; padding: 14px 24px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
        Submitted to Goals 4 My Life Mentorship Registry · Saved to Google Sheets
      </div>
    </div>
  </div>
  `;

  MailApp.sendEmail({
    to: targetEmail,
    replyTo: applicantEmail || targetEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * Dispatch notification email for Family Enrollment to info@goalsformylife.com
 */
function sendFamilyEmail(data, refNum) {
  const targetEmail = NOTIFICATION_EMAIL;
  const parentName = data.parentName || "Unknown Parent";
  const parentEmail = data.email || "";
  const parentPhone = data.phone || "Not provided";
  const childNames = data.childNames || "Not listed";

  const subject = `[New Family Enrollment] ${parentName} — Child: ${childNames} (${refNum})`;

  const htmlBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 24px; color: #222;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #e03030, #b71c1c); padding: 20px 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">Goals 4 My Life — Aunties & Uncles Mentorship</h2>
        <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">New Family Youth Enrollment Received</div>
      </div>
      <div style="padding: 24px;">
        <div style="display: inline-block; background: #fee2e2; color: #b91c1c; font-weight: bold; font-size: 12px; padding: 4px 10px; border-radius: 20px; margin-bottom: 16px;">
          Reference #${refNum}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #666; width: 160px;">Parent/Guardian:</td><td style="padding: 8px 0; font-weight: bold; color: #111;">${parentName}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${parentPhone}" style="color: #b91c1c; text-decoration: none;">${parentPhone}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${parentEmail}" style="color: #b91c1c; text-decoration: none;">${parentEmail || "None"}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Address:</td><td style="padding: 8px 0;">${data.address || "N/A"}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Child Name(s):</td><td style="padding: 8px 0; font-weight: bold; color: #b91c1c;">${childNames}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">School & Grade:</td><td style="padding: 8px 0;">${data.school || "N/A"} (Grade ${data.grade || "N/A"})</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Emergency Contact:</td><td style="padding: 8px 0;">${data.emergencyContact || "N/A"}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Signed Consent:</td><td style="padding: 8px 0; font-weight: bold; color: ${data.hasSig === "YES" ? "#15803d" : "#b91c1c"};">${data.hasSig === "YES" ? "YES (Signed)" : "NO"}</td></tr>
        </table>

        <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px;">Goals for Participation:</h4>
          <p style="background: #fdf2f2; padding: 12px; border-radius: 8px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${data.goals || "No goals specified"}</p>
        </div>

        <div style="margin-top: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px;">Child Strengths & Challenges:</h4>
          <p style="background: #fdf2f2; padding: 12px; border-radius: 8px; font-size: 13px; color: #333; line-height: 1.5; margin: 0;">
            <strong>Strengths:</strong> ${data.childStrengths || "N/A"}<br>
            <strong>Challenges:</strong> ${data.challenges || "N/A"}
          </p>
        </div>

        <div style="margin-top: 16px; font-size: 13px;">
          <strong>Youth Enjoys:</strong> ${data.youthEnjoy || "N/A"}<br>
          <strong>Dream Job:</strong> ${data.dreamJob || "N/A"}<br>
          <strong>Favorite Sport / Hobby:</strong> ${data.favSport || "N/A"} / ${data.favHobby || "N/A"}<br>
          <strong>Needs Support With:</strong> ${data.helpWith || "N/A"}
        </div>
      </div>
      <div style="background: #f9f9f9; padding: 14px 24px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777;">
        Submitted to Goals 4 My Life Mentorship Registry · Saved to Google Sheets
      </div>
    </div>
  </div>
  `;

  MailApp.sendEmail({
    to: targetEmail,
    replyTo: parentEmail || targetEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * Read all rows from Volunteers and Families sheets for the admin dashboard
 */
function getIntakesData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const vSheet = ss.getSheetByName(VOLUNTEER_SHEET_NAME);
  const fSheet = ss.getSheetByName(FAMILY_SHEET_NAME);

  const volunteers = vSheet ? sheetToObjects(vSheet, VOLUNTEER_HEADERS) : [];
  const families = fSheet ? sheetToObjects(fSheet, FAMILY_HEADERS) : [];

  return {
    success: true,
    updatedAt: new Date().toISOString(),
    volunteers: volunteers,
    families: families
  };
}

/**
 * Helper to convert sheet rows into array of objects using headers
 */
function sheetToObjects(sheet, expectedHeaders) {
  const values = sheet.getDataRange().getValues();
  if (!values || values.length <= 1) return [];

  const headers = values[0].map(h => String(h).trim());
  const rows = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    // Skip completely empty rows
    if (row.every(cell => cell === "" || cell === null)) continue;

    const obj = {};
    headers.forEach((hdr, colIdx) => {
      let val = row[colIdx];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      obj[hdr] = val;
    });
    rows.push(obj);
  }

  return rows;
}

/**
 * Get sheet or create it if missing, with bold headers and frozen first row
 */
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#fee2e2");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * JSON response helper with proper Content-Type
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
