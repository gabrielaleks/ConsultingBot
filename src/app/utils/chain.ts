import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseLanguageModelInterface } from '@langchain/core/language_models/base';
import { BaseRetrieverInterface } from '@langchain/core/retrievers';
import { BufferMemory } from 'langchain/memory';

export function initializeQAChainFromLLM(
  llm: BaseLanguageModelInterface,
  retriever: BaseRetrieverInterface,
  promptTemplate: string
) {
  const chatPrompt = ChatPromptTemplate.fromTemplate(promptTemplate)

  return ConversationalRetrievalQAChain.fromLLM(
    llm,
    retriever,
    {
      returnSourceDocuments: true,
      qaChainOptions: {
        type: 'stuff',
        prompt: chatPrompt,
      },
    });
}