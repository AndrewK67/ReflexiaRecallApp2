// Rewards Catalog Service - All available rewards for redemption
// Nursing-specific rewards with XP pricing and delivery details

export type RewardType = 'digital' | 'physical' | 'experience';
export type RewardCategory = 'guides' | 'checklists' | 'cards' | 'tools' | 'experiences';
export type ProfessionType = 'nursing' | 'all';

export interface Reward {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  xpCost: number;
  type: RewardType;
  category: RewardCategory;
  profession: ProfessionType;
  imageUrl?: string;
  shippingCost?: number; // GBP, only for physical items
  estimatedDelivery?: string; // e.g., "Instant", "3-5 business days"
  fileUrl?: string; // For digital downloads
  highlights: string[];
  includes?: string[];
}

export const REWARDS_CATALOG: Reward[] = [
  // DIGITAL GUIDES (500-5,000 XP)
  {
    id: 'NURSING_MASTERY_GUIDE',
    name: 'Complete Nursing Mastery Guide',
    description: '85-page comprehensive guide to NMC revalidation, CPD planning, and career progression',
    longDescription: 'The ultimate resource for UK registered nurses. Includes 50 clinical reflection scenarios, complete NMC revalidation walkthrough, CPD planning for shift workers, career progression pathways, time-saving hacks from veteran nurses, and ready-to-use templates.',
    xpCost: 5000,
    type: 'digital',
    category: 'guides',
    profession: 'nursing',
    estimatedDelivery: 'Instant',
    highlights: [
      '50 clinical scenarios with reflection templates',
      'Complete NMC revalidation insider guide',
      'CPD planning for 12-hour shift workers',
      'Career progression roadmap (HCA → Advanced Practitioner)',
      'Time-saving hacks from experienced nurses',
      '52 monthly reflection prompts'
    ],
    includes: [
      'PDF download (85 pages)',
      'Editable Word templates',
      'Monthly CPD log spreadsheet',
      'Reflective account template bank'
    ]
  },
  {
    id: 'NMC_REVALIDATION_30DAY',
    name: 'NMC Revalidation 30-Day Checklist',
    description: 'Week-by-week breakdown of everything you need for stress-free revalidation',
    longDescription: 'Never miss a revalidation deadline again. This printable checklist breaks down the entire process into 4 manageable weeks with daily tasks, evidence collection guide, and submission prep.',
    xpCost: 500,
    type: 'digital',
    category: 'checklists',
    profession: 'nursing',
    estimatedDelivery: 'Instant',
    highlights: [
      '4-week structured plan',
      'Daily task breakdowns',
      'Evidence collection tracker',
      'Submission day checklist'
    ],
    includes: ['PDF download', 'Printable checklist']
  },
  {
    id: 'NEW_WARD_ORIENTATION',
    name: 'New Ward Orientation Survival Guide',
    description: '5-day checklist to confidently navigate your first week on a new ward',
    longDescription: 'Starting on a new ward? This comprehensive checklist covers everything from safety essentials to key people to meet, systems to learn, and clinical protocols to review.',
    xpCost: 500,
    type: 'digital',
    category: 'checklists',
    profession: 'nursing',
    estimatedDelivery: 'Instant',
    highlights: [
      'Day-by-day breakdown',
      'Safety essentials first',
      'Key people to meet',
      'Systems and processes guide'
    ],
    includes: ['PDF download', 'Printable checklist']
  },
  {
    id: 'SBAR_HANDOVER_TEMPLATE',
    name: 'SBAR Handover Excellence Template',
    description: 'Master the art of shift handover with structured SBAR templates and example scripts',
    longDescription: 'Deliver clear, concise handovers every time. Includes SBAR template, example scripts for common scenarios, and common mistakes to avoid.',
    xpCost: 500,
    type: 'digital',
    category: 'checklists',
    profession: 'nursing',
    estimatedDelivery: 'Instant',
    highlights: [
      'SBAR template with prompts',
      'Example handover scripts',
      'Common mistakes to avoid',
      'Quick reference card'
    ],
    includes: ['PDF download', 'Printable reference card']
  },
  {
    id: 'CLINICAL_EMERGENCY_REFERENCE',
    name: 'Clinical Emergency Quick Reference',
    description: 'Pocket-sized protocols for cardiac arrest, sepsis, anaphylaxis, and more',
    longDescription: 'Keep essential emergency protocols at your fingertips. Covers cardiac arrest, Sepsis Six, anaphylaxis, choking, hypoglycemia, and falls management.',
    xpCost: 1000,
    type: 'digital',
    category: 'checklists',
    profession: 'nursing',
    estimatedDelivery: 'Instant',
    highlights: [
      'Cardiac arrest protocol',
      'Sepsis Six quick reference',
      'Anaphylaxis management',
      'Hypoglycemia response',
      'Falls protocol'
    ],
    includes: ['PDF download', 'Printable pocket card']
  },
  {
    id: 'IV_CANNULATION_SUCCESS',
    name: 'IV Cannulation Success Guide',
    description: 'Step-by-step technique, vein selection tips, and troubleshooting guide',
    longDescription: 'Improve your cannulation success rate with expert tips on vein selection, size guide, step-by-step technique, common problems, and when to escalate.',
    xpCost: 750,
    type: 'digital',
    category: 'checklists',
    profession: 'nursing',
    estimatedDelivery: 'Instant',
    highlights: [
      'Vein selection masterclass',
      'Size guide (22G-16G)',
      'Step-by-step technique',
      'Troubleshooting guide',
      'When to stop and escalate'
    ],
    includes: ['PDF download', 'Printable quick reference']
  },

  // PHYSICAL CARDS - REFLECTION DECK (15,000 XP digital / 50,000 XP physical)
  {
    id: 'REFLECTION_DECK_DIGITAL',
    name: '54-Card Reflection Deck (Digital)',
    description: 'Complete 54-card deck with weekly themes and daily prompts - PDF version',
    longDescription: 'The complete Reflexia Reflection Deck in digital format. Features 52 weekly themes (one for each week of the year), plus Birthday and Significant Day special cards. Each card is also a standard playing card with suit-based reflection categories.',
    xpCost: 15000,
    type: 'digital',
    category: 'cards',
    profession: 'all',
    estimatedDelivery: 'Instant',
    highlights: [
      '52 weekly reflection themes',
      '2 special occasion cards (Birthday + Significant Day)',
      'Dual-sided design (daily prompts + weekly themes)',
      'Standard playing card format',
      'Printable at home or print shop'
    ],
    includes: [
      'PDF with all 54 cards',
      'Print-ready files (300 DPI)',
      'Usage guide',
      'Weekly draw ritual instructions'
    ]
  },
  {
    id: 'REFLECTION_DECK_PHYSICAL',
    name: '54-Card Reflection Deck (Physical)',
    description: 'Professional printed reflection deck delivered to your door',
    longDescription: 'The complete Reflexia Reflection Deck professionally printed on premium 310gsm cardstock. Draw one card each week to guide your reflections for the entire year. Fully functional as standard playing cards too!',
    xpCost: 50000,
    type: 'physical',
    category: 'cards',
    profession: 'all',
    shippingCost: 3.00,
    estimatedDelivery: '7-10 business days',
    highlights: [
      'Premium 310gsm cardstock',
      'Professional linen finish',
      'Poker-size cards (63.5mm × 88.9mm)',
      '52 weekly themes + 2 special cards',
      'Durable protective box',
      'Fully functional playing cards'
    ],
    includes: [
      'Physical 54-card deck',
      'Protective storage box',
      'Printed usage guide',
      'Digital PDF backup'
    ]
  },

  // NMC CODE QUICK REFERENCE CARDS (1,500 XP digital / 35,000 XP physical)
  {
    id: 'NMC_CODE_CARDS_DIGITAL',
    name: 'NMC Code Quick Reference Cards (Digital)',
    description: '25 business card-sized references covering all NMC Code standards - PDF',
    longDescription: 'All 25 NMC Code standards condensed into pocket-sized quick reference cards. Perfect for printing and laminating to keep on your lanyard or in your pocket.',
    xpCost: 1500,
    type: 'digital',
    category: 'cards',
    profession: 'nursing',
    estimatedDelivery: 'Instant',
    highlights: [
      '25 NMC Code standards',
      'Scenario-based examples',
      'Dual-sided design',
      'Business card size (85mm × 55mm)',
      'Laminate-ready format'
    ],
    includes: [
      'PDF with all 25 cards',
      'Print-ready files',
      'Lamination guide'
    ]
  },
  {
    id: 'NMC_CODE_CARDS_PHYSICAL',
    name: 'NMC Code Quick Reference Cards (Physical)',
    description: 'Professionally printed and laminated NMC Code reference cards',
    longDescription: 'Pre-printed, laminated set of all 25 NMC Code quick reference cards. Clip them to your lanyard, keep them in your pocket, or use them as study aids. Waterproof and durable for clinical environments.',
    xpCost: 35000,
    type: 'physical',
    category: 'cards',
    profession: 'nursing',
    shippingCost: 3.00,
    estimatedDelivery: '5-7 business days',
    highlights: [
      '25 laminated cards',
      'Waterproof and durable',
      'Lanyard hole punch included',
      'Clinical environment tested',
      'All 4 NMC Code pillars covered'
    ],
    includes: [
      'Physical laminated card set',
      'Protective storage case',
      'Metal lanyard clip',
      'Digital PDF backup'
    ]
  },

  // PREMIUM PHYSICAL ITEMS (25,000-100,000 XP)
  {
    id: 'REFLEXIA_ENAMEL_PIN',
    name: 'Reflexia Enamel Pin',
    description: 'Limited edition enamel pin for your uniform or lanyard',
    longDescription: 'Show your commitment to reflective practice with this beautiful enamel pin. Features the Reflexia logo with "Reflection in Action" motto.',
    xpCost: 25000,
    type: 'physical',
    category: 'tools',
    profession: 'all',
    shippingCost: 1.50,
    estimatedDelivery: '5-7 business days',
    highlights: [
      'Hard enamel construction',
      'Butterfly clutch back',
      '25mm diameter',
      'Premium finish'
    ],
    includes: ['Enamel pin', 'Protective backing card']
  },
  {
    id: 'CUSTOM_NAMEPLATE',
    name: 'Custom Engraved Nameplate',
    description: 'Personalized desk/locker nameplate with your credentials',
    longDescription: 'Laser-engraved wooden or acrylic nameplate with your name and professional credentials (e.g., "Sarah Johnson, RN, BSc"). Perfect for your desk, locker, or workspace.',
    xpCost: 75000,
    type: 'physical',
    category: 'tools',
    profession: 'all',
    shippingCost: 4.00,
    estimatedDelivery: '10-14 business days',
    highlights: [
      'Laser engraved',
      'Choice of wood or acrylic',
      'Custom text (name + credentials)',
      '150mm × 50mm × 10mm',
      'Desk stand included'
    ],
    includes: ['Engraved nameplate', 'Desk stand', 'Wall mounting kit']
  },
  {
    id: 'REFLEXIA_CHALLENGE_COIN',
    name: 'Reflexia Challenge Coin',
    description: 'Military-style challenge coin celebrating reflective practice excellence',
    longDescription: 'A meaningful token of achievement. This premium metal challenge coin features the Reflexia logo on one side and "Reflective Practitioner" with your year of achievement on the other.',
    xpCost: 100000,
    type: 'physical',
    category: 'tools',
    profession: 'all',
    shippingCost: 2.50,
    estimatedDelivery: '10-14 business days',
    highlights: [
      'Die-cast metal construction',
      'Dual-sided design',
      '40mm diameter',
      'Year of achievement engraved',
      'Protective display case'
    ],
    includes: ['Challenge coin', 'Velvet display case', 'Certificate of achievement']
  },

  // PREMIUM EXPERIENCES (150,000+ XP)
  {
    id: 'ONE_ON_ONE_COACHING',
    name: '1-Hour Reflection Coaching Session',
    description: 'Personal video call with a reflection coach to optimize your CPD strategy',
    longDescription: 'Get personalized guidance from an experienced reflection coach. Discuss your revalidation portfolio, career goals, difficult scenarios, or anything else you need support with.',
    xpCost: 150000,
    type: 'experience',
    category: 'experiences',
    profession: 'all',
    estimatedDelivery: 'Scheduled within 2 weeks',
    highlights: [
      '60-minute video call',
      'Experienced coach',
      'Personalized feedback',
      'Portfolio review',
      'Career guidance',
      'Follow-up action plan'
    ],
    includes: [
      '1-hour video session',
      'Pre-session questionnaire',
      'Written follow-up summary',
      'Action plan document'
    ]
  },
  {
    id: 'CUSTOM_REFLECTION_FRAMEWORK',
    name: 'Custom Reflection Framework Design',
    description: 'Co-create a bespoke reflection framework for your specialty or organization',
    longDescription: 'Work directly with our team to design a custom reflection framework tailored to your nursing specialty, organization, or unique needs. Includes 2-hour consultation and full framework documentation.',
    xpCost: 250000,
    type: 'experience',
    category: 'experiences',
    profession: 'all',
    estimatedDelivery: 'Scheduled within 1 month',
    highlights: [
      '2-hour consultation',
      'Bespoke framework design',
      'Full documentation',
      'Implementation guide',
      'Your name in credits',
      'Sharing rights for your team'
    ],
    includes: [
      '2-hour design session',
      'Custom framework documentation (PDF)',
      'Implementation guide',
      'Template pack',
      'Unlimited sharing within your organization'
    ]
  }
];

