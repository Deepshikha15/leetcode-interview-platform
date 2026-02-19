
import { createClient } from '@supabase/supabase-js';
import { LeetCode } from 'leetcode-query';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const leetcode = new LeetCode();

const PROBLEMS_TO_SEED = [
    'two-sum',
    'reverse-integer',
    'palindrome-number',
    'roman-to-integer',
    'longest-common-prefix',
    'valid-parentheses',
    'merge-two-sorted-lists',
    'remove-duplicates-from-sorted-array',
    'add-two-numbers',
    'longest-substring-without-repeating-characters'
];

async function seed() {
    console.log('--- Starting LeetCode Problem Seeding ---');

    for (const slug of PROBLEMS_TO_SEED) {
        try {
            console.log(`Fetching ${slug}...`);
            const problem = await leetcode.problem(slug);

            if (!problem || !problem.title) {
                console.warn(`Could not find problem: ${slug}`);
                continue;
            }

            console.log(`Saving ${slug} to Supabase...`);
            const { error } = await supabase
                .from('leetcode_problems')
                .upsert({
                    title_slug: problem.titleSlug,
                    title: problem.title,
                    content: problem.content,
                    difficulty: problem.difficulty,
                    topic_tags: problem.topicTags || [],
                    code_snippets: problem.codeSnippets || [],
                    sample_test_case: problem.sampleTestCase,
                    hints: problem.hints || [],
                    example_testcase_list: problem.exampleTestcaseList || [],
                    last_synced_at: new Date().toISOString()
                }, { onConflict: 'title_slug' });

            if (error) {
                console.error(`Error saving ${slug}:`, error.message);
            } else {
                console.log(`Successfully seeded: ${problem.title}`);
            }
        } catch (err) {
            console.error(`Failed to seed ${slug}:`, err.message);
        }
    }

    console.log('--- Seeding Complete ---');
}

seed();
