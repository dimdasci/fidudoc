import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE documents (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      received_at TIMESTAMP NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size INTEGER NOT NULL CHECK (file_size > 0),
      mime_type VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL CHECK (status IN ('new', 'classifying', 'extracting', 'validating', 'pending', 'approved', 'rejected')),
      number_of_pages INTEGER,
      document_type VARCHAR(255),
      confidence_score INTEGER,
      workflow_id VARCHAR(255),
      processing_error TEXT,
      file_path VARCHAR(1024) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;

  yield* sql`CREATE INDEX idx_documents_account_id ON documents(account_id)`;
  yield* sql`CREATE INDEX idx_documents_status ON documents(status)`;
  yield* sql`CREATE INDEX idx_documents_received_at ON documents(received_at)`;
});
