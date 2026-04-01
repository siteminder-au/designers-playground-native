import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './src/graphql/paul/typeDefs.js';
import { resolvers } from './src/graphql/paul/resolvers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ── Paul's GraphQL server ──────────────────────────────────────────────────────
const paulGraphQL = new ApolloServer({ typeDefs, resolvers });
await paulGraphQL.start();

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use('/graphql', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
}, expressMiddleware(paulGraphQL));

// ── Static / SPA ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server listen error:', error);
  process.exit(1);
});
