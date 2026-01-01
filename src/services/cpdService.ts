/**
 * CPD Service
 * Tracks and manages Continuing Professional Development records
 * Automatically converts reflections and activities into CPD credits
 */

import type { Entry, ReflectionEntry } from '../types';
import type { HolodeckEntry } from '../components/holodeck/types';
import {
  type CPDRecord,
  type CPDSummary,
  type CPDCountry,
  type CPDCategoryType,
  CPD_HOUR_ESTIMATES,
  getStandardForCountry,
  getCurrentCycleDates,
  meetsRequirements,
  getCategoryInfo,
  suggestCPDCategory,
} from '../data/cpdStandards';

/**
 * Generate CPD record from a reflection entry
 */
export function generateCPDFromReflection(entry: ReflectionEntry): CPDRecord {
  const category: CPDCategoryType = 'reflection';
  const hours = CPD_HOUR_ESTIMATES['reflection-session'];

  // Extract text content for description
  let description = '';
  if (entry.answers) {
    const answerTexts = Object.values(entry.answers)
      .filter((a) => typeof a === 'string')
      .join('. ');
    description = answerTexts.substring(0, 200) + (answerTexts.length > 200 ? '...' : '');
  }

  // Extract learning outcomes from reflection
  const learningOutcomes: string[] = [];
  if (entry.answers?.learning) {
    learningOutcomes.push(entry.answers.learning as string);
  }
  if (entry.answers?.takeaway) {
    learningOutcomes.push(entry.answers.takeaway as string);
  }

  return {
    id: `cpd_${entry.id}`,
    date: entry.date,
    title: `Reflection: ${entry.model || 'Professional Development'}`,
    category,
    hours,
    description,
    reflectionText: description,
    learningOutcomes: learningOutcomes.length > 0 ? learningOutcomes : undefined,
    linkedEntryId: entry.id,
    evidenceType: 'reflection',
    verified: true,
    tags: ['reflection', typeof entry.model === 'string' ? entry.model.toLowerCase() : 'general'],
    createdAt: (entry as any).createdAt || entry.date,
  };
}

/**
 * Generate CPD record from a holodeck entry
 */
export function generateCPDFromHolodeck(entry: HolodeckEntry): CPDRecord {
  const category: CPDCategoryType = 'reflection';
  const hours = CPD_HOUR_ESTIMATES['holodeck-space'];

  // Create description from answers
  const description = entry.answers.slice(0, 2).join('. ').substring(0, 200);

  return {
    id: `cpd_holodeck_${entry.id}`,
    date: entry.date,
    title: `Holodeck: ${entry.spaceName}`,
    category,
    hours,
    description,
    reflectionText: entry.answers.join('\n\n'),
    learningOutcomes: [
      `Completed ${entry.spaceName} exercise`,
      `Explored: ${entry.prompts[0]}`,
    ],
    linkedEntryId: entry.id,
    evidenceType: 'reflection',
    verified: true,
    tags: ['holodeck', entry.spaceId],
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : entry.date,
  };
}

/**
 * Generate CPD record from an incident entry
 */
export function generateCPDFromIncident(entry: Entry): CPDRecord {
  const category: CPDCategoryType = 'clinical-practice';
  const hours = CPD_HOUR_ESTIMATES['incident-report'];

  const notes = (entry as any).notes || '';
  const description = notes.substring(0, 200) + (notes.length > 200 ? '...' : '');

  return {
    id: `cpd_incident_${entry.id}`,
    date: entry.date,
    title: 'Clinical Incident Reflection',
    category,
    hours,
    description,
    reflectionText: notes,
    learningOutcomes: ['Clinical incident analysis and learning'],
    linkedEntryId: entry.id,
    evidenceType: 'reflection',
    verified: true,
    tags: ['incident', 'clinical-practice'],
    createdAt: entry.date,
  };
}

/**
 * Get all CPD records from user entries
 */
