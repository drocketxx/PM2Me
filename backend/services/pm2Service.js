import pm2 from 'pm2';

export const connectPM2 = () => {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) return reject(err);
            resolve(true);
        });
    });
};

export const listApps = () => {
    return new Promise((resolve, reject) => {
        pm2.list((err, list) => {
            if (err) return reject(err);
            resolve(list);
        });
    });
};

export const startApp = (options) => {
    return new Promise((resolve, reject) => {
        pm2.start(options, (err, apps) => {
            if (err) return reject(err);
            resolve(apps);
        });
    });
};

export const stopApp = (nameOrId) => {
    return new Promise((resolve, reject) => {
        pm2.stop(nameOrId, (err, proc) => {
            if (err) return reject(err);
            resolve(proc);
        });
    });
};

export const restartApp = (nameOrId, options = {}) => {
    return new Promise((resolve, reject) => {
        if (options && options.updateEnv) {
            // To update env, restart should be called via start with appropriate options
            pm2.start({ ...options, name: nameOrId, updateEnv: true }, (err, proc) => {
                if (err) return reject(err);
                resolve(proc);
            });
        } else {
            pm2.restart(nameOrId, (err, proc) => {
                if (err) return reject(err);
                resolve(proc);
            });
        }
    });
};

export const reloadApp = (nameOrId, options = {}) => {
    return new Promise((resolve, reject) => {
        if (options && options.updateEnv) {
            // pm2.reload doesn't accept options directly in all versions, start with updateEnv enforces a reload/restart
            pm2.start({ ...options, name: nameOrId, updateEnv: true }, (err, proc) => {
                if (err) return reject(err);
                resolve(proc);
            });
        } else {
            pm2.reload(nameOrId, (err, proc) => {
                if (err) return reject(err);
                resolve(proc);
            });
        }
    });
};

export const deleteApp = (nameOrId) => {
    return new Promise((resolve, reject) => {
        pm2.delete(nameOrId, (err, proc) => {
            if (err) return reject(err);
            resolve(proc);
        });
    });
};

export const disconnectPM2 = () => {
    pm2.disconnect();
};
