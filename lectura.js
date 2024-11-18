import fs from 'node:fs';

const ruta = "D:\\TEMP-DESTRUIR-AQUI\\";
//const ruta = "M:\\WorkSpeed1\\Temporadas\\Temporada 6\\s06e01 Project NAS ITX\\pub\\";

const readRecursivo = (archivo) => {

    const readStream = fs.createReadStream(archivo);

    readStream.on('data', chunk => {
        // process the data chunk

    });

    readStream.on('end', () => {
        process.stdout.write('.');
        readStream.destroy();
        readRecursivo(archivo);
    });
}

const archivos = fs.readdirSync(ruta).map(v => `${ruta}${v}`);

archivos.forEach(f => {
    if (fs.statSync(f).size > 500000000)
        readRecursivo(f);
});


