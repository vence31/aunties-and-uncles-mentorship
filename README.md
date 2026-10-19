# Goals 4 My Life — Aunties & Uncles Community Mentorship

Online intake portal and real-time administrative dashboard for the **Aunties & Uncles Community Mentorship Program** by **Goals 4 My Life Inc.**

---

## 📁 Repository Contents

| File | Description |
| :--- | :--- |
| **[`index.html`](index.html)** | The public-facing, responsive multi-step intake form for both **Community Mentors (Aunties & Uncles)** and **Family Youth Enrollments**. Includes digital signatures, honeypots, and token validation. |
| **[`dashboard.html`](dashboard.html)** | Administrative registry displaying real-time submissions from Google Sheets, stats (total applications, volunteers, families, signed status), search/filter by keyword, detailed application modal, and CSV export. |
| **[`Code.gs`](Code.gs)** | Google Apps Script backend code running inside Google Sheets to append submissions and route instant notification emails to **`info@goalsformylife.com`**. |

---

## 📧 Email Notification Setup (`info@goalsformylife.com`)

### Why was it previously going to your personal email?
Your Google Sheet and Google Apps Script Web App are hosted inside your **`vence31@gmail.com`** account. In Google Apps Script, when `MailApp.sendEmail()` is called without specifying the destination, or with `Session.getActiveUser().getEmail()`, it routes emails to the script owner's Gmail address (`vence31@gmail.com`).

### How this is now fixed:
1. **Frontend (`index.html`)**: The submission payload now explicitly passes `notifyEmail: "info@goalsformylife.com"`.
2. **Backend (`Code.gs`)**: `NOTIFICATION_EMAIL` is explicitly configured as `"info@goalsformylife.com"`, with the applicant's email set as `replyTo`.

### ⚠️ Required 2-Minute Step in Google Sheets:
Because Google Apps Script runs in your private Google cloud workspace, you need to update the script in your sheet once:

1. Open your Google Sheet in your **`vence31@gmail.com`** account.
2. In the top menu, click **Extensions** > **Apps Script**.
3. Select the code in **`Code.gs`** and paste the contents of [`Code.gs`](Code.gs) into the editor.
4. Click the **Save** icon (disk).
5. **Critical Activation Step**:
   - In the top-right corner, click **Deploy** > **Manage deployments**.
   - Click the **pencil icon (Edit)** next to your active Web App deployment.
   - Under **Version**, change it from the old version to **New version**.
   - Click **Deploy** and then **Done**.

> **Note:** Whenever you change Google Apps Script code, creating a **New version** under *Manage deployments* is required by Google for the live `/exec` URL to run the updated script.

---

## 🚀 Live GitHub Pages Deployment

To enable GitHub Pages for this repository:
1. In this GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
3. Set the branch to **`main`** and folder to **`/ (root)`**, then click **Save**.
4. Your site will be live at:
   - **Intake Form:** `https://vence31.github.io/<repo-name>/index.html`
   - **Admin Dashboard:** `https://vence31.github.io/<repo-name>/dashboard.html`

---

## 🔒 Security & Tokens
- **Submission Token:** Validates incoming payloads to prevent spam bots.
- **Read Token (`pi_read_...`):** Grants the dashboard read-only access to view submissions.
- **Spam Protection:** Silent honeypots trap automated submission scripts without interfering with human applicants.
