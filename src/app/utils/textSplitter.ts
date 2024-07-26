import { Document } from '@langchain/core/documents'
import { JobsManager } from '@/lib/types';

export async function generateSplitDocumentsFromFile(file: File) {
  const fileContent = await file.text();
  const splitDocs = await processJobsFile(fileContent);
  return splitDocs;
}

async function processJobsFile(fileContent: string): Promise<Document[]> {
  const data: JobsManager.JsonData = JSON.parse(fileContent);
  
  const documents: Document[] = data.jobs.map(job => {
    const jobStr = `Title: ${job.title}\n` +
      `Company: ${job.company.name}\n` +
      `Description: ${job.description}\n` +
      `Skills: ${job.skills.map(skill => skill.title).join(', ')}\n` +
      `Time commitment: ${job.timeCommitmentDisplay}\n` +
      `Engagement type: ${job.engagementType}\n` +
      `Geographical preferences: ${job.geoPreferencesDisplay}\n` +
      `Job duration: ${job.durationDisplay}\n` +
      `Job opening was published at: ${job.publishedAt}\n` +
      `Job opening closes at: ${job.closesAt}\n` + 
      `Budget range: ${job.budgetMinIdeal} - ${job.budgetMaxIdeal}\n` +
      `Developer rate range: ${job.developerMinRate} - ${job.developerMaxRate}\n` +
      `Salary range: ${job.salaryMinRange} - ${job.salaryMaxRange}\n`;

    return new Document({
      pageContent: jobStr,
      metadata: {
        id: job.id,
        title: job.title,
        company: job.company.name,
        timeCommitment: job.timeCommitmentDisplay,
        engagementType: job.engagementType,
        geoPreferencesDisplay: job.geoPreferencesDisplay,
        jobDuration: job.durationDisplay,
        jobOpeningPublishedAt: job.publishedAt,
        jobOpeningClosesAt: job.closesAt,
        budgetRange: job.budgetMinIdeal + ' - ' + job.budgetMaxIdeal,
        developerRateRange: job.developerMinRate + ' - ' + job.developerMaxRate,
        salaryRange: job.salaryMinRange + ' - ' + job.salaryMaxRange
      }
    });
  });
  
  return documents;
}
