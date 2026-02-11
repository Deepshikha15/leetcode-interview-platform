export interface TestCase {
    input: string;
    expectedOutput: string;
    explanation?: string;
}

export interface Question {
    id: number;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    description: string;
    examples: {
        input: string;
        output: string;
        explanation?: string;
    }[];
    constraints: string[];
    testCases: TestCase[];
    starterCode: {
        javascript: string;
        python: string;
    };
    hints: string[];
    expectedApproach: string;
    timeComplexity: string;
    spaceComplexity: string;
}

export const questions: Question[] = [
    {
        id: 1,
        title: "Two Sum",
        difficulty: "Easy",
        category: "Arrays & Hashing",
        description: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.

You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the <em>same</em> element twice.

You can return the answer in any order.`,
        examples: [
            {
                input: "nums = [2,7,11,15], target = 9",
                output: "[0,1]",
                explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
            },
            {
                input: "nums = [3,2,4], target = 6",
                output: "[1,2]"
            },
            {
                input: "nums = [3,3], target = 6",
                output: "[0,1]"
            }
        ],
        constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "-10^9 <= target <= 10^9",
            "Only one valid answer exists."
        ],
        testCases: [
            { input: "[2,7,11,15], 9", expectedOutput: "[0,1]" },
            { input: "[3,2,4], 6", expectedOutput: "[1,2]" },
            { input: "[3,3], 6", expectedOutput: "[0,1]" },
            { input: "[1,2,3,4,5], 9", expectedOutput: "[3,4]" }
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Your code here
    
}`,
            python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        pass`
        },
        hints: [
            "A brute force approach would be O(n²) - can you do better?",
            "Consider using a hash map to store values you've seen.",
            "For each number, check if (target - num) exists in your hash map."
        ],
        expectedApproach: "Use a hash map to store each number's index. For each number, check if the complement (target - num) exists in the map.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)"
    },
    {
        id: 2,
        title: "Valid Parentheses",
        difficulty: "Easy",
        category: "Stack",
        description: `Given a string <code>s</code> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        examples: [
            { input: 's = "()"', output: "true" },
            { input: 's = "()[]{}"', output: "true" },
            { input: 's = "(]"', output: "false" },
            { input: 's = "([])"', output: "true" }
        ],
        constraints: [
            "1 <= s.length <= 10^4",
            "s consists of parentheses only '()[]{}'."
        ],
        testCases: [
            { input: '"()"', expectedOutput: "true" },
            { input: '"()[]{}"', expectedOutput: "true" },
            { input: '"(]"', expectedOutput: "false" },
            { input: '"([)]"', expectedOutput: "false" },
            { input: '"{[]}"', expectedOutput: "true" }
        ],
        starterCode: {
            javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Your code here
    
}`,
            python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Your code here
        pass`
        },
        hints: [
            "Use a stack to keep track of opening brackets.",
            "When you see a closing bracket, check if it matches the top of the stack.",
            "At the end, the stack should be empty for a valid string."
        ],
        expectedApproach: "Use a stack. Push opening brackets, pop and match closing brackets. Return true if stack is empty at end.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)"
    },
    {
        id: 3,
        title: "Merge Two Sorted Lists",
        difficulty: "Easy",
        category: "Linked List",
        description: `You are given the heads of two sorted linked lists <code>list1</code> and <code>list2</code>.

Merge the two lists into one <strong>sorted</strong> list. The list should be made by splicing together the nodes of the first two lists.

Return <em>the head of the merged linked list</em>.`,
        examples: [
            {
                input: "list1 = [1,2,4], list2 = [1,3,4]",
                output: "[1,1,2,3,4,4]"
            },
            {
                input: "list1 = [], list2 = []",
                output: "[]"
            },
            {
                input: "list1 = [], list2 = [0]",
                output: "[0]"
            }
        ],
        constraints: [
            "The number of nodes in both lists is in the range [0, 50].",
            "-100 <= Node.val <= 100",
            "Both list1 and list2 are sorted in non-decreasing order."
        ],
        testCases: [
            { input: "[1,2,4], [1,3,4]", expectedOutput: "[1,1,2,3,4,4]" },
            { input: "[], []", expectedOutput: "[]" },
            { input: "[], [0]", expectedOutput: "[0]" }
        ],
        starterCode: {
            javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
function mergeTwoLists(list1, list2) {
    // Your code here
    
}`,
            python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        # Your code here
        pass`
        },
        hints: [
            "Use a dummy node to simplify edge cases.",
            "Compare the heads of both lists and pick the smaller one.",
            "Use recursion or iteration - both work well."
        ],
        expectedApproach: "Use a dummy node. Compare current nodes of both lists, append smaller to result, move that pointer forward.",
        timeComplexity: "O(n + m)",
        spaceComplexity: "O(1) iterative, O(n+m) recursive"
    },
    {
        id: 4,
        title: "Best Time to Buy and Sell Stock",
        difficulty: "Easy",
        category: "Sliding Window",
        description: `You are given an array <code>prices</code> where <code>prices[i]</code> is the price of a given stock on the <code>i<sup>th</sup></code> day.

You want to maximize your profit by choosing a <strong>single day</strong> to buy one stock and choosing a <strong>different day in the future</strong> to sell that stock.

Return <em>the maximum profit you can achieve from this transaction</em>. If you cannot achieve any profit, return <code>0</code>.`,
        examples: [
            {
                input: "prices = [7,1,5,3,6,4]",
                output: "5",
                explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."
            },
            {
                input: "prices = [7,6,4,3,1]",
                output: "0",
                explanation: "In this case, no transactions are done and the max profit = 0."
            }
        ],
        constraints: [
            "1 <= prices.length <= 10^5",
            "0 <= prices[i] <= 10^4"
        ],
        testCases: [
            { input: "[7,1,5,3,6,4]", expectedOutput: "5" },
            { input: "[7,6,4,3,1]", expectedOutput: "0" },
            { input: "[2,4,1]", expectedOutput: "2" },
            { input: "[1,2]", expectedOutput: "1" }
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
    // Your code here
    
}`,
            python: `class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # Your code here
        pass`
        },
        hints: [
            "Track the minimum price seen so far.",
            "At each step, calculate potential profit and update max.",
            "One pass through the array is sufficient."
        ],
        expectedApproach: "Track minimum price seen. At each price, calculate profit if selling today, update max profit.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    },
    {
        id: 5,
        title: "Longest Substring Without Repeating Characters",
        difficulty: "Medium",
        category: "Sliding Window",
        description: `Given a string <code>s</code>, find the length of the <strong>longest substring</strong> without repeating characters.`,
        examples: [
            {
                input: 's = "abcabcbb"',
                output: "3",
                explanation: 'The answer is "abc", with the length of 3.'
            },
            {
                input: 's = "bbbbb"',
                output: "1",
                explanation: 'The answer is "b", with the length of 1.'
            },
            {
                input: 's = "pwwkew"',
                output: "3",
                explanation: 'The answer is "wke", with the length of 3.'
            }
        ],
        constraints: [
            "0 <= s.length <= 5 * 10^4",
            "s consists of English letters, digits, symbols and spaces."
        ],
        testCases: [
            { input: '"abcabcbb"', expectedOutput: "3" },
            { input: '"bbbbb"', expectedOutput: "1" },
            { input: '"pwwkew"', expectedOutput: "3" },
            { input: '""', expectedOutput: "0" }
        ],
        starterCode: {
            javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Your code here
    
}`,
            python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Your code here
        pass`
        },
        hints: [
            "Use a sliding window approach.",
            "Use a Set or HashMap to track characters in current window.",
            "When you find a duplicate, shrink the window from the left."
        ],
        expectedApproach: "Sliding window with a Set. Expand right, if duplicate found, shrink left until no duplicate.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(min(m, n)) where m is alphabet size"
    },
    {
        id: 6,
        title: "Container With Most Water",
        difficulty: "Medium",
        category: "Two Pointers",
        description: `You are given an integer array <code>height</code> of length <code>n</code>. There are <code>n</code> vertical lines drawn such that the two endpoints of the <code>i<sup>th</sup></code> line are <code>(i, 0)</code> and <code>(i, height[i])</code>.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return <em>the maximum amount of water a container can store</em>.

<strong>Notice</strong> that you may not slant the container.`,
        examples: [
            {
                input: "height = [1,8,6,2,5,4,8,3,7]",
                output: "49",
                explanation: "The vertical lines are at index 1 (height 8) and index 8 (height 7). Area = 7 * (8-1) = 49"
            },
            {
                input: "height = [1,1]",
                output: "1"
            }
        ],
        constraints: [
            "n == height.length",
            "2 <= n <= 10^5",
            "0 <= height[i] <= 10^4"
        ],
        testCases: [
            { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49" },
            { input: "[1,1]", expectedOutput: "1" },
            { input: "[4,3,2,1,4]", expectedOutput: "16" }
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
    // Your code here
    
}`,
            python: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        # Your code here
        pass`
        },
        hints: [
            "Use two pointers: one at the start, one at the end.",
            "Calculate area at each step and track maximum.",
            "Move the pointer pointing to the shorter line inward."
        ],
        expectedApproach: "Two pointers from both ends. Calculate area, move the shorter line's pointer inward. Track max area.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)"
    },
    {
        id: 7,
        title: "3Sum",
        difficulty: "Medium",
        category: "Two Pointers",
        description: `Given an integer array nums, return all the triplets <code>[nums[i], nums[j], nums[k]]</code> such that <code>i != j</code>, <code>i != k</code>, and <code>j != k</code>, and <code>nums[i] + nums[j] + nums[k] == 0</code>.

Notice that the solution set must not contain duplicate triplets.`,
        examples: [
            {
                input: "nums = [-1,0,1,2,-1,-4]",
                output: "[[-1,-1,2],[-1,0,1]]",
                explanation: "nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0, nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0, nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0"
            },
            {
                input: "nums = [0,1,1]",
                output: "[]"
            },
            {
                input: "nums = [0,0,0]",
                output: "[[0,0,0]]"
            }
        ],
        constraints: [
            "3 <= nums.length <= 3000",
            "-10^5 <= nums[i] <= 10^5"
        ],
        testCases: [
            { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]" },
            { input: "[0,1,1]", expectedOutput: "[]" },
            { input: "[0,0,0]", expectedOutput: "[[0,0,0]]" }
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function threeSum(nums) {
    // Your code here
    
}`,
            python: `class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        # Your code here
        pass`
        },
        hints: [
            "Sort the array first.",
            "For each element, use two pointers to find pairs that sum to its negation.",
            "Skip duplicates to avoid duplicate triplets."
        ],
        expectedApproach: "Sort array. For each element i, use two pointers j and k to find pairs where nums[j] + nums[k] = -nums[i]. Skip duplicates.",
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1) or O(n) for sorting"
    },
    {
        id: 8,
        title: "Binary Tree Level Order Traversal",
        difficulty: "Medium",
        category: "Trees & BFS",
        description: `Given the <code>root</code> of a binary tree, return <em>the level order traversal of its nodes' values</em>. (i.e., from left to right, level by level).`,
        examples: [
            {
                input: "root = [3,9,20,null,null,15,7]",
                output: "[[3],[9,20],[15,7]]"
            },
            {
                input: "root = [1]",
                output: "[[1]]"
            },
            {
                input: "root = []",
                output: "[]"
            }
        ],
        constraints: [
            "The number of nodes in the tree is in the range [0, 2000].",
            "-1000 <= Node.val <= 1000"
        ],
        testCases: [
            { input: "[3,9,20,null,null,15,7]", expectedOutput: "[[3],[9,20],[15,7]]" },
            { input: "[1]", expectedOutput: "[[1]]" },
            { input: "[]", expectedOutput: "[]" }
        ],
        starterCode: {
            javascript: `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {number[][]}
 */
function levelOrder(root) {
    // Your code here
    
}`,
            python: `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right

class Solution:
    def levelOrder(self, root: Optional[TreeNode]) -> List[List[int]]:
        # Your code here
        pass`
        },
        hints: [
            "Use BFS (Breadth-First Search) with a queue.",
            "Process all nodes at current level before moving to next.",
            "Keep track of how many nodes are at each level."
        ],
        expectedApproach: "BFS using a queue. Process all nodes at current level, add their children to queue, repeat.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)"
    },
    {
        id: 9,
        title: "Climbing Stairs",
        difficulty: "Easy",
        category: "Dynamic Programming",
        description: `You are climbing a staircase. It takes <code>n</code> steps to reach the top.

Each time you can either climb <code>1</code> or <code>2</code> steps. In how many distinct ways can you climb to the top?`,
        examples: [
            {
                input: "n = 2",
                output: "2",
                explanation: "There are two ways to climb to the top: 1. 1 step + 1 step, 2. 2 steps"
            },
            {
                input: "n = 3",
                output: "3",
                explanation: "There are three ways: 1. 1+1+1, 2. 1+2, 3. 2+1"
            }
        ],
        constraints: [
            "1 <= n <= 45"
        ],
        testCases: [
            { input: "2", expectedOutput: "2" },
            { input: "3", expectedOutput: "3" },
            { input: "4", expectedOutput: "5" },
            { input: "5", expectedOutput: "8" }
        ],
        starterCode: {
            javascript: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
    // Your code here
    
}`,
            python: `class Solution:
    def climbStairs(self, n: int) -> int:
        # Your code here
        pass`
        },
        hints: [
            "This is a Fibonacci-like problem.",
            "ways(n) = ways(n-1) + ways(n-2)",
            "You can use DP or just two variables."
        ],
        expectedApproach: "Dynamic programming. dp[i] = dp[i-1] + dp[i-2]. Can optimize to O(1) space with two variables.",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) optimized"
    },
    {
        id: 10,
        title: "Coin Change",
        difficulty: "Medium",
        category: "Dynamic Programming",
        description: `You are given an integer array <code>coins</code> representing coins of different denominations and an integer <code>amount</code> representing a total amount of money.

Return <em>the fewest number of coins that you need to make up that amount</em>. If that amount of money cannot be made up by any combination of the coins, return <code>-1</code>.

You may assume that you have an infinite number of each kind of coin.`,
        examples: [
            {
                input: "coins = [1,2,5], amount = 11",
                output: "3",
                explanation: "11 = 5 + 5 + 1"
            },
            {
                input: "coins = [2], amount = 3",
                output: "-1"
            },
            {
                input: "coins = [1], amount = 0",
                output: "0"
            }
        ],
        constraints: [
            "1 <= coins.length <= 12",
            "1 <= coins[i] <= 2^31 - 1",
            "0 <= amount <= 10^4"
        ],
        testCases: [
            { input: "[1,2,5], 11", expectedOutput: "3" },
            { input: "[2], 3", expectedOutput: "-1" },
            { input: "[1], 0", expectedOutput: "0" },
            { input: "[1,2,5], 100", expectedOutput: "20" }
        ],
        starterCode: {
            javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
function coinChange(coins, amount) {
    // Your code here
    
}`,
            python: `class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        # Your code here
        pass`
        },
        hints: [
            "Use dynamic programming with bottom-up approach.",
            "dp[i] = minimum coins needed for amount i.",
            "For each amount, try all coins and take the minimum."
        ],
        expectedApproach: "DP array where dp[i] = min coins for amount i. For each amount, try each coin and take min(dp[amount], dp[amount-coin] + 1).",
        timeComplexity: "O(amount * coins)",
        spaceComplexity: "O(amount)"
    }
];

export function getRandomQuestion(
    difficulty?: 'Easy' | 'Medium' | 'Hard',
    excludeQuestionId?: number
): Question {
    let filtered = questions;
    if (difficulty) {
        filtered = questions.filter(q => q.difficulty === difficulty);
    }

    if (excludeQuestionId !== undefined && filtered.length > 1) {
        const withoutPrevious = filtered.filter(q => q.id !== excludeQuestionId);
        if (withoutPrevious.length > 0) {
            filtered = withoutPrevious;
        }
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getQuestionById(id: number): Question | undefined {
    return questions.find(q => q.id === id);
}
