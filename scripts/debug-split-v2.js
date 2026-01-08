
function splitSentencesRaw(text) {
    const sentences = [];
    let buffer = '';
    let stack = [];

    // Helper to check if we are in a quote/paren/bracket
    const inGroup = () => stack.length > 0;
    const peek = () => stack[stack.length - 1];

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prev = text[i - 1];
        const next = text[i + 1];

        // Handle Quotes
        if (char === '"') {
            if (peek() === '"') stack.pop();
            else stack.push('"');
        }
        else if (char === '“') stack.push('“');
        else if (char === '”') {
            if (peek() === '“') stack.pop();
        }
        else if (char === '‘') stack.push('‘');
        else if (char === '’') {
            if (peek() === '‘') stack.pop();
        }
        else if (char === "'") {
            const isApostrophe = /[a-zA-Z0-9]/.test(prev || '') && /[a-zA-Z0-9]/.test(next || '');
            if (!isApostrophe) {
                if (peek() === "'") stack.pop();
                else stack.push("'");
            }
        }
        // Parens and Brackets
        else if (char === '(') stack.push('(');
        else if (char === ')') {
            if (peek() === '(') stack.pop();
        }
        else if (char === '[') stack.push('[');
        else if (char === ']') {
            if (peek() === '[') stack.pop();
        }

        buffer += char;

        // Split Condition: Punctuation + Not in Group
        if (/[.!?]/.test(char) && !inGroup()) {
            sentences.push(buffer.trim());
            buffer = '';
        }
    }

    if (buffer.trim()) {
        sentences.push(buffer.trim());
    }

    return sentences.filter(s => s.length > 0);
}

const testCases = [
    'Hello world. This is a test.',
    'He said "Hello." and walked away.',
    "It's a 'nice day' outside (really).",
    'She asked, "Are you okay?" and I nodded.',
    'This is a (parenthetical statement. with dots inside) example.',
    'Brackets [should. not. split.] here.',
    'Mixed: (One. Two) and [Three. Four].',
    'Nested: (Outer [Inner.] part).',
    'Unclosed (parenthesis. Should it split? probably not if strict.',
    'Sentence end.'
];

testCases.forEach((text, i) => {
    console.log(`\n--- Case ${i} ---`);
    console.log(`Input: ${text}`);
    const result = splitSentencesRaw(text);
    console.log('Output:', JSON.stringify(result, null, 2));
});
