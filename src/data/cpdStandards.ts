/**
 * CPD (Continuing Professional Development) Standards
 * Standards for UK, US, Australia, and Canada
 * Maps reflections and activities to professional requirements
 */

export type CPDCountry =
  | 'UK_GMC'           // General Medical Council (Doctors)
  | 'UK_NMC'           // Nursing and Midwifery Council
  | 'UK_HCPC'          // Health and Care Professions Council
  | 'UK_GPhC'          // General Pharmaceutical Council
  | 'UK_GDC'           // General Dental Council
  | 'UK_NHS'           // NHS Trust Requirements
  | 'US'               // Various State Medical Boards
  | 'Australia'        // AHPRA
  | 'Canada'           // RCPSC
  | 'Ireland_NMBI'     // Nursing and Midwifery Board of Ireland
  | 'Ireland_CORU';    // Health & Social Care Professionals Council

export type CPDCategoryType =
  | 'clinical-practice'
  | 'teaching-training'
  | 'research-audit'
  | 'learning-development'
  | 'leadership-management'
  | 'quality-improvement'
  | 'reflection'
  | 'professional-activities'
  | 'peer-review'
  | 'self-directed-learning';

export interface CPDCategory {
  id: CPDCategoryType;
  label: string;
  description: string;
  examples: string[];
  color: string;
}

export interface CPDStandard {
  country: CPDCountry;
  regulatoryBody: string;
  annualRequirement: {
    totalHours: number;
    minimumReflection?: number;
    categories?: {
      category: CPDCategoryType;
      minimumHours: number;
    }[];
  };
  cycleYears: number; // How many years per CPD cycle
  evidenceRequired: string[];
  notes: string;
}

export interface CPDRecord {
  id: string;
  date: string; // ISO date
  title: string;
  category: CPDCategoryType;
  hours: number;
  description: string;
  reflectionText?: string;
  learningOutcomes?: string[];
  linkedEntryId?: string; // Link to reflection or holodeck entry
  evidenceType: 'reflection' | 'course' | 'conference' | 'reading' | 'teaching' | 'audit' | 'other';
  verified: boolean;
  tags: string[];
  createdAt: string;
}

export interface CPDSummary {
  standard: CPDStandard;
  cycleStartDate: string;
  cycleEndDate: string;
  totalHours: number;
  categoryBreakdown: {
    category: CPDCategoryType;
    hours: number;
    percentage: number;
  }[];
  meetsRequirements: boolean;
  gaps: string[];
  recordCount: number;
}

// CPD Category Definitions
export const CPD_CATEGORIES: Record<CPDCategoryType, CPDCategory> = {
  'clinical-practice': {
    id: 'clinical-practice',
    label: 'Clinical Practice',
    description: 'Direct patient care, clinical decision-making, and practice-based learning',
    examples: [
      'Patient case reflections',
      'Clinical incident analysis',
      'Difficult case discussions',
      'Practice-based learning',
    ],
    color: '#3b82f6',
  },
  'teaching-training': {
    id: 'teaching-training',
    label: 'Teaching & Training',
    description: 'Educational activities including teaching, mentoring, and supervising others',
    examples: [
      'Teaching medical students',
      'Supervising junior colleagues',
      'Mentorship programs',
      'Delivering training sessions',
    ],
    color: '#8b5cf6',
  },
  'research-audit': {
    id: 'research-audit',
    label: 'Research & Audit',
    description: 'Research activities, clinical audits, and quality improvement projects',
    examples: [
      'Clinical research participation',
      'Audit projects',
      'Quality improvement initiatives',
      'Data analysis and evaluation',
    ],
    color: '#06b6d4',
  },
  'learning-development': {
    id: 'learning-development',
    label: 'Learning & Development',
    description: 'Formal courses, conferences, workshops, and structured learning',
    examples: [
      'Attending courses and workshops',
      'Professional conferences',
      'Online learning modules',
      'Certification programs',
    ],
    color: '#10b981',
  },
  'leadership-management': {
    id: 'leadership-management',
    label: 'Leadership & Management',
    description: 'Management responsibilities, leadership development, and organizational work',
    examples: [
      'Team leadership roles',
      'Committee participation',
      'Policy development',
      'Service improvement leadership',
    ],
    color: '#f59e0b',
  },
  'quality-improvement': {
    id: 'quality-improvement',
    label: 'Quality Improvement',
    description: 'Patient safety initiatives, error prevention, and service quality enhancement',
    examples: [
      'Patient safety projects',
      'Root cause analysis',
      'Process improvement work',
      'Safety culture initiatives',
    ],
    color: '#ef4444',
  },
  reflection: {
    id: 'reflection',
    label: 'Reflective Practice',
    description: 'Structured reflection on practice, including journals and case reviews',
    examples: [
      'Reflective writing',
      'Significant event analysis',
      'Learning logs',
      'Professional development planning',
    ],
    color: '#ec4899',
  },
  'professional-activities': {
    id: 'professional-activities',
    label: 'Professional Activities',
    description: 'Professional body involvement, peer review, and examination participation',
    examples: [
      'Professional body membership',
      'Peer review activities',
      'Examination participation',
      'Guideline development',
    ],
    color: '#6366f1',
  },
  'peer-review': {
    id: 'peer-review',
    label: 'Peer Review & Discussion',
    description: 'Peer group discussions, journal clubs, and collaborative learning',
    examples: [
      'Journal clubs',
      'Peer discussion groups',
      'Case conferences',
      'Multidisciplinary meetings',
    ],
    color: '#14b8a6',
  },
  'self-directed-learning': {
    id: 'self-directed-learning',
    label: 'Self-Directed Learning',
    description: 'Independent study, reading, and self-guided professional development',
    examples: [
      'Journal article reading',
      'Textbook study',
      'Online resource review',
      'Podcast and video learning',
    ],
    color: '#f43f5e',
  },
};

