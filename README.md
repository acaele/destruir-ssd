# destruir-ssd
Script muy simple que usé en mi video titulado "INTENTÉ DESTRUIR EL SSD CHINO | MOVESPEED"

## Video
[![Alt text](https://img.youtube.com/vi/47y121lly9k/0.jpg)](https://www.youtube.com/watch?v=47y121lly9k)

## Instrucciones

El script funciona con Node.JS, mételo en una carpeta y haz `npm install` (una sola vez) 

Para ejecutarlo `node destruir-ssd.js argumentos`

## Ejemplo

Esta línea escribirá 220 TBW en el ssd J: en archivos aleatorios de entre 20 MB y 25 GB:

`node .\destruir-ssd.js --ruta J: --total 220T --minimo 20M --maximo 25G`

No te puedes equivocar de dispositivo.

Por motivos de seguridad en la unidad `J:` debe existir la carpeta 
`"J:\TEMP-DESTRUIR-AQUI"`

### Para más detalles 😁
https://youtu.be/47y121lly9k

**acaele, entretenimiento informático**
