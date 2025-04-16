import { ProjectStage } from '@prisma/client';

export const PROJECT_STAGES = [
  { value: ProjectStage.PRE_SEED, label: 'Pre-seed' },
  { value: ProjectStage.SEED, label: 'Seed' },
  { value: ProjectStage.SERIES_A, label: 'Series A' },
  { value: ProjectStage.SERIES_B, label: 'Series B' },
  { value: ProjectStage.SERIES_C, label: 'Series C' },
  { value: ProjectStage.IPO, label: 'IPO' },
];