// CPD Standards by Country
export const CPD_STANDARDS: Record<CPDCountry, CPDStandard> = {
  UK_GMC: {
    country: 'UK_GMC',
    regulatoryBody: 'General Medical Council (GMC)',
    annualRequirement: {
      totalHours: 50,
      minimumReflection: 12,
      categories: [
        { category: 'reflection', minimumHours: 12 },
        { category: 'clinical-practice', minimumHours: 20 },
      ],
    },
    cycleYears: 1,
    evidenceRequired: [
      'Personal Development Plan (PDP)',
      'Reflective accounts',
      'Certificates of attendance',
      'Supporting information (e.g., feedback)',
    ],
    notes:
      '50 hours annually, with at least 12 hours of reflective practice. Evidence must cover a range of CPD activities.',
  },
  UK_NMC: {
    country: 'UK_NMC',
    regulatoryBody: 'Nursing and Midwifery Council (NMC)',
    annualRequirement: {
      totalHours: 35,
      minimumReflection: 5,
      categories: [
        { category: 'reflection', minimumHours: 5 },
        { category: 'clinical-practice', minimumHours: 20 },
      ],
    },
    cycleYears: 3,
    evidenceRequired: [
      'Practice-related feedback (minimum 5 pieces)',
      'Written reflective accounts (minimum 5)',
      'CPD activity records',
      'Confirmation of 450 practice hours per year',
    ],
    notes:
      '35 hours over 3 years (minimum 20 participatory hours). Must include 5 written reflections and 5 pieces of practice-related feedback.',
  },
  UK_HCPC: {
    country: 'UK_HCPC',
    regulatoryBody: 'Health and Care Professions Council (HCPC)',
    annualRequirement: {
      totalHours: 30,
      minimumReflection: 0,
      categories: [],
    },
    cycleYears: 2,
    evidenceRequired: [
      'CPD profile summary',
      'Written reflective notes',
      'Evidence of activities undertaken',
      'Demonstration of learning benefit',
    ],
    notes:
      'Continuous professional development required. Must maintain a CPD record and be able to demonstrate how CPD benefits service users.',
  },
  UK_GPhC: {
    country: 'UK_GPhC',
    regulatoryBody: 'General Pharmaceutical Council (GPhC)',
    annualRequirement: {
      totalHours: 9,
      minimumReflection: 9,
      categories: [
        { category: 'reflection', minimumHours: 9 },
      ],
    },
    cycleYears: 1,
    evidenceRequired: [
      'CPD records (minimum 9 entries annually)',
      'Reflective accounts for each entry',
      'Evidence of learning and impact',
      'Records must relate to scope of practice',
    ],
    notes:
      'Minimum 9 CPD entries per year. Each must include: What did you learn? How did you learn it? How did you apply it? Four entries must be planned in advance.',
  },
  UK_GDC: {
    country: 'UK_GDC',
    regulatoryBody: 'General Dental Council (GDC)',
    annualRequirement: {
      totalHours: 250,
      minimumReflection: 0,
      categories: [],
    },
    cycleYears: 5,
    evidenceRequired: [
      'Personal Development Plan (PDP)',
      'CPD certificates and records',
      'Reflective logs',
      'Evidence covering all GDC development outcomes',
    ],
    notes:
      '250 hours over 5-year cycle. Must include verifiable and non-verifiable CPD. Must cover all four GDC development outcomes (A-D).',
  },
  UK_NHS: {
    country: 'UK_NHS',
    regulatoryBody: 'NHS Trust / Knowledge and Skills Framework',
    annualRequirement: {
      totalHours: 35,
      minimumReflection: 0,
      categories: [
        { category: 'learning-development', minimumHours: 20 },
      ],
    },
    cycleYears: 1,
    evidenceRequired: [
      'KSF Personal Development Plan',
      'Appraisal documentation',
      'Training certificates',
      'Evidence of competency maintenance',
    ],
    notes:
      'Requirements vary by trust and role. Typically aligned with KSF competencies and annual appraisal process.',
  },
  US: {
    country: 'US',
    regulatoryBody: 'Various State Medical Boards / ABMS',
    annualRequirement: {
      totalHours: 25,
      categories: [
        { category: 'learning-development', minimumHours: 20 },
      ],
    },
    cycleYears: 1,
    evidenceRequired: [
      'CME certificates',
      'Course completion records',
      'MOC activities (if applicable)',
    ],
    notes:
      'Requirements vary by state and specialty board. Typically 25-50 CME credits annually. MOC may be required for board certification.',
  },
  Australia: {
    country: 'Australia',
    regulatoryBody: 'Australian Health Practitioner Regulation Agency (AHPRA)',
    annualRequirement: {
      totalHours: 50,
      categories: [
        { category: 'learning-development', minimumHours: 25 },
        { category: 'reflection', minimumHours: 5 },
      ],
    },
    cycleYears: 1,
    evidenceRequired: [
      'CPD plan',
      'Activity records',
      'Reflection on learning',
      'Evaluation of outcomes',
    ],
    notes:
      '50 hours annually across educational activities, reviewing performance, and measuring outcomes. Must include reflection.',
  },
  Canada: {
    country: 'Canada',
    regulatoryBody: 'Royal College of Physicians and Surgeons of Canada (RCPSC)',
    annualRequirement: {
      totalHours: 25,
      categories: [
        { category: 'learning-development', minimumHours: 12 },
      ],
    },
    cycleYears: 5,
    evidenceRequired: [
      'Learning plans',
      'Activity documentation',
      'Reflective summaries',
      'Impact assessment',
    ],
    notes:
      'Minimum 25 credits per year (125 over 5 years). Must include Section 1 (Group Learning), Section 2 (Self-Learning), and Section 3 (Assessment).',
  },
  Ireland_NMBI: {
    country: 'Ireland_NMBI',
    regulatoryBody: 'Nursing and Midwifery Board of Ireland (NMBI)',
    annualRequirement: {
      totalHours: 30,
      minimumReflection: 0,
      categories: [
        { category: 'clinical-practice', minimumHours: 20 },
      ],
    },
    cycleYears: 1,
    evidenceRequired: [
      'Professional Development Plan',
      'CPD Portfolio',
      'Evidence of learning activities',
      'Reflective practice records',
    ],
    notes:
      'Minimum 30 hours annually. Must maintain a CPD portfolio aligned with scope of practice and NMBI Code.',
  },
  Ireland_CORU: {
    country: 'Ireland_CORU',
    regulatoryBody: 'Health & Social Care Professionals Council (CORU)',
    annualRequirement: {
      totalHours: 20,
      minimumReflection: 0,
      categories: [
        { category: 'learning-development', minimumHours: 10 },
      ],
    },
    cycleYears: 2,
    evidenceRequired: [
      'CPD plan',
      'CPD log/diary',
      'Evidence of completed activities',
      'Reflection on learning outcomes',
    ],
    notes:
      'Requirements vary by profession. Must engage in CPD relevant to scope of practice and maintain comprehensive records.',
  },
};

