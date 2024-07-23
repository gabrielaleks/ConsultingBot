import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from '@langchain/core/documents'
import { ObjectId } from "mongodb";
import { JobsManager } from '@/lib/types';


export async function generateSplitDocumentsFromFile(file: File) {
  const fileContent = await file.text();
  const splitDocs = await processJobsFile(fileContent);
  // const splitDocs = await splitTextIntoDocuments(file);
  // const formattedSplitDocs = await formatDocuments(splitDocs, file);
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

// async function splitTextIntoDocuments(file: File) {
//   const fileContent = await file.text()

//   const textSplitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 15000,
//     chunkOverlap: 2500,
//   })

//   const fileId = new ObjectId().toString();
//   const splitDocs = await textSplitter.createDocuments(
//     [fileContent],
//     [
//       {
//         'episode': file.name,
//         'file_id': fileId
//       }
//     ],
//     {
//       chunkHeader: `EPISODE NAME: ${file.name}\n\n`,
//       appendChunkOverlapHeader: true
//     }
//   )
//   return splitDocs
// }

// async function formatDocuments(splitDocs: Document<Record<string, any>>[], file: File) {
//   const fileId = new ObjectId().toString();

//   return splitDocs.map(doc => new Document({
//     pageContent: doc.pageContent,
//     metadata: {
//       ...doc.metadata,
//       file_name: file.name,
//       file_id: fileId,
//     }
//   }))

//   // splitDocs.forEach(doc => {
//   //   doc.metadata.file = {
//   //     name: file.name,
//   //     id: fileId,
//   //     addedOn: addedOn
//   //   }
//   // });

//   // return splitDocs
// }