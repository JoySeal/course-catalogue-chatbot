import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';

const filePath = 'docs';
export const run = async () => {
  try {
    const directoryLoader = new DirectoryLoader(filePath, {
      '.csv': (path) => new CSVLoader(path),
    });
    const rawDocs = await directoryLoader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);

    console.log('creating vector store...');
    const embeddings = new OpenAIEmbeddings();
    const index = pinecone.Index(PINECONE_INDEX_NAME); 

    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: PINECONE_NAME_SPACE,
      textKey: 'text',
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();

//not adding the vectorDB but only adding new
// const pineconeIndex = client.Index(process.env.PINECONE_INDEX_NAME);
// const vectorStore = await PineconeStore.fromExistingIndex(
// new OpenAIEmbeddings(),//embeddings
// { pineconeIndex }
// );
//
// docsearch = Pinecone.from_existing_index(index_name=index_name, embedding=embeddings, namespace=namespace)
