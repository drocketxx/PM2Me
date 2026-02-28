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

export const restartApp = (nameOrId) => {
    return new Promise((resolve, reject) => {
        pm2.restart(nameOrId, (err, proc) => {
            if (err) return reject(err);
            resolve(proc);
        });
    });
};

export const reloadApp = (nameOrId) => {
    return new Promise((resolve, reject) => {
        pm2.reload(nameOrId, (err, proc) => {
            if (err) return reject(err);
            resolve(proc);
        });
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
