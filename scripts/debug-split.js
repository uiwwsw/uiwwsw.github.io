
function extractSentencesFromText(text) {
    // Simplified version of the current logic in fetch-velog.js
    // We just want to see how the regex splits
    const rawSentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    return rawSentences;
}

const testCases = [
    'Hello world. This is a test.',
    'He said "Hello." and walked away.',
    "It's a 'nice day' outside.",
    'She asked, "Are you okay?" and I nodded.',
    'This is a “fancy quote” example.',
    'Mixed quotes: "One" and ‘Two’ and ‘Three’.',
    'Sentence ending with quote “Like this.”'
];

testCases.forEach((text, i) => {
    console.log(`\n--- Case ${i} ---`);
    console.log(`Input: ${text}`);
    const result = extractSentencesFromText(text);
    console.log('Output:', JSON.stringify(result, null, 2));
});
