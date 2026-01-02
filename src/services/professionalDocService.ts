/**
 * Professional Documentation Generator
 *
 * Generates formatted text from reflections/journal entries for professional documentation
 * such as NHS Revalidation, GMC Appraisal, regulatory submissions, etc.
 */

import type { ReflectionEntry } from '../types';

export type DocumentTemplate =
  | 'NMC_REVALIDATION'          // NMC Revalidation (Nurses/Midwives)
  | 'GMC_APPRAISAL'             // GMC Appraisal documentation
  | 'HCPC_CPD'                  // HCPC CPD summary
  | 'NMC_REFLECTIVE_ACCOUNT'    // NMC Reflective Account (5 required)
  | 'GMC_SUPPORTING_INFO'       // GMC Supporting Information
  | 'GENERIC_REFLECTION'        // Generic professional reflection
  | 'PORTFOLIO_SUMMARY'         // Portfolio summary
  | 'LEARNING_LOG'              // Learning log entry
  | 'CLINICAL_INCIDENT'         // Clinical incident reflection
  | 'SIGNIFICANT_EVENT'         // Significant Event Analysis
  | 'CASE_DISCUSSION'           // Case-based discussion
  | 'TEACHING_EVIDENCE';        // Teaching/training evidence

interface DocumentConfig {
  template: DocumentTemplate;
  includePersonalInfo?: boolean;
  includeEvidence?: boolean;
  wordLimit?: number;
  style?: 'formal' | 'narrative' | 'structured';
}

interface GeneratedDocument {
  title: string;
  content: string;
  wordCount: number;
  template: DocumentTemplate;
  generatedDate: string;
}

/**
 * Extract content from reflection entry answers
 */
function extractContent(entry: ReflectionEntry): {
  description: string;
  reflection: string;
  action: string;
  allContent: string;
} {
  const answers = entry.answers || {};
  const answerValues = Object.values(answers).filter(v => v && v.trim()).join('\n\n');

  // Use content field or combined answers
  const mainContent = entry.content || entry.summary || answerValues;

  return {
    description: mainContent,
    reflection: entry.aiInsight || entry.summary || mainContent,
    action: entry.actionSteps?.join('\n') || '',
    allContent: [
      entry.title,
      mainContent,
      entry.summary,
      entry.aiInsight,
      entry.actionSteps?.join('\n'),
    ].filter(Boolean).join('\n\n'),
  };
}

/**
 * Get CPD hours from entry
 */
function getCPDHours(entry: ReflectionEntry): number | null {
  const minutes = entry.cpd?.timeSpentMinutes || entry.cpd?.minutes;
  if (!minutes) return null;
  return Math.round((minutes / 60) * 10) / 10; // Convert to hours, round to 1 decimal
}

/**
 * Get tags/keywords from entry
 */
function getTags(entry: ReflectionEntry): string[] {
  return entry.keywords || [];
}

/**
 * Generate professional documentation from a reflection entry
 */
export function generateProfessionalDoc(
  entry: ReflectionEntry,
  config: DocumentConfig
): GeneratedDocument {
  const generators = {
    NMC_REVALIDATION: generateNMCRevalidation,
    GMC_APPRAISAL: generateGMCAppraisal,
    HCPC_CPD: generateHCPCCPD,
    NMC_REFLECTIVE_ACCOUNT: generateNMCReflectiveAccount,
    GMC_SUPPORTING_INFO: generateGMCSupportingInfo,
    GENERIC_REFLECTION: generateGenericReflection,
    PORTFOLIO_SUMMARY: generatePortfolioSummary,
    LEARNING_LOG: generateLearningLog,
    CLINICAL_INCIDENT: generateClinicalIncident,
    SIGNIFICANT_EVENT: generateSignificantEvent,
    CASE_DISCUSSION: generateCaseDiscussion,
    TEACHING_EVIDENCE: generateTeachingEvidence,
  };

  const generator = generators[config.template];
  const content = generator(entry, config);

  return {
    title: getDocumentTitle(config.template, entry),
    content,
    wordCount: countWords(content),
    template: config.template,
    generatedDate: new Date().toISOString(),
  };
}

/**
 * Generate NMC Revalidation Reflective Account
 * Format: What happened, What did I learn, How did I change my practice
 */
function generateNMCRevalidation(entry: ReflectionEntry, config: DocumentConfig): string {
  return generateNMCReflectiveAccount(entry, config);
}

/**
 * Generate NMC Reflective Account
 */
