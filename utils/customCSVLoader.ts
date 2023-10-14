import { Document } from 'langchain/document';
import { readFile } from 'fs/promises';
import { BaseDocumentLoader } from 'langchain/document_loaders';
import { CSVLoader } from "langchain/document_loaders/fs/csv";

const loader = new CSVLoader("src/document_loaders/example_data/example.csv");

export abstract class BufferLoader extends BaseDocumentLoader {
  constructor(public filePathOrBlob: string | Blob) {
    super();
  }

  protected abstract parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]>;

  public async load(): Promise<Document[]> {
    let buffer: Buffer;
    let metadata: Record<string, string>;
    if (typeof this.filePathOrBlob === 'string') {
      buffer = await readFile(this.filePathOrBlob);
      metadata = { source: this.filePathOrBlob };
    } else {
      buffer = await this.filePathOrBlob
        .arrayBuffer()
        .then((ab) => Buffer.from(ab));
      metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
    }
    return this.parse(buffer, metadata);
  }
}

export class CustomCSVLoader extends BufferLoader {
  public async parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]> {
    const { csv } = await CSVLoaderImports();
    const parsed = await csv(raw);
    return [
      new Document({
        pageContent: parsed.text,
        metadata: {
          ...metadata,
          pdf_numpages: parsed.numpages,
        },
      }),
    ];
  }
}

async function CSVLoaderImports() {
  try {
    // the main entrypoint has some debug code that we don't want to import
    const { default: csv } = await import('csv-parse/lib/csv-parse.js');
    return { csv };
  } catch (e) {
    console.error(e);
    throw new Error(
      'Failed to load csv-parse. Please install it with eg. `npm i d3-dsv`.',
    );
  }
}

// you have to import:
// npm install d3-dsv
