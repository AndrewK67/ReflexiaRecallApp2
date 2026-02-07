const TERMS_TEXT = `TERMS OF USE

Last Updated: January 2026

1. ACCEPTANCE OF TERMS
By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.

2. USER RESPONSIBILITIES
You are responsible for maintaining the confidentiality of your information and password. You agree to accept responsibility for all activities that occur under your account.

3. DISCLAIMER
This application is provided on an "AS IS" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.

4. LIMITATION OF LIABILITY
In no event shall our company be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials.

5. CHANGES TO TERMS
We reserve the right to change these terms at any time. Your continued use of the application constitutes your acceptance of those changes.`;

const PRIVACY_TEXT = `PRIVACY POLICY

Last Updated: January 2026

1. INFORMATION COLLECTION
We collect information you provide directly, such as when you create an account or use our services.

2. USE OF INFORMATION
We use the information we collect to provide, maintain, and improve our services, and to comply with legal obligations.

3. DATA PROTECTION
Your data is stored locally on your device. We implement security measures to protect your information.

4. THIRD-PARTY SERVICES
Our application may use third-party services for analytics or other purposes. Please review their privacy policies.

5. CHILDREN'S PRIVACY
Our services are not directed to children under 13, and we do not knowingly collect information from children under 13.

6. CHANGES TO PRIVACY POLICY
We may update this policy periodically. We will notify you of material changes by updating the "Last Updated" date.`;

const DISCLAIMER_TEXT = `DISCLAIMER

Last Updated: January 2026

IMPORTANT MEDICAL AND CLINICAL DISCLAIMER

This application is designed for personal reflection and wellness support only. It is NOT a substitute for professional medical, mental health, or clinical advice.

NOT FOR CLINICAL USE
- This app should not be used for diagnosis, treatment, or management of medical or mental health conditions
- If you are experiencing a mental health crisis, please contact a mental health professional or crisis helpline immediately
- For medical emergencies, contact emergency services

AI DISCLAIMER
If this application includes AI features:
- AI-generated responses may contain errors, inaccuracies, or hallucinations
- Never rely solely on AI suggestions for important decisions
- Always verify AI responses with professional expertise

LIMITATION OF LIABILITY
The creators and providers of this application are not liable for:
- Decisions made based on information provided in this app
- Misuse of the application
- Technical failures or data loss
- Any damages resulting from use of this application

WARNING SIGNS
If you experience thoughts of self-harm, suicidal ideation, or other mental health emergencies, please seek professional help immediately.`;

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function downloadTerms() { downloadTextFile('Terms_of_Use.txt', TERMS_TEXT); }
export function downloadPrivacy() { downloadTextFile('Privacy_Policy.txt', PRIVACY_TEXT); }
export function downloadDisclaimer() { downloadTextFile('Disclaimer.txt', DISCLAIMER_TEXT); }
