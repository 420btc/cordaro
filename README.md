# Incoming Energy by Magnetic Anomaly

Monitor científico-visual de **energía entrante por anomalía magnética**, que combina la posición real de la **Luna y el Sol**, las **placas tectónicas** y una estimación de anomalía magnética inspirada en el **método Cordaro**.

> ⚠️ Herramienta educativa y de divulgación. **No es una predicción sísmica oficial.**

---

## Homenaje a Enrique Cordaro

Este proyecto quiere rendir homenaje a **Enrique Cordaro**, geofísico chileno de la **Universidad de Chile**, pionero en estudiar las variaciones del campo magnético terrestre como posible señal precursora de la actividad sísmica.

Su trabajo propone que, antes de grandes terremotos, se observan alteraciones características en el campo magnético local. Esta aplicación recoge esa idea de forma visual y accesible: muestra dónde está la Luna (y su antípoda) en cada momento, cuándo cruza una frontera tectónica y cómo se relaciona con la "energía entrante" estimada.

Toda la base científica corresponde a su línea de investigación; aquí solo se representa de forma divulgativa.

---

## Qué muestra

- **Posición real de la Luna y el Sol** a lo largo del día (calculada con `astronomy-engine`).
- **Trayectorias** lunares, solares y de la antípoda sobre un mapa mundial.
- **Fronteras de placas tectónicas** y observatorios magnéticos.
- **Cruces de placas**: cuándo la Luna (o su antípoda) pasa por encima de una frontera tectónica.
- **Cuenta atrás** en horas, minutos y segundos para cada cruce, con minimapas interactivos.
- **Gráfico de energía entrante**: anomalía magnética (bandas de intensidad), tasa global y nivel de alerta.
- **Resumen del día**: fase lunar, ángulo Luna–Sol, distancia lunar, cruces, pico de energía y sismos.

---

## Tecnologías

- [Next.js](https://nextjs.org/) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) para los mapas
- [Recharts](https://recharts.org/) para los gráficos
- [astronomy-engine](https://github.com/cosinekitty/astronomy) para posiciones astronómicas reales
- [Turf.js](https://turfjs.org/) para detectar cruces geométricos con las fronteras

---

## Cómo funciona

1. **Astronomía real**: la posición sublunar y subsolar se calcula con `astronomy-engine` (declinación + tiempo sidéreo de Greenwich).
2. **Cruces**: con `@turf/turf` se detecta cuándo la trayectoria lunar (o su antípoda) interseca una frontera de placas.
3. **Energía entrante**: la anomalía magnética es una **simulación visual** del método; los sismos mostrados son **datos de ejemplo**.

---

## Instalación y uso

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Límites y aviso

- Las posiciones de la Luna y el Sol son **reales**.
- Las anomalías magnéticas son una **simulación** y los sismos son **datos de ejemplo** (salvo que se conecte una fuente real como USGS).
- No sustituye a organismos sismológicos oficiales ni debe usarse para tomar decisiones de seguridad.

---

## Créditos

- **Enrique Cordaro** y su equipo de la Universidad de Chile, por la investigación en variaciones del campo magnético como precursor sísmico.
- `astronomy-engine` de Don Cross, por los cálculos astronómicos de alta precisión.
- OpenStreetMap / CARTO por las teselas de los mapas.
