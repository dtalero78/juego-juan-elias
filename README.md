# Juan Elito el Dolphin 🐬

Un juego web de acción donde controlas a Juan Elito, un delfín que debe disparar y derrotar a un pulpo mientras esquiva obstáculos en el agua.

## Cómo ejecutar el juego

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

3. Abrir el navegador en: http://localhost:3000/

## Controles

- **↑/↓/←/→** o **W/A/S/D**: Mover a Juan Elito
- **ESPACIO**: Disparar
- **R**: Reiniciar el juego (cuando termina)

## Objetivo

Dispara al pulpo 7 veces para derrotarlo y ganar el juego. Evita las rocas y los proyectiles del pulpo o Juan Elito morirá.

## Características

- Delfín controlable con movimiento horizontal y vertical
- Pulpo enemigo que se mueve verticalmente y dispara proyectiles
- Rocas que aparecen aleatoriamente y se mueven
- Sistema de colisiones
- UI con vida del pulpo
- Condiciones de victoria y derrota

## Tecnología

- Phaser 3 (motor de juego HTML5)
- Vite (servidor de desarrollo)
- JavaScript ES6+
