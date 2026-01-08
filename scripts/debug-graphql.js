
import { fetch } from 'undici';

const GQL_URL = 'https://v2cdn.velog.io/graphql';

async function verify() {
    console.log("Attempting GraphQL query...");

    const query = `
        query Posts($username: String, $cursor: ID) {
            posts(username: $username, cursor: $cursor) {
                id
                title
                url_slug
            }
        }
    `;

    const variables = {
        username: 'uiwwsw'
    };

    try {
        const res = await fetch(GQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        const json = await res.json();

        if (json.errors) {
            console.log("GraphQL Errors:", json.errors);
        } else {
            console.log("GraphQL Success!");
            const posts = json.data.posts;
            console.log(`Page 1: Found ${posts.length} posts.`);
            if (posts.length === 0) return;

            const lastPost = posts[posts.length - 1];
            console.log(`Last Post ID: ${lastPost.id} (${lastPost.title})`);

            // Try fetching next page
            const variables2 = {
                username: 'uiwwsw',
                cursor: lastPost.id
            };

            console.log("Fetching Page 2...");
            const res2 = await fetch(GQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: variables2 })
            });
            const json2 = await res2.json();
            const posts2 = json2.data.posts;
            console.log(`Page 2: Found ${posts2.length} posts.`);
            posts2.forEach(p => console.log(` - ${p.title}`));
        }

    } catch (e) {
        console.log("Fetch Error:", e.message);
    }
}

verify();