// Default hour estimates for different activity types
export const CPD_HOUR_ESTIMATES: Record<string, number> = {
  // Reflection activities
  'quick-capture': 0.25, // 15 minutes
  'reflection-session': 1.0, // 1 hour
  'holodeck-space': 0.5, // 30 minutes
  'incident-report': 0.5, // 30 minutes

  // Learning activities
  'library-resource-article': 0.25, // 15 minutes
  'library-resource-video': 0.5, // 30 minutes
  'library-resource-course': 2.0, // 2 hours
  'library-resource-book': 5.0, // 5 hours

  // Professional activities
  conference: 8.0,
  workshop: 4.0,
  'journal-club': 1.0,
  teaching: 2.0,
  audit: 10.0,
};

// Helper function to get category info
export function getCategoryInfo(category: CPDCategoryType): CPDCategory {
  return CPD_CATEGORIES[category];
}

// Helper function to get standard for country
export function getStandardForCountry(country: CPDCountry): CPDStandard {
  return CPD_STANDARDS[country];
}

// Map reflection/holodeck topics to CPD categories
export function suggestCPDCategory(
  activityType: 'reflection' | 'holodeck' | 'incident' | 'library',
  content?: string
): CPDCategoryType {
  // Default mapping
  if (activityType === 'reflection') return 'reflection';
  if (activityType === 'incident') return 'clinical-practice';
  if (activityType === 'library') return 'self-directed-learning';
  if (activityType === 'holodeck') return 'reflection';

  // Content-based suggestions could be added here
  // For now, return default
  return 'reflection';
}

