# Herramientas de comparación con el original

Con esto se verificó que la réplica calza con
<https://implantecapilar.clinicatempora.cl/>. Sirve para volver a comprobarlo si
alguien toca el CSS.

```
tools/
├── collector.js   servidor que recibe y guarda las huellas de layout
├── fingerprint.js el script que se pega en la consola del navegador
└── diff.js        compara dos huellas y lista las diferencias
```

## Cómo se usa

1. Levanta el colector:

   ```bash
   node tools/collector.js
   ```

2. Abre el **original** en el navegador, ajusta el viewport (1440×900, 900 o 390),
   pega [`fingerprint.js`](fingerprint.js) en la consola y ejecuta:

   ```js
   __fp(SELECTORES_ORIGINAL, 'orig')
   ```

3. Abre **tu versión** en el mismo viewport, pega el mismo script y ejecuta:

   ```js
   __fp(SELECTORES_REPLICA, 'replica')
   ```

   Los dos arrays de selectores están al final de `fingerprint.js`.

4. Compara:

   ```bash
   node tools/diff.js replica orig
   ```

Salida: alto de cada sección en las dos páginas, elementos que faltan o sobran, y
para cada elemento coincidente las diferencias de posición (x, y), tamaño (w, h),
tipografía, color, radio y padding que superen la tolerancia (4px en x, 6px en el resto).

## Qué es una "huella de layout"

Para cada nodo de texto, imagen, video, campo de formulario y botón se guarda:

- su posición **relativa a la sección** que lo contiene (así un desfase en una
  sección no contamina las siguientes)
- el rect real de los glifos, obtenido con `Range.getBoundingClientRect()`, no el
  de la caja del elemento: da igual cómo esté envuelto el texto
- tipografía, tamaño, peso, interlineado, alineación y color computados

Por eso se pueden comparar dos maquetas con estructuras HTML completamente
distintas (Elementor vs. la réplica) y saber si se ven igual.

## Artefactos conocidos de la medición

Cosas que el diff marca y **no** son diferencias visuales:

- **Videos de testimonios**: el carrusel del original usa modo loop y duplica los
  slides fuera de pantalla, por eso aparecen `video3`…`video8` con x negativas.
  Los slides visibles sí coinciden.
- **Galería de "por qué elegirnos"**: tiene autoplay, así que cada página puede
  estar en un slide distinto al medir.
- **`ta` (text-align) y `nat` (tamaño natural de imagen)**: son metadatos; si el
  rect coincide, se ve igual.
- **Segundo bullet del hero**: en el original el ✓ va dentro del mismo nodo de
  texto y en la réplica es un `::before`, así que el nodo empieza 16px después.
