# Mercado Libre Scraper - Módulo Node.js

Módulo de Node.js con Puppeteer para buscar productos en Mercado Libre México y obtener información estructurada de resultados. Diseñado para integrarse en aplicaciones backend.

## Instalación

```bash
npm install
```

## Uso como Módulo

### Importar en tu proyecto

```javascript
const buscarProducto = require('./index');

// Realizar una búsqueda
const resultado = await buscarProducto('laptop');
console.log(resultado);
```

### Respuesta Exitosa

```javascript
{
  "exito": true,
  "producto": "laptop",
  "totalResultados": 15,
  "coincidenciasExactas": 10,
  "coincidenciasParciales": 5,
  "resultados": [
    {
      "posicion": 1,
      "titulo": "Laptop HP 15.6\" Intel Core i5",
      "precio": "8999",
      "link": "https://...",
      "coincidenciaExacta": true
    },
    // ... más resultados
  ]
}
```

### Respuesta con Error

```javascript
{
  "exito": false,
  "error": "Mensaje de error descriptivo",
  "producto": "laptop"
}
```

## Uso desde CLI (Opcional)

También puede ejecutarse directamente desde línea de comandos:

```bash
node index.js "nombre del producto"
```

Si no se especifica producto, busca "laptop" por defecto.

## Características

- ✅ Módulo exportable para integración backend
- ✅ Búsqueda en Mercado Libre México
- ✅ Hasta 15 resultados por búsqueda
- ✅ Clasificación de coincidencias exactas vs parciales
- ✅ Respuesta estructurada en JSON
- ✅ Manejo de errores robusto
- ✅ Modo headless por defecto
- ✅ User-Agent configurado para evitar bloqueos

## API

### `buscarProducto(producto)`

Busca un producto en Mercado Libre México.

**Parámetros:**
- `producto` (string): Nombre del producto a buscar

**Retorna:**
- `Promise<Object>`: Objeto con resultados de la búsqueda

**Propiedades del objeto de respuesta:**
- `exito` (boolean): Indica si la búsqueda fue exitosa
- `producto` (string): Producto que se buscó
- `totalResultados` (number): Cantidad total de resultados encontrados
- `coincidenciasExactas` (number): Resultados con coincidencia exacta de palabras
- `coincidenciasParciales` (number): Resultados con coincidencia parcial
- `resultados` (Array): Lista de productos encontrados
- `error` (string): Mensaje de error (solo si `exito: false`)

**Propiedades de cada resultado:**
- `posicion` (number): Posición del resultado (1-15)
- `titulo` (string): Título del producto
- `precio` (string): Precio del producto
- `link` (string): URL del producto
- `coincidenciaExacta` (boolean): Si el producto coincide exactamente con la búsqueda

## Ejemplo de Integración

```javascript
const express = require('express');
const buscarProducto = require('./index');

const app = express();

app.get('/api/buscar/:producto', async (req, res) => {
  try {
    const resultado = await buscarProducto(req.params.producto);
    
    if (resultado.exito) {
      res.json(resultado);
    } else {
      res.status(500).json({ error: resultado.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('API escuchando en puerto 3000');
});
```

## Notas Técnicas

- Ejecuta Puppeteer en modo headless para mayor eficiencia
- Configura User-Agent y propiedades para evitar detección
- Timeouts configurados para manejar sitios lentos
- Maneja múltiples selectores CSS por si cambia la estructura del sitio
- Los resultados se ordenan priorizando coincidencias exactas

## Recomendaciones

- Diseñado para uso ocasional (evita hacer cientos de peticiones consecutivas)
- No incluye rotación de proxies (uso moderado)
- Implementa rate limiting en tu backend para evitar bloqueos
- Considera cachear resultados para búsquedas frecuentes
