import { Octokit } from '@octokit/rest';
import { SimpleGit, simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export class GitHubService {
  private octokit: Octokit;
  private git: SimpleGit;
  private tmpDir: string;

  constructor(authToken?: string) {
    this.octokit = new Octokit({
      auth: authToken,
    });
    this.git = simpleGit();
    this.tmpDir = path.join(os.tmpdir(), 'codescape-repos');
  }

  async cloneRepository(repoUrl: string): Promise<string> {
    try {
      // Parse GitHub URL
      const [owner, repo] = this.parseGitHubUrl(repoUrl);
      
      // Ensure temp directory exists
      await fs.mkdir(this.tmpDir, { recursive: true });
      
      // Create unique directory for this repo
      const repoDir = path.join(this.tmpDir, `${owner}-${repo}-${Date.now()}`);
      await fs.mkdir(repoDir, { recursive: true });

      // Clone repository
      await this.git.clone(repoUrl, repoDir);

      return repoDir;
    } catch (error) {
      console.error('Error cloning repository:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to clone repository'
      );
    }
  }

  private parseGitHubUrl(url: string): [string, string] {
    try {
      const cleanUrl = url.trim().toLowerCase();
      // Handle different GitHub URL formats
      const regex = /(?:github\.com[\/:]|git@github\.com:)([^\/]+)\/([^\/\.]+)(?:\.git)?/;
      const match = cleanUrl.match(regex);
      
      if (!match) {
        throw new Error('Invalid GitHub URL format');
      }
      
      return [match[1], match[2]];
    } catch (error) {
      throw new Error('Invalid GitHub repository URL');
    }
  }

  async getRepositoryMetadata(owner: string, repo: string) {
    try {
      const [repoData, languages] = await Promise.all([
        this.octokit.repos.get({ owner, repo }),
        this.octokit.repos.listLanguages({ owner, repo })
      ]);

      return {
        description: repoData.data.description,
        stars: repoData.data.stargazers_count,
        forks: repoData.data.forks_count,
        languages: languages.data
      };
    } catch (error) {
      console.error('Error fetching repository metadata:', error);
      throw error;
    }
  }
}