/* 
    Destructor de SSD mediante actividad exagerada
    by @acaele
*/

import fs from 'node:fs';
import os from 'node:os';
import yargs from 'yargs';
import { exit } from 'node:process';
import { hideBin } from 'yargs/helpers';
import checkDiskSpace from 'check-disk-space';
import prettyBytes from 'pretty-bytes';
import cliProgress from 'cli-progress';
import crypto from 'crypto';

const argv = yargs(hideBin(process.argv)).argv;

//validar argumentos de entrada
if (argv.help || !argv.ruta || !argv.total) {
    console.log(`\n  Usar:
                 \n  node destruir-ssd.js --ruta=ruta --total=bytes[K|M|G|T] [--minimo=bytes[K|M|G|T]] [--maximo=bytes[K|M|G|T]]\
                 \n  (solo números enteros)
                 \n  Dentro de la ruta debe existir una carpeta llamada TEMP-DESTRUIR-AQUI o no se ejecutará
                 \n`);
    exit(3);
}

//solo escribir en la ruta si tiene la carpeta "TEMP-DESTRUIR-AQUI"
const ruta = os.platform() === 'win32'
    ? `${argv.ruta}\\TEMP-DESTRUIR-AQUI\\`.replace("\\\\", "\\")
    : `${argv.ruta}/TEMP-DESTRUIR-AQUI/`.replace("//", "/");


if (!(fs.existsSync(ruta) && fs.statSync(ruta).isDirectory())) {
    console.log(`\n  Ruta inválida: ${ruta}
                 \n`);
    exit(3);
}

//detectar e informar espacio libre 
const tamañoDispositivo = await checkDiskSpace(ruta);
console.log(`\n  Atacaré el dispositivo ${tamañoDispositivo.diskPath} de ${prettyBytes(tamañoDispositivo.size)} que tiene ${prettyBytes(tamañoDispositivo.free)} disponibles`);

//validar argumentos de total
const humanToBytes = (bytesKMGT) => {
    const rx = /^(\d+)([K,M,G,T])?$/g.exec(bytesKMGT);

    if (!rx) return null;
    const base = parseInt(rx[1]);

    switch (rx[2]) {
        case 'K':
            return base * (10 ** 3);
        case 'M':
            return base * (10 ** 6);
        case 'G':
            return base * (10 ** 9);
        case 'T':
            return base * (10 ** 12);
        default:
            return base;
    }
}

const total = humanToBytes(argv.total);

if (!total) {
    console.log(`\n  Faltó especificar bien:  --total=bytes[K|M|G|T]
        \n`);
    exit(3);
}

let min = humanToBytes(argv.minimo) || 0;
let max = humanToBytes(argv.maximo) || total;

if (max === 0) max = total;

if (max > total) {
    console.log(`\n  Valor máximo inválido
        \n`);
    exit(3);
}

if (min < 0 || min > max) {
    console.log(`\n  Valor mínimo inválido
        \n`);
    exit(3);
}


const logRuta = os.platform() === 'win32'
    ? `${process.cwd()}\\output\\destruir-ssd ${new Date().toJSON().slice(0, 19).replaceAll('T', ' ').replaceAll(':', '_')}.log`
    : `${process.cwd()}/output/destruir-ssd ${new Date().toJSON().slice(0, 19).replaceAll('T', ' ').replaceAll(':', '_')}.log`;

console.log(`  Intentaré escribir un total de ${prettyBytes(total)}`);
console.log(`  En archivos aleatorios de entre ${prettyBytes(min)} y ${prettyBytes(max)}`);
console.log(`  Los archivos se escribirán en ${ruta} `);
console.log(`  El log se guardará en ${logRuta} \n`);

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

//ensuciar toda la RAM para no tener que generar datos random cada vez
const maxBufferSize = 2147483647;
let bufferRandom = Array.from({ length: Math.floor(os.freemem() / maxBufferSize) + 1 }, () => { try { crypto.randomBytes(maxBufferSize) } catch (e) { } });
bufferRandom = null;

const bufferSize = 50000000;

bar.start(total, 0);

fs.writeFileSync(logRuta, 'Archivo, Operación, Tamaño, Tiempo, TamañoPretty, TiempoPretty, VelocidadPretty\n');

let escritosTotal = 0;

while (escritosTotal < total) {

    let siguienteTamaño = Math.floor(Math.random() * (max - min + 1) + min);
    if (siguienteTamaño > total - escritosTotal) siguienteTamaño = total - escritosTotal;

    const borrarAlgo = () => {

        let archivos = fs.readdirSync(ruta);
        if (archivos.length === 0) return;

        let borrarNombre = archivos.splice(Math.floor(Math.random() * archivos.length), 1)[0];
        let borrarRuta = `${ruta}${borrarNombre}`;
        let borrarTamaño = 0;

        try {
            borrarTamaño = fs.statSync(borrarRuta).size;

            if (borrarTamaño === 0) return;

            fs.rmSync(borrarRuta);
            fs.appendFileSync(logRuta, `${borrarNombre}, borrar, ${borrarTamaño}, -, ${prettyBytes(borrarTamaño)}, -, -\n`);
        }
        catch (e) {
            return;
        }
    }

    let siguienteTimeStamp = new Date().getTime();
    let siguienteNombre = (`archivo-basura-${siguienteTimeStamp}`);
    let siguienteRuta = `${ruta}${siguienteNombre}`;

    let f;

    try {
        f = fs.openSync(siguienteRuta, 'w');
    }
    catch (e) {
        borrarAlgo();
        continue;
    }

    let auxRestantes = siguienteTamaño;
    while (auxRestantes > 0) {
        const auxEscribir = (auxRestantes > bufferSize) ? bufferSize : auxRestantes;
        try {
            fs.writeSync(f, Buffer.allocUnsafe(auxEscribir));
        }
        catch (e) {
            //disco lleno, borrar unos 10 archivos y reintenar
            Array(10).fill().forEach(_ => borrarAlgo());
            continue;
        }
        auxRestantes = auxRestantes - auxEscribir;
        escritosTotal += auxEscribir;
        bar.update(escritosTotal);
    }
    fs.closeSync(f);

    const tiempoEnSegundos = (new Date().getTime() - siguienteTimeStamp) / 1000;
    const velocidad = tiempoEnSegundos === 0 ? 0 : siguienteTamaño / tiempoEnSegundos;

    fs.appendFileSync(logRuta, `${siguienteNombre}, escribir, ${siguienteTamaño}, ${tiempoEnSegundos}, ${prettyBytes(siguienteTamaño)}, ${tiempoEnSegundos} s, ${prettyBytes(velocidad)}/s\n`);
}

bar.stop();

console.log(`\n  Operación finalizada con éxito \n`);
