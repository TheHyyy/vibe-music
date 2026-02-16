---
name: "news-reporter"
description: "Searches for and summarizes the latest news on a specific topic. Invoke when the user asks for news, updates, or recent developments in a specific field (e.g., AI, tech, music)."
---

# News Reporter

This skill helps the user stay updated with the latest news in any specific domain.

## Instructions
1.  **Identify the Topic**: Determine the specific domain or topic the user is interested in (e.g., "AI", "Frontend Development", "Music Industry"). If not specified, ask the user.
2.  **Determine the Timeframe**: Check if the user specified a timeframe (e.g., "today", "this week"). If not, default to the last 2-3 days or "latest".
3.  **Perform Web Search**: Use the `WebSearch` tool to find recent articles, blog posts, and news reports.
    *   Query format: "latest [Topic] news [Date]" or "[Topic] developments [Month Year]".
4.  **Synthesize and Summarize**:
    *   Filter for the most relevant and credible sources.
    *   Group related news items together.
    *   Provide a concise summary for each key news item.
5.  **Format the Output**:
    *   Use a clear Markdown structure.
    *   **Headline**: A catchy title for the news summary.
    *   **Date**: The date of the news report.
    *   **Key Updates**: Bullet points of the main stories.
    *   **Deep Dive** (Optional): A brief expansion on the most important story.

## Examples
User: "What's new in AI today?"
Action: Search for "latest AI news [Current Date]" and summarize the top 3-5 stories.

User: "Give me a weekly update on React."
Action: Search for "React js news updates [Current Week/Month]" and summarize.