export function getAllCPDRecords(
  entries: Entry[],
  holodeckEntries: HolodeckEntry[] = [],
  manualRecords: CPDRecord[] = []
): CPDRecord[] {
  const records: CPDRecord[] = [];

  // Convert reflection entries
  entries.forEach((entry) => {
    if (entry.type === 'REFLECTION') {
      records.push(generateCPDFromReflection(entry as ReflectionEntry));
    } else if (entry.type === 'INCIDENT') {
      records.push(generateCPDFromIncident(entry));
    }
  });

  // Convert holodeck entries
  holodeckEntries.forEach((entry) => {
    if (entry.completed) {
      records.push(generateCPDFromHolodeck(entry));
    }
  });

  // Add manual records
  records.push(...manualRecords);

  // Sort by date (newest first)
  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Calculate CPD summary for a given standard and date range
 */
export function calculateCPDSummary(
  records: CPDRecord[],
  country: CPDCountry
): CPDSummary {
  const standard = getStandardForCountry(country);
  const cycleDates = getCurrentCycleDates(standard);

  // Filter records within current cycle
  const cycleRecords = records.filter((r) => {
    const recordDate = new Date(r.date);
    return (
      recordDate >= new Date(cycleDates.start) &&
      recordDate <= new Date(cycleDates.end)
    );
  });

  // Calculate total hours
  const totalHours = cycleRecords.reduce((sum, r) => sum + r.hours, 0);

  // Calculate category breakdown
  const categoryMap = new Map<CPDCategoryType, number>();
  cycleRecords.forEach((r) => {
    const current = categoryMap.get(r.category) || 0;
    categoryMap.set(r.category, current + r.hours);
  });

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, hours]) => ({
    category,
    hours,
    percentage: totalHours > 0 ? (hours / totalHours) * 100 : 0,
  }));

  // Sort by hours descending
  categoryBreakdown.sort((a, b) => b.hours - a.hours);

  // Check requirements
  const complianceCheck = meetsRequirements({
    standard,
    cycleStartDate: cycleDates.start,
    cycleEndDate: cycleDates.end,
    totalHours,
    categoryBreakdown,
    meetsRequirements: false,
    gaps: [],
    recordCount: cycleRecords.length,
  });

  return {
    standard,
    cycleStartDate: cycleDates.start,
    cycleEndDate: cycleDates.end,
    totalHours,
    categoryBreakdown,
    meetsRequirements: complianceCheck.meets,
    gaps: complianceCheck.gaps,
    recordCount: cycleRecords.length,
  };
}

/**
 * Export CPD records to CSV format (Enhanced for regulatory compliance)
 */
