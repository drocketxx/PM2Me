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
        const git = simpleGit({ spawnOptions: { windowsHide: true } }).env(envOptions);
        await git.clone(finalUrl, targetPath, ['--branch', branchName]);
        const gitLocal = simpleGit(targetPath, { spawnOptions: { windowsHide: true } });
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
            const git = simpleGit(targetPath, { spawnOptions: { windowsHide: true } }).env(envOptions);
            await git.remote(['set-url', 'origin', finalUrl]);
            await git.fetch('origin', branchName);
            await git.checkout(branchName);
            await git.reset(['--hard', 'FETCH_HEAD']);
            await git.clean('f', ['-d']);
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
    const git = simpleGit({ spawnOptions: { windowsHide: true } }).env({ ...process.env, GIT_TERMINAL_PROMPT: '0' });
    const branches = await git.listRemote(['--heads', finalUrl]);
    // Parse branch output, simplistic split
    return branches.split('\n').filter(Boolean).map(line => line.split('refs/heads/')[1]);
};

/**
 * Get the number of commits that the local branch is behind its remote origin counterpart.
 */
export const getBehindCount = async (repoUrl, targetPath, branchName, token = null) => {
    const isGitRepo = fs.existsSync(path.join(targetPath, '.git'));
    if (!isGitRepo) return 0;

    const finalUrl = getFinalUrl(repoUrl, token);
    const git = simpleGit(targetPath, { spawnOptions: { windowsHide: true } }).env({ ...process.env, GIT_TERMINAL_PROMPT: '0' });

    try {
        await git.remote(['set-url', 'origin', finalUrl]);
        await git.fetch(['origin', branchName]);
        const count = await git.raw(['rev-list', '--count', `HEAD..origin/${branchName}`]);
        return parseInt(count.trim(), 10) || 0;
    } catch (err) {
        console.error(`Git behind count error for ${targetPath}:`, err.message);
        return 0;
    }
};

export const checkout = async (targetPath, ref) => {
    const git = simpleGit(targetPath, { spawnOptions: { windowsHide: true } }).env({ ...process.env, GIT_TERMINAL_PROMPT: '0' });
    try {
        await git.checkout(ref);
        const log = await git.log(['-1']);
        return {
            hash: log.latest.hash.trim(),
            message: log.latest.message.trim()
        };
    } catch (err) {
        throw new Error(`Git Checkout Error: ${err.message}`);
    }
};
