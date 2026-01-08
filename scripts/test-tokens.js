
function testTokenization(cases) {
    // Regex Logic
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/u;

    // Updated Token Regex
    // 1. Strings: "...", '...', “...”, ‘...’
    // 2. Brackets with optional attached text: Text[Inner]
    // 3. Parens with optional attached text: Text(Inner)
    // 4. Fallback: Non-whitespace
    const tokenRegex = /("[^"]*"|'[^']*'|“[^”]*”|‘[^’]*’|\S*\[[^\]]*\]\S*|\S*\([^)]*\)\S*|\S+)/g;

    console.log("Testing Tokenization...");

    cases.forEach((text, i) => {
        console.log(`\n--- Case ${i} ---`);
        console.log(`Input: "${text}"`);

        let tokens = text.match(tokenRegex) || [];

        // Filter logic
        tokens = tokens.filter(w => {
            if (!w) return false;
            // Emoji check
            if (emojiRegex.test(w)) return false;

            // Unbalanced Paren check: 
            // If it has '(', it MUST have ')'
            if (w.includes('(') && !w.includes(')')) return false;

            // We allow ')' alone as per user: ") 이 괄호는 그냥 짝이 없는경우도있는데"

            // What about '['? User said treats [] like ()
            if (w.includes('[') && !w.includes(']')) return false;

            return true;
        });

        console.log("Tokens:", JSON.stringify(tokens, null, 2));
    });
}

const testCases = [
    '커서(블링킹 캐럿)이 깜빡인다.',           // Should capture 커서(블링킹 캐럿)이 or parts?
    // '커서(블링킹 캐럿)이' contains space inside parens?
    // Regex \S* doesn't match space.
    // \S*\([^)]*\)\S* matches `커서(블링킹` IF `[^)]*` matches space? Yes.
    // `커서(블링킹 캐럿)이` -> `커서` match? No `(` is non-space.
    // `커서(블링킹` ... space ... `캐럿)이`
    // If regex is `\S*\([^)]*\)\S*`, `[^)]` includes space.
    // So `커서(블링킹 캐럿)이` matches FULLY?
    // `\S*`=커서, `\([^)]*\)`=(블링킹 캐럿), `\S*`=이
    // YES. It should match the whole thing including space inside parens.
    '함수 func(param, param2) 호출',
    '배열 arr[index] 값',
    'Quote "Hello World" Test',
    'Unclosed (Paren here',
    'End with closed match)',
    '1) List item',
    'Complex [Link](Url) format'
];

testTokenization(testCases);
