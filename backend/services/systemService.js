import os from 'os';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
let lastNetworkStats = { rx: 0, tx: 0, time: Date.now() };

// Cache for slow stats
let cachedDiskStats = { total: 0, free: 0, used: 0, percentage: 0, lastFetch: 0 };
const DISK_CACHE_TTL = 60000; // 60 seconds

export const getSystemStats = async () => {
    const uptime = os.uptime();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = (usedMem / totalMem) * 100;

    // CPU Usage (Load average or heuristic)
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const loadAvg = os.loadavg();
    let cpuUsage = os.platform() === 'win32' ? 0 : (loadAvg[0] / cpus.length) * 100;
    let diskUsage = { total: 0, free: 0, used: 0, percentage: 0 };

    // Network Usage
    let networkUsage = { down: 0, up: 0 };

    if (os.platform() === 'win32') {
        try {
            const now = Date.now();
            const promises = [];

            // 1. CPU Usage (Every time)
            const cpuPromise = execPromise('powershell -Command "(Get-Counter \'\\Processor(_Total)\\% Processor Time\' -ErrorAction SilentlyContinue).CounterSamples.CookedValue"', { windowsHide: true })
                .then(({ stdout }) => {
                    const realCpu = parseFloat(stdout.trim());
                    if (!isNaN(realCpu)) cpuUsage = realCpu;
                })
                .catch(e => console.error('CPU fetch failed:', e));
            promises.push(cpuPromise);

            // 2. Network Stats (Every time)
            const netPromise = execPromise('powershell -Command "Get-NetAdapterStatistics | Select-Object ReceivedBytes, SentBytes | ConvertTo-Json"', { windowsHide: true })
                .then(({ stdout }) => {
                    const netData = JSON.parse(stdout);
                    let totalRx = 0;
                    let totalTx = 0;
                    if (Array.isArray(netData)) {
                        netData.forEach(adapter => {
                            totalRx += adapter.ReceivedBytes || 0;
                            totalTx += adapter.SentBytes || 0;
                        });
                    } else if (netData) {
                        totalRx = netData.ReceivedBytes || 0;
                        totalTx = netData.SentBytes || 0;
                    }
                    const timeDiff = (now - lastNetworkStats.time) / 1000;
                    if (timeDiff > 0 && lastNetworkStats.rx > 0) {
                        networkUsage.down = Math.max(0, (totalRx - lastNetworkStats.rx) / timeDiff);
                        networkUsage.up = Math.max(0, (totalTx - lastNetworkStats.tx) / timeDiff);
                    }
                    lastNetworkStats = { rx: totalRx, tx: totalTx, time: now };
                })
                .catch(e => console.error('Network fetch failed:', e));
            promises.push(netPromise);

            // 3. Disk Stats (Cached)
            if (now - cachedDiskStats.lastFetch > DISK_CACHE_TTL) {
                const diskPromise = execPromise('powershell -Command "Get-Volume -DriveLetter C | Select-Object Size, SizeRemaining | ConvertTo-Json"', { windowsHide: true })
                    .then(({ stdout }) => {
                        const data = JSON.parse(stdout);
                        if (data.Size > 0) {
                            cachedDiskStats = {
                                total: data.Size,
                                free: data.SizeRemaining,
                                used: data.Size - data.SizeRemaining,
                                percentage: ((data.Size - data.SizeRemaining) / data.Size) * 100,
                                lastFetch: now
                            };
                        }
                    })
                    .catch(e => console.error('Disk fetch failed:', e));
                promises.push(diskPromise);
            }

            // Run all in parallel
            await Promise.all(promises);
            diskUsage = cachedDiskStats; // Use either fresh or current cache
        } catch (e) {
            console.error('Failed to get system stats via PowerShell:', e);
        }
    }

    return {
        platform: os.platform(),
        hostname: os.hostname(),
        uptime,
        cpu: {
            model: cpuModel,
            usage: cpuUsage,
            cores: cpus.length
        },
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            percentage: memUsage
        },
        disk: diskUsage,
        network: networkUsage
    };
};
