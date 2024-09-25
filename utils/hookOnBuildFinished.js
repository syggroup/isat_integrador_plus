'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { name, version } = require('../package.json');

function hashFile(file, algorithm = 'sha512', encoding = 'base64', options) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        hash.on('error', reject).setEncoding(encoding);
        fs.createReadStream(
            file,
            Object.assign({}, options, {
                highWaterMark: 1024 * 1024,
                /* better to use more memory but hash faster */
            })
        )
            .on('error', reject)
            .on('end', () => {
                hash.end();
                console.log('hash done');
                console.log(hash.read());
                resolve(hash.read());
            })
            .pipe(
                hash,
                {
                    end: false,
                }
            );
    });
}

exports.default = async _context => {
    const pathOfExec = path.join(__dirname, '..', 'dist', `${name} Setup ${version}.exe`);

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const gtoken = await exec(`gcloud auth print-access-token`);

    const sign = await exec(`jsign --storetype GOOGLECLOUD --storepass "${gtoken.stdout.trim()}" --keystore "projects/projeto-hsm/locations/global/keyRings/CodeSigningEV" --alias "SygecomKeyEV" --certfile "${path.join(__dirname, 'sygecom_informatica_ltda.pem')}" --tsmode RFC3161 --tsaurl http://timestamp.digicert.com "${pathOfExec}"`);

    if (sign.stderr) {
        throw new Error(sign.stderr);
    }

    hashFile(pathOfExec);
};