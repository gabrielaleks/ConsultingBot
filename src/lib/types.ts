export namespace FilesManager {
  export interface File {
    id: string;
    name: string;
  }

  export interface Files {
    files: File[];
  }
}

export namespace JobsManager {
  export interface Job {
    id: string;
    title: string;
    company: {
      name: string;
  
    };
    description: string;
    skills: Array<{
      title: string;
    }>;
    timeCommitmentDisplay: string;
    engagementType: string;
    geoPreferencesDisplay: string;
    durationDisplay: string;
    publishedAt: string;
    closesAt: string;
    budgetMinIdeal: string;
    budgetMaxIdeal: string;
    developerMinRate: string;
    developerMaxRate: string;
    salaryMinRange: string;
    salaryMaxRange: string;
  }
  
  export interface JsonData {
    jobs: Job[];
  }
}