// Helper functions
export function getRewardById(id: string): Reward | undefined {
  return REWARDS_CATALOG.find(reward => reward.id === id);
}

export function getRewardsByCategory(category: RewardCategory): Reward[] {
  return REWARDS_CATALOG.filter(reward => reward.category === category);
}

export function getRewardsByProfession(profession: ProfessionType): Reward[] {
  return REWARDS_CATALOG.filter(
    reward => reward.profession === profession || reward.profession === 'all'
  );
}

export function getRewardsByType(type: RewardType): Reward[] {
  return REWARDS_CATALOG.filter(reward => reward.type === type);
}

export function getAffordableRewards(currentXP: number): Reward[] {
  return REWARDS_CATALOG.filter(reward => reward.xpCost <= currentXP);
}

export function getRewardsByXPRange(minXP: number, maxXP: number): Reward[] {
  return REWARDS_CATALOG.filter(
    reward => reward.xpCost >= minXP && reward.xpCost <= maxXP
  );
}

// Format XP with commas
export function formatXP(xp: number): string {
  return xp.toLocaleString();
}

// Calculate if user can afford reward
export function canAfford(currentXP: number, rewardCost: number): boolean {
  return currentXP >= rewardCost;
}

// Get total cost including shipping
export function getTotalCost(reward: Reward): { xp: number; gbp: number } {
  return {
    xp: reward.xpCost,
    gbp: reward.shippingCost || 0
  };
}
