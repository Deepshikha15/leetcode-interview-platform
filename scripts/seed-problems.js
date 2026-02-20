
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

const PROBLEM_METADATA = {
    'two-sum': {
        brute_time: 'O(n^2)', brute_space: 'O(1)',
        opt_time: 'O(n)', opt_space: 'O(n)',
        test_cases: [
            { input: '[2,7,11,15]\n9', expected: '[0,1]' },
            { input: '[3,2,4]\n6', expected: '[1,2]' },
            { input: '[3,3]\n6', expected: '[0,1]' }
        ]
    },
    'remove-duplicates-from-sorted-array': {
        brute_time: 'O(n)', brute_space: 'O(1)',
        opt_time: 'O(n)', opt_space: 'O(1)',
        test_cases: [
            { input: '[1,1,2]', expected: '2' },
            { input: '[0,0,1,1,1,2,2,3,3,4]', expected: '5' }
        ]
    },
    'valid-parentheses': {
        brute_time: 'O(n)', brute_space: 'O(n)',
        opt_time: 'O(n)', opt_space: 'O(n)',
        test_cases: [
            { input: '"()"', expected: 'true' },
            { input: '"()[]{}"', expected: 'true' },
            { input: '"(]"', expected: 'false' }
        ]
    },
    'palindrome-number': {
        brute_time: 'O(n)', brute_space: 'O(n)',
        opt_time: 'O(log n)', opt_space: 'O(1)',
        test_cases: [
            { input: '121', expected: 'true' },
            { input: '-121', expected: 'false' },
            { input: '10', expected: 'false' }
        ]
    }
};

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

            const meta = PROBLEM_METADATA[slug] || {
                brute_time: 'O(n^2)', brute_space: 'O(1)',
                opt_time: 'O(n)', opt_space: 'O(n)',
                test_cases: []
            };

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
                    brute_time_complexity: meta.brute_time,
                    brute_space_complexity: meta.brute_space,
                    optimized_time_complexity: meta.opt_time,
                    optimized_space_complexity: meta.opt_space,
                    test_cases: meta.test_cases,
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