export function exportCPDToCSV(records: CPDRecord[], summary: CPDSummary): string {
  const lines: string[] = [];
  const country = summary.standard.country;

  // Header section
  lines.push(`"CPD Portfolio Export - ${country}"`);
  lines.push(`"Generated: ${new Date().toLocaleString()}"`);
  lines.push(`"Export ID: ${Date.now()}"`);
  lines.push(`""`);
  lines.push(`"REGULATORY INFORMATION"`);
  lines.push(`"Country: ${country}"`);
  lines.push(`"Regulatory Body: ${summary.standard.regulatoryBody}"`);
  lines.push(`"CPD Cycle: ${new Date(summary.cycleStartDate).toLocaleDateString()} to ${new Date(summary.cycleEndDate).toLocaleDateString()}"`);
  lines.push(`"Cycle Period: ${summary.standard.cycleYears} year(s)"`);
  lines.push(`""`);

  // Compliance Status
  lines.push(`"COMPLIANCE STATUS"`);
  lines.push(`"Total Hours Completed: ${summary.totalHours.toFixed(1)}"`);
  lines.push(`"Annual Requirement: ${summary.standard.annualRequirement.totalHours} hours"`);
  lines.push(`"Status: ${summary.meetsRequirements ? '✓ MEETS REQUIREMENTS' : '✗ REQUIREMENTS NOT MET'}"`);
  if (summary.standard.annualRequirement.minimumReflection) {
    const reflectionHours = summary.categoryBreakdown.find(c => c.category === 'reflection')?.hours || 0;
    lines.push(`"Reflection Hours: ${reflectionHours.toFixed(1)} / ${summary.standard.annualRequirement.minimumReflection} required"`);
  }
  lines.push(`""`);

  // Category Breakdown with Requirements
  lines.push(`"CATEGORY BREAKDOWN"`);
  lines.push(`"Category","Hours Completed","Percentage","Minimum Required","Status"`);
  summary.categoryBreakdown.forEach((cat) => {
    const categoryInfo = getCategoryInfo(cat.category);
    const requirement = summary.standard.annualRequirement.categories?.find(c => c.category === cat.category);
    const minRequired = requirement ? requirement.minimumHours.toString() : 'None';
    const meetsMin = !requirement || cat.hours >= requirement.minimumHours;
    const status = meetsMin ? '✓' : '✗';
    lines.push(`"${categoryInfo.label}","${cat.hours.toFixed(1)}","${cat.percentage.toFixed(1)}%","${minRequired}","${status}"`);
  });
  lines.push(`""`);

  // Gaps Analysis
  if (summary.gaps.length > 0) {
    lines.push(`"REQUIREMENTS GAPS"`);
    summary.gaps.forEach((gap) => {
      lines.push(`"⚠ ${gap}"`);
    });
    lines.push(`""`);
  }

  // Country-Specific Evidence Requirements
  lines.push(`"EVIDENCE REQUIREMENTS FOR ${country}"`);
  summary.standard.evidenceRequired.forEach((req) => {
    lines.push(`"• ${req}"`);
  });
  lines.push(`""`);
  lines.push(`"Notes: ${summary.standard.notes}"`);
  lines.push(`""`);

  // Detailed CPD Records (Regulatory Format)
  lines.push(`"DETAILED CPD ACTIVITY LOG"`);
  lines.push(
    `"Activity Date","Activity Title","CPD Category","Hours Claimed","Evidence Type","Learning Outcomes","Reflection","Impact on Practice","Tags","Record ID"`
  );

  records.forEach((record) => {
    const categoryInfo = getCategoryInfo(record.category);
    const learningOutcomes = record.learningOutcomes?.join('; ') || 'See reflection notes';
    const tags = record.tags.join(', ');
    const description = record.description.replace(/"/g, '""'); // Escape quotes
    const reflection = record.reflectionText?.replace(/"/g, '""').substring(0, 500) || 'See linked entry';
    const impact = `Professional development in ${categoryInfo.label.toLowerCase()}`;

    lines.push(
      `"${new Date(record.date).toLocaleDateString()}","${record.title}","${categoryInfo.label}","${record.hours.toFixed(2)}","${record.evidenceType}","${learningOutcomes}","${reflection}","${impact}","${tags}","${record.id}"`
    );
  });

  lines.push(`""`);
  lines.push(`"Total Records: ${records.length}"`);
  lines.push(`"Total Hours: ${summary.totalHours.toFixed(2)}"`);
  lines.push(`""`);

  // Footer certification statement
  lines.push(`"DECLARATION"`);
  lines.push(`"I confirm that the CPD activities listed above are accurate and have been completed as stated."`);
  lines.push(`"Signature: _______________________  Date: _______________________"`);

  return lines.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCPDExport(records: CPDRecord[], summary: CPDSummary): void {
  const csv = exportCPDToCSV(records, summary);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  const filename = `CPD_Portfolio_${summary.standard.country}_${new Date().toISOString().split('T')[0]}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Create manual CPD record
 */
export function createManualCPDRecord(
  title: string,
  category: CPDCategoryType,
  hours: number,
  date: string,
  description: string,
  evidenceType: CPDRecord['evidenceType'],
  learningOutcomes?: string[]
): CPDRecord {
  return {
    id: `cpd_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date,
    title,
    category,
    hours,
    description,
    learningOutcomes,
    evidenceType,
    verified: false, // Manual records need verification
    tags: [category, evidenceType],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Save manual CPD records to localStorage
 */
export function saveManualCPDRecords(records: CPDRecord[]): void {
  localStorage.setItem('manualCPDRecords', JSON.stringify(records));
}

/**
 * Load manual CPD records from localStorage
 */
export function loadManualCPDRecords(): CPDRecord[] {
  const saved = localStorage.getItem('manualCPDRecords');
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

/**
 * Get suggested hours for activity type
 */
export function getSuggestedHours(activityType: string): number {
  return CPD_HOUR_ESTIMATES[activityType] || 1.0;
}
