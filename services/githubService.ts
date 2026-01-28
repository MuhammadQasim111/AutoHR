
import { GitHubData } from '../types';
import { extractGithubUsername } from './regexService';

export async function fetchGitHubData(url: string): Promise<GitHubData | null> {
  const username = extractGithubUsername(url);
  if (!username) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s fail-fast for GitHub

    const [repoRes, eventsRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=15`, { signal: controller.signal }),
      fetch(`https://api.github.com/users/${username}/events/public?per_page=20`, { signal: controller.signal })
    ]);

    clearTimeout(timeout);

    if (!repoRes.ok) return null;

    const repos = await repoRes.json();
    const events = await eventsRes.json();

    const topRepos = repos.slice(0, 8).map((r: any) => `${r.name}: ${r.description || 'No desc'} (${r.stargazers_count}*)`);
    const languages = Array.from(new Set(repos.map((r: any) => r.language).filter(Boolean))) as string[];
    const totalStars = repos.reduce((acc: number, r: any) => acc + r.stargazers_count, 0);
    
    // Summarize activity leanly
    const activityTypes = events.map((e: any) => e.type);
    const activitySummary = `Activity: ${activityTypes.slice(0, 3).join(', ')}.`;

    return {
      repos: topRepos,
      languages: languages.slice(0, 5),
      totalStars,
      recentActivity: activitySummary
    };
  } catch (error) {
    console.error("GitHub fetch failed or timed out:", error);
    return null;
  }
}