// Calculate if requirements are met
export function meetsRequirements(summary: CPDSummary): {
  meets: boolean;
  gaps: string[];
} {
  const { standard, totalHours, categoryBreakdown } = summary;
  const gaps: string[] = [];

  // Check total hours
  if (totalHours < standard.annualRequirement.totalHours) {
    const shortfall = standard.annualRequirement.totalHours - totalHours;
    gaps.push(
      `Need ${shortfall.toFixed(1)} more hours to meet total requirement of ${standard.annualRequirement.totalHours} hours`
    );
  }

  // Check minimum reflection hours
  if (standard.annualRequirement.minimumReflection) {
    const reflectionHours =
      categoryBreakdown.find((c) => c.category === 'reflection')?.hours || 0;
    if (reflectionHours < standard.annualRequirement.minimumReflection) {
      const shortfall =
        standard.annualRequirement.minimumReflection - reflectionHours;
      gaps.push(
        `Need ${shortfall.toFixed(1)} more reflection hours (minimum ${standard.annualRequirement.minimumReflection} required)`
      );
    }
  }

  // Check category minimums
  if (standard.annualRequirement.categories) {
    standard.annualRequirement.categories.forEach((req) => {
      const actualHours =
        categoryBreakdown.find((c) => c.category === req.category)?.hours || 0;
      if (actualHours < req.minimumHours) {
        const shortfall = req.minimumHours - actualHours;
        const categoryLabel = CPD_CATEGORIES[req.category].label;
        gaps.push(
          `Need ${shortfall.toFixed(1)} more hours in ${categoryLabel} (minimum ${req.minimumHours} required)`
        );
      }
    });
  }

  return {
    meets: gaps.length === 0,
    gaps,
  };
}

// Generate CPD cycle dates
export function getCurrentCycleDates(
  standard: CPDStandard
): { start: string; end: string } {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Most standards use calendar year
  if (standard.cycleYears === 1) {
    return {
      start: `${currentYear}-01-01T00:00:00Z`,
      end: `${currentYear}-12-31T23:59:59Z`,
    };
  }

  // Multi-year cycles (e.g., Canada's 5-year)
  // Start from beginning of current 5-year period
  const cycleStartYear = Math.floor(currentYear / standard.cycleYears) * standard.cycleYears;
  const cycleEndYear = cycleStartYear + standard.cycleYears - 1;

  return {
    start: `${cycleStartYear}-01-01T00:00:00Z`,
    end: `${cycleEndYear}-12-31T23:59:59Z`,
  };
}
