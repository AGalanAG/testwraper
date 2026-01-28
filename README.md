# Mercado Libre Scraper

Programa sencillo con Node.js y Puppeteer para buscar productos en Mercado Libre México y obtener los primeros 10 precios.

## Instalación

```bash
npm install
```

## Uso

Para buscar un producto específico:

```bash
npm start "nombre del producto"
```

O directamente con Node:

```bash
node index.js "nombre del producto"
```

Para buscar y guardar resultados en un archivo JSON:

```bash
node buscar-y-guardar.js "nombre del producto"
```

### Ejemplos

```bash
npm start laptop
npm start "iPhone 15"
npm start "teclado mecánico"

# Guardar resultados
node buscar-y-guardar.js laptop
```

Si no especificas un producto, buscará "laptop" por defecto.

Los resultados se guardan en la carpeta `resultados/` con formato JSON.

## Características

- ✅ Búsqueda en Mercado Libre México
- ✅ Obtiene los primeros 10 resultados
- ✅ Muestra precio, título y link de cada producto
- ✅ Sin uso de proxies (uso ligero)
- ✅ Navegador visible (configurable)

## Configuración

En [index.js](index.js) puedes modificar:

- `headless: false` → Cambia a `true` si no quieres ver el navegador
- Los selectores CSS si Mercado Libre cambia su estructura

## Notas

- Diseñado para uso ocasional (pocas búsquedas por semana)
- No incluye rotación de proxies ya que es para uso ligero
- El navegador se muestra por defecto para debugging