function generateNMCReflectiveAccount(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);
  const tags = getTags(entry);

  // Title
  sections.push(`Reflective Account: ${entry.title || 'Professional Reflection'}`);
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push('');

  // NMC Code reference
  if (tags.length > 0) {
    sections.push(`Relevant NMC Code: ${tags.join(', ')}`);
    sections.push('');
  }

  // What happened (Description)
  sections.push('WHAT HAPPENED:');
  sections.push('');
  sections.push(formatParagraph(description, config.wordLimit ? Math.floor(config.wordLimit * 0.3) : undefined));
  sections.push('');

  // What did I learn (Reflection)
  sections.push('WHAT DID I LEARN:');
  sections.push('');
  sections.push(formatParagraph(reflection, config.wordLimit ? Math.floor(config.wordLimit * 0.4) : undefined));
  sections.push('');

  // How did I change my practice (Action/Impact)
  sections.push('HOW I CHANGED MY PRACTICE:');
  sections.push('');
  sections.push(formatParagraph(action || reflection, config.wordLimit ? Math.floor(config.wordLimit * 0.3) : undefined));
  sections.push('');

  // CPD hours (if applicable)
  const cpdHours = getCPDHours(entry);
  if (cpdHours) {
    sections.push(`CPD Hours: ${cpdHours}`);
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Generate GMC Appraisal Supporting Information
 */
function generateGMCAppraisal(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push(`Supporting Information for GMC Appraisal`);
  sections.push(`Title: ${entry.title || 'Professional Development Activity'}`);
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push('');

  // Domain
  sections.push('DOMAIN: Knowledge, Skills and Performance');
  sections.push('');

  // Description of activity
  sections.push('DESCRIPTION:');
  sections.push('');
  sections.push(formatParagraph(description));
  sections.push('');

  // Reflection and learning
  sections.push('REFLECTION AND LEARNING:');
  sections.push('');
  sections.push(formatParagraph(reflection));
  sections.push('');

  // Impact on practice
  sections.push('IMPACT ON PRACTICE:');
  sections.push('');
  sections.push(formatParagraph(action || reflection));
  sections.push('');

  return sections.join('\n');
}

/**
 * Generate HCPC CPD Summary
 */
function generateHCPCCPD(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push('HCPC CPD Record');
  sections.push('');

  // Date and activity
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push(`Activity: ${entry.title || 'Professional Development'}`);
  sections.push('');

  // Hours
  const cpdHours = getCPDHours(entry);
  if (cpdHours) {
    sections.push(`CPD Hours: ${cpdHours}`);
    sections.push('');
  }

  // What did you do?
  sections.push('WHAT DID YOU DO?');
  sections.push('');
  sections.push(formatParagraph(description, 200));
  sections.push('');

  // How did this CPD contribute to the quality of your practice?
  sections.push('HOW DID THIS CPD CONTRIBUTE TO THE QUALITY OF YOUR PRACTICE?');
  sections.push('');
  sections.push(formatParagraph(reflection, 200));
  sections.push('');

  // How does this CPD relate to the HCPC Standards?
  sections.push('HOW DOES THIS CPD RELATE TO THE HCPC STANDARDS?');
  sections.push('');
  const standards = action || 'This activity supports my continued compliance with HCPC Standards of Proficiency and Standards of Conduct, Performance and Ethics.';
  sections.push(formatParagraph(standards, 150));
  sections.push('');

  return sections.join('\n');
}

/**
 * Generate GMC Supporting Information
 */
function generateGMCSupportingInfo(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push('GMC Supporting Information');
  sections.push('');
  sections.push(`Activity: ${entry.title || 'Professional Activity'}`);
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push('');

  // Activity description
  sections.push(formatParagraph(description));
  sections.push('');

  // Learning points
  sections.push('Key Learning Points:');
  sections.push(formatParagraph(reflection));
  sections.push('');

  // Changes to practice
  sections.push('Changes to Practice:');
  sections.push(formatParagraph(action || reflection));
  sections.push('');

  return sections.join('\n');
}

/**
 * Generate Generic Professional Reflection
 */
function generateGenericReflection(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push(`Professional Reflection: ${entry.title || 'Untitled'}`);
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push('');

  // Description
  if (description) {
    sections.push('SITUATION:');
    sections.push(formatParagraph(description));
    sections.push('');
  }

  // Reflection
  if (reflection) {
    sections.push('REFLECTION:');
    sections.push(formatParagraph(reflection));
    sections.push('');
  }

  // Action/Learning
  if (action) {
    sections.push('ACTION TAKEN:');
    sections.push(formatParagraph(action));
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Generate Portfolio Summary
 */
function generatePortfolioSummary(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { allContent } = extractContent(entry);

  sections.push('Portfolio Entry Summary');
  sections.push('');
  sections.push(`Title: ${entry.title || 'Professional Activity'}`);
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);

  const cpdHours = getCPDHours(entry);
  if (cpdHours) {
    sections.push(`CPD Hours: ${cpdHours}`);
  }

  const tags = getTags(entry);
  if (tags.length > 0) {
    sections.push(`Tags: ${tags.join(', ')}`);
  }

  sections.push('');
  sections.push(formatParagraph(allContent, config.wordLimit));

  return sections.join('\n');
}

/**
 * Generate Learning Log Entry
 */
function generateLearningLog(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push('Learning Log Entry');
  sections.push('');
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push(`Activity: ${entry.title || 'Learning Activity'}`);
  sections.push('');

  // What I did
  sections.push('WHAT I DID:');
  sections.push(formatParagraph(description, 150));
  sections.push('');

  // What I learned
  sections.push('WHAT I LEARNED:');
  sections.push(formatParagraph(reflection, 150));
  sections.push('');

  // How I will apply this
  sections.push('HOW I WILL APPLY THIS:');
  sections.push(formatParagraph(action, 100));
  sections.push('');

  return sections.join('\n');
}

/**
 * Generate Clinical Incident Reflection
 */
function generateClinicalIncident(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push('Clinical Incident Reflection');
  sections.push('');
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push('');

  sections.push('INCIDENT DESCRIPTION:');
  sections.push(formatParagraph(description));
  sections.push('');

  sections.push('ANALYSIS:');
  sections.push(formatParagraph(reflection));
  sections.push('');

  sections.push('ACTIONS TAKEN:');
  sections.push(formatParagraph(action));
  sections.push('');

  sections.push('LESSONS LEARNED:');
  sections.push('Key learning points from this incident and how they will inform future practice.');
  sections.push('');

  return sections.join('\n');
}

/**
 * Generate Significant Event Analysis
 */
function generateSignificantEvent(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push('Significant Event Analysis');
  sections.push('');
  sections.push(`Date of Event: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push(`Event Title: ${entry.title || 'Significant Event'}`);
  sections.push('');

  sections.push('1. WHAT HAPPENED?');
  sections.push(formatParagraph(description));
  sections.push('');

  sections.push('2. WHY DID IT HAPPEN?');
  sections.push(formatParagraph(reflection));
  sections.push('');

  sections.push('3. WHAT HAS BEEN LEARNED?');
  sections.push(formatParagraph(action || reflection));
  sections.push('');

  sections.push('4. WHAT HAS BEEN CHANGED?');
  sections.push(formatParagraph(action || 'Actions to be determined based on analysis.'));
  sections.push('');

  return sections.join('\n');
}

/**
 * Generate Case-Based Discussion
 */
function generateCaseDiscussion(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push('Case-Based Discussion');
  sections.push('');
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push(`Case: ${entry.title || 'Case Discussion'}`);
  sections.push('');

  sections.push('CASE SUMMARY:');
  sections.push(formatParagraph(description));
  sections.push('');

  sections.push('DISCUSSION POINTS:');
  sections.push(formatParagraph(reflection));
  sections.push('');

  sections.push('LEARNING OUTCOMES:');
  sections.push(formatParagraph(action || reflection));
  sections.push('');

  return sections.join('\n');
}

/**
 * Generate Teaching Evidence
 */
function generateTeachingEvidence(entry: ReflectionEntry, config: DocumentConfig): string {
  const sections: string[] = [];
  const { description, reflection, action } = extractContent(entry);

  sections.push('Teaching/Training Evidence');
  sections.push('');
  sections.push(`Date: ${new Date(entry.date || entry.createdAt || Date.now()).toLocaleDateString('en-GB')}`);
  sections.push(`Activity: ${entry.title || 'Teaching Activity'}`);
  sections.push('');

  sections.push('TEACHING ACTIVITY:');
  sections.push(formatParagraph(description));
  sections.push('');

  sections.push('METHODS USED:');
  sections.push('Describe teaching methods, materials, and approach used.');
  sections.push('');

  sections.push('OUTCOMES:');
  sections.push(formatParagraph(reflection));
  sections.push('');

  sections.push('PERSONAL LEARNING:');
  sections.push(formatParagraph(action || reflection));
  sections.push('');

  return sections.join('\n');
}

/**
 * Get document title based on template
 */
function getDocumentTitle(template: DocumentTemplate, entry: ReflectionEntry): string {
  const titles: Record<DocumentTemplate, string> = {
    NMC_REVALIDATION: 'NMC Revalidation Documentation',
    GMC_APPRAISAL: 'GMC Appraisal Supporting Information',
    HCPC_CPD: 'HCPC CPD Summary',
    NMC_REFLECTIVE_ACCOUNT: 'NMC Reflective Account',
    GMC_SUPPORTING_INFO: 'GMC Supporting Information',
    GENERIC_REFLECTION: 'Professional Reflection',
    PORTFOLIO_SUMMARY: 'Portfolio Summary',
    LEARNING_LOG: 'Learning Log Entry',
    CLINICAL_INCIDENT: 'Clinical Incident Reflection',
    SIGNIFICANT_EVENT: 'Significant Event Analysis',
    CASE_DISCUSSION: 'Case-Based Discussion',
    TEACHING_EVIDENCE: 'Teaching Evidence',
  };

  return titles[template] || 'Professional Documentation';
}

/**
 * Format paragraph with optional word limit
 */
function formatParagraph(text: string, wordLimit?: number): string {
  if (!text) return '';

  let formatted = text.trim();

  if (wordLimit) {
    const words = formatted.split(/\s+/);
    if (words.length > wordLimit) {
      formatted = words.slice(0, wordLimit).join(' ') + '...';
    }
  }

  return formatted;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generate batch documentation from multiple entries
 */
export function generateBatchDocumentation(
  entries: ReflectionEntry[],
  template: DocumentTemplate,
  config: Omit<DocumentConfig, 'template'>
): GeneratedDocument[] {
  return entries.map(entry =>
    generateProfessionalDoc(entry, { ...config, template })
  );
}

/**
 * Export documentation to text file
 */
export function exportDocumentationToText(doc: GeneratedDocument): string {
  return `${doc.title}\n${'='.repeat(doc.title.length)}\n\n${doc.content}\n\n---\nGenerated: ${new Date(doc.generatedDate).toLocaleString()}\nWord Count: ${doc.wordCount}`;
}

/**
 * Get template information
 */
export function getTemplateInfo(template: DocumentTemplate) {
  const info: Record<DocumentTemplate, { name: string; description: string; regulatoryBody: string }> = {
    NMC_REVALIDATION: {
      name: 'NMC Revalidation',
      description: 'Complete revalidation documentation for NMC (Nursing & Midwifery Council)',
      regulatoryBody: 'NMC',
    },
    GMC_APPRAISAL: {
      name: 'GMC Appraisal',
      description: 'Supporting information for GMC appraisal process',
      regulatoryBody: 'GMC',
    },
    HCPC_CPD: {
      name: 'HCPC CPD Summary',
      description: 'CPD record for HCPC (Health & Care Professions Council)',
      regulatoryBody: 'HCPC',
    },
    NMC_REFLECTIVE_ACCOUNT: {
      name: 'NMC Reflective Account',
      description: 'One of 5 required reflective accounts for NMC revalidation',
      regulatoryBody: 'NMC',
    },
    GMC_SUPPORTING_INFO: {
      name: 'GMC Supporting Information',
      description: 'Supporting information for GMC appraisal',
      regulatoryBody: 'GMC',
    },
    GENERIC_REFLECTION: {
      name: 'Generic Reflection',
      description: 'General professional reflection format',
      regulatoryBody: 'Any',
    },
    PORTFOLIO_SUMMARY: {
      name: 'Portfolio Summary',
      description: 'Concise portfolio entry summary',
      regulatoryBody: 'Any',
    },
    LEARNING_LOG: {
      name: 'Learning Log',
      description: 'Simple learning log entry',
      regulatoryBody: 'Any',
    },
    CLINICAL_INCIDENT: {
      name: 'Clinical Incident',
      description: 'Clinical incident reflection',
      regulatoryBody: 'Healthcare',
    },
    SIGNIFICANT_EVENT: {
      name: 'Significant Event Analysis',
      description: 'Structured significant event analysis',
      regulatoryBody: 'Any',
    },
    CASE_DISCUSSION: {
      name: 'Case-Based Discussion',
      description: 'Case-based discussion documentation',
      regulatoryBody: 'Any',
    },
    TEACHING_EVIDENCE: {
      name: 'Teaching Evidence',
      description: 'Evidence of teaching and training activities',
      regulatoryBody: 'Any',
    },
  };

  return info[template];
}

/**
 * Get all available templates
 */
export function getAllTemplates(): Array<{
  template: DocumentTemplate;
  name: string;
  description: string;
  regulatoryBody: string;
}> {
  const templates: DocumentTemplate[] = [
    'NMC_REVALIDATION',
    'NMC_REFLECTIVE_ACCOUNT',
    'GMC_APPRAISAL',
    'GMC_SUPPORTING_INFO',
    'HCPC_CPD',
    'GENERIC_REFLECTION',
    'PORTFOLIO_SUMMARY',
    'LEARNING_LOG',
    'CLINICAL_INCIDENT',
    'SIGNIFICANT_EVENT',
    'CASE_DISCUSSION',
    'TEACHING_EVIDENCE',
  ];

  return templates.map(template => ({
    template,
    ...getTemplateInfo(template),
  }));
}
