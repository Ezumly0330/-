export enum StarStage {
  SEPARATED = 'Separated',
  CONTACT = 'Contact',
  MERGED = 'Merged',
  BLACK_HOLE = 'Black Hole'
}

export interface ParticleState {
  openness: number; // 0.0 (Closed/Contracted) to 1.0 (Open/Expanded)
}

export interface SimulationConfig {
  stage: StarStage;
  expansion: number;
}