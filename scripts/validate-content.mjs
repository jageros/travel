import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { findDuplicates, readArticles, readJson, validateArticle, validateRegistry } from './content-lib.mjs';

export async function validateContent(root, { now = new Date() } = {}) {
  const registry = await readJson(path.join(root, 'automation/sources.json'));
  validateRegistry(registry);
  const articles = await readArticles(root);
  const errors = [];
  for (const article of articles) {
    const problems = validateArticle(article, registry, { now });
    const duplicates = findDuplicates(article, articles);
    if (duplicates.length) problems.push(`Duplicate intent or content: ${duplicates.join(', ')}`);
    if (problems.length) errors.push({ file: article.file, errors: problems });
  }
  return { articles: articles.length, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await validateContent(process.cwd());
    if (result.errors.length) { console.error(JSON.stringify(result, null, 2)); process.exitCode = 1; }
    else console.log(`Content validation passed (${result.articles} articles).`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
