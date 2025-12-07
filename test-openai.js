const OpenAI = require('openai');
const client = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});
async function test() {
try {
const embedding = await client.embeddings.create({
model: 'text-embedding-3-small',
input: 'test query',
});
console.log('✅ OpenAI works!', embedding.data[0].embedding.slice(0, 5));
} catch (error) {
console.error('❌ OpenAI failed:', error.message);
}
}
test();