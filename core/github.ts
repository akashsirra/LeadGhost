const API = 'https://api.github.com'
const API_VERSION = '2026-03-10'

export interface GitHubFile {
  path: string
  sha: string
  content: string
}

function repoParts(repository: string) {
  const parts = repository.trim().split('/')
  if (parts.length !== 2 || parts.some(part => !/^[A-Za-z0-9_.-]+$/.test(part))) throw new Error('Repository must use owner/name format.')
  return parts as [string, string]
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.GITHUB_TOKEN
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`)
  return response.json() as Promise<T>
}

export function configuredRepository(): string | null {
  return process.env.AEGIS_GITHUB_REPO?.trim() || null
}

export async function readGitHubFile(repository: string, filePath: string, ref = 'main'): Promise<GitHubFile> {
  const [owner, repo] = repoParts(repository)
  const encoded = filePath.split('/').map(encodeURIComponent).join('/')
  const data = await request<{ type: string; path: string; sha: string; content?: string; encoding?: string }>(`${API}/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(ref)}`)
  if (data.type !== 'file' || !data.content || data.encoding !== 'base64') throw new Error('GitHub path is not a supported text file.')
  return { path: data.path, sha: data.sha, content: Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8') }
}

export async function createGitHubBranch(repository: string, branch: string, fromRef = 'main'): Promise<void> {
  const [owner, repo] = repoParts(repository)
  const refData = await request<{ object: { sha: string } }>(`${API}/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(fromRef)}`)
  await request(`${API}/repos/${owner}/${repo}/git/refs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: refData.object.sha }) })
}

export async function updateGitHubFile(repository: string, filePath: string, beforeSha: string, content: string, branch: string, message: string): Promise<string> {
  const [owner, repo] = repoParts(repository)
  const encoded = filePath.split('/').map(encodeURIComponent).join('/')
  const data = await request<{ commit: { sha: string } }>(`${API}/repos/${owner}/${repo}/contents/${encoded}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, content: Buffer.from(content, 'utf8').toString('base64'), sha: beforeSha, branch }),
  })
  return data.commit.sha
}
