import { ChatOpenAI } from 'langchain/chat_models/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { BufferMemory } from "langchain/memory";


const CONDENSE_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

const QA_TEMPLATE = `You are a helpful AI course advisor. Your role is answer questions about the courses you have in the catalogue. 
After you answer the question you can give courses advice for a course that you think match the best with the request of the learner. Course prices are in Euro's.
If you don't know a course that matches, just say; I do not know a course that fits your needs, we will add your request to the wishlist, to add this topic in the future. DO NOT try to make up a course.
You may answer questions about the courses in the courses document, for example the best rated course that you have or what courses are Instructor-led. 
If the question is not related to the context, friendly respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`;

export const makeChain = (vectorstore: PineconeStore) => {

  const model = new ChatOpenAI({
    temperature: 0, // increase temepreature to get more creative answers
    modelName: 'gpt-4', 
    streaming: true,
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorstore.asRetriever(),//The number of source documents returned must be higher then 0.
    {
      qaTemplate: QA_TEMPLATE,
      questionGeneratorTemplate: CONDENSE_TEMPLATE,
      returnSourceDocuments: true,
     // verbose: true,
    //   memory: new BufferMemory({
    //   memoryKey: "chat_history",
    // }),
    },
  );
  return chain;
};
