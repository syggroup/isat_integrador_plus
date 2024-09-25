'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');

const { name } = require('../package.json');

exports.default = async _context => {
    const pathOfExec1 = path.join(__dirname, '..', 'dist', 'win-unpacked', `${name}.exe`);
    const pathOfExec2 = path.join(__dirname, '..', 'dist', 'win-ia32-unpacked', `${name}.exe`);

    const gtoken = await exec(`gcloud auth print-access-token`);

    const sign1 = await exec(`jsign --storetype GOOGLECLOUD --storepass "${gtoken.stdout.trim()}" --keystore "projects/projeto-hsm/locations/global/keyRings/CodeSigningEV" --alias "SygecomKeyEV" --certfile "${path.join(__dirname, 'sygecom_informatica_ltda.pem')}" --tsmode RFC3161 --tsaurl http://timestamp.digicert.com ${pathOfExec1}`);
    const sign2 = await exec(`jsign --storetype GOOGLECLOUD --storepass "${gtoken.stdout.trim()}" --keystore "projects/projeto-hsm/locations/global/keyRings/CodeSigningEV" --alias "SygecomKeyEV" --certfile "${path.join(__dirname, 'sygecom_informatica_ltda.pem')}" --tsmode RFC3161 --tsaurl http://timestamp.digicert.com ${pathOfExec2}`);

    if (sign1.stderr || sign2.stderr) {
        throw new Error(sign1.stderr || sign2.stderr);
    }
};