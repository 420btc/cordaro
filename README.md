# Incoming Energy by Magnetic Anomaly

Monitor científico-visual de **energía entrante por anomalía magnética**, que combina la posición real de la **Luna y el Sol**, las **placas tectónicas** y una estimación de anomalía magnética inspirada en el **método Cordaro**.

> ⚠️ Herramienta educativa y de divulgación. **No es una predicción sísmica oficial.**

---

## Inspiración: Richard Cordaro (@rrichcord)

Este proyecto está inspirado en el trabajo de **Richard Cordaro** ([@rrichcord](https://x.com/rrichcord)), investigador independiente con doctorado en Física por la **Universidad de Arizona** (EE. UU.).

Su método propone que ciertas alineaciones angulares de la Luna con el Sol y otros planetas generan una **"energía entrante"** que se refleja en el **espectro de anomalías magnéticas** y en la **tasa global de sismos**. Esta aplicación representa esa idea de forma visual: posición de la Luna y el Sol, ángulo Luna–Sol, cruces sobre fronteras tectónicas y una estimación de la energía entrante.

> **Nota**: es un método de investigación independiente, **no validado por la sismología oficial**.

### No confundir con Enrique Guillermo Cordaro

Existe otro investigador con el mismo apellido: **Enrique Guillermo Cordaro**, físico de la **Universidad de Chile**, que estudia las variaciones del campo magnético terrestre (rigidez de corte geomagnético, anomalías de Bz) como posible precursor sísmico, con publicaciones revisadas por pares. Son **personas distintas** y líneas de trabajo distintas.

---

## Investigación relacionada: viento solar y sismos

Parte de este proyecto (el panel de **viento solar** y la **validación estadística de cruces**) se apoya en el siguiente estudio revisado por pares:

- **Marchitelli V., Harabaglia P., Troise C., De Natale G.** (2020). *On the correlation between solar activity and large earthquakes worldwide*. Scientific Reports, 10:11495. DOI: [10.1038/s41598-020-67860-3](https://doi.org/10.1038/s41598-020-67860-3).

El estudio analiza 20 años de densidad de protones del viento solar (SOHO/CELIAS) y encuentra correlación con sismos grandes (M ≥ 5.6) con un desfase de un día, proponiendo el efecto piezoeléctrico inverso como posible mecanismo. De aquí se toman el umbral de densidad (≈ 15.5 protones/cm³) y la metodología estadística (tasa relativa de eventos + test de significancia) usados para evaluar los cruces Luna/antípoda.

---

## Qué muestra

- **Posición real de la Luna y el Sol** a lo largo del día (calculada con `astronomy-engine`).
- **Trayectorias** lunares, solares y de la antípoda sobre un mapa mundial.
- **Fronteras de placas tectónicas** y observatorios magnéticos.
- **Cruces de placas**: cuándo la Luna (o su antípoda) pasa por encima de una frontera tectónica.
- **Cuenta atrás** en horas, minutos y segundos para cada cruce, con minimapas interactivos.
- **Gráfico de energía entrante**: curva de energía entrante, tasa global de sismos, nivel de alerta y sismos (puntos).
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
3. **Energía entrante**: se estima a partir de la posición lunar y los cruces de placas; los sismos son **datos reales de USGS** (magnitud ≥ 4).

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

- Las posiciones de la Luna y el Sol son **reales** (astronomy-engine).
- Los sismos son **datos reales de USGS** (magnitud ≥ 4).
- La energía entrante es una **estimación** basada en la posición lunar y los cruces de placas, no una predicción oficial.
- No sustituye a organismos sismológicos oficiales ni debe usarse para tomar decisiones de seguridad.

---

## Créditos

- **Richard Cordaro** ([@rrichcord](https://x.com/rrichcord)), por el método de "energía entrante" por anomalía magnética que inspira este proyecto.
- **Enrique Guillermo Cordaro** (Universidad de Chile), por su línea de investigación independiente en geomagnetismo y sismos.
- **Marchitelli, Harabaglia, Troise & De Natale** (Scientific Reports, 2020), por el estudio sobre correlación entre actividad solar y sismos en el que se basan el panel de viento solar y la validación de cruces.
- `astronomy-engine` de Don Cross, por los cálculos astronómicos de alta precisión.
- OpenStreetMap / CARTO por las teselas de los mapas.
