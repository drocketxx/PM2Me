import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';

const getFinalUrl = (repoUrl, token) => {
    let finalUrl = repoUrl;
    if (token) {
        try {
            const urlObj = new URL(repoUrl);
            urlObj.password = token;
            urlObj.username = 'oauth2';
            finalUrl = urlObj.toString();
        } catch (e) {
            console.error('Invalid URL for cloning', e);
        }
    }
    return finalUrl;
};

export const syncRepo = async (repoUrl, targetPath, branchName, token = null) => {
    const finalUrl = getFinalUrl(repoUrl, token);
    const envOptions = { ...process.env, GIT_TERMINAL_PROMPT: '0' }; // Prevent hanging on auth prompts or merge editors

    const isGitRepo = fs.existsSync(path.join(targetPath, '.git'));

    const freshClone = async () => {
        if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true, force: true });
        }
        fs.mkdirSync(targetPath, { recursive: true });
        const git = simpleGit().env(envOptions);
        await git.clone(finalUrl, targetPath, ['--branch', branchName]);
        const gitLocal = simpleGit(targetPath);
        const log = await gitLocal.log(['-1']);
        const commitHash = log.latest.hash;
        const commitMessage = log.latest.message;
        return { message: 'Cloned repository cleanly', commitHash: commitHash.trim(), commitMessage: commitMessage.trim() };
    };

    if (!isGitRepo) {
        try {
            return await freshClone();
        } catch (err) {
            throw new Error(`Git Clone Error: ${err.message}`);
        }
    } else {
        try {
            const git = simpleGit(targetPath).env(envOptions);
            await git.remote(['set-url', 'origin', finalUrl]);
            await git.fetch(['origin']);
            await git.reset(['--hard']);
            await git.clean('f', ['-d']); // Remove untracked files
            await git.pull('origin', branchName, { '--force': null, '--no-edit': null });
            const log = await git.log(['-1']);
            const commitHash = log.latest.hash;
            const commitMessage = log.latest.message;
            return { message: 'Pulled latest changes cleanly', commitHash: commitHash.trim(), commitMessage: commitMessage.trim() };
        } catch (err) {
            console.warn(`Git Sync failed, attempting fresh clone. Reason: ${err.message}`);
            try {
                return await freshClone();
            } catch (cloneErr) {
                throw new Error(`Git Sync & Retreat Clone Error: ${cloneErr.message}`);
            }
        }
    }
};

export const getBranches = async (repoUrl, token = null) => {
    const finalUrl = getFinalUrl(repoUrl, token);
    const git = simpleGit().env({ ...process.env, GIT_TERMINAL_PROMPT: '0' });
    const branches = await git.listRemote(['--heads', finalUrl]);
    // Parse branch output, simplistic split
    return branches.split('\n').filter(Boolean).map(line => line.split('refs/heads/')[1]);
};
