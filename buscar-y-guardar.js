const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Función para buscar productos en Mercado Libre México y guardar resultados
 * @param {string} producto - Nombre del producto a buscar
 * @returns {Promise<Array>} Array con los primeros 10 precios encontrados
 */
async function buscarYGuardarProducto(producto) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    
    console.log('Navegando a Mercado Libre México...');
    const searchUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(producto)}`;
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log(`Buscando: ${producto}...`);
    
    await page.waitForFunction(() => {
      return document.querySelectorAll('.ui-search-layout__item').length > 0 ||
             document.querySelectorAll('.ui-search-result').length > 0;
    }, { timeout: 15000 });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Extrayendo precios...');
    const precios = await page.evaluate(() => {
      let elementos = document.querySelectorAll('.ui-search-layout__item');
      if (elementos.length === 0) {
        elementos = document.querySelectorAll('.ui-search-result');
      }
      
      const preciosArray = [];
      
      for (let i = 0; i < Math.min(elementos.length, 10); i++) {
        const elemento = elementos[i];
        
        let precioElement = elemento.querySelector('.andes-money-amount__fraction');
        if (!precioElement) {
          precioElement = elemento.querySelector('.price-tag-fraction');
        }
        
        if (precioElement) {
          const precio = precioElement.textContent.trim();
          
          let titulo = 'Sin título';
          let tituloElement = elemento.querySelector('h2.poly-box.poly-component__title a');
          if (tituloElement) {
            titulo = tituloElement.textContent.trim();
          } else {
            tituloElement = elemento.querySelector('h2.poly-component__title a');
            if (tituloElement) {
              titulo = tituloElement.textContent.trim();
            } else {
              tituloElement = elemento.querySelector('.poly-component__title');
              if (tituloElement) {
                titulo = tituloElement.textContent.trim();
              } else {
                tituloElement = elemento.querySelector('.ui-search-item__title');
                if (tituloElement) {
                  titulo = tituloElement.textContent.trim();
                }
              }
            }
          }
          
          let linkElement = elemento.querySelector('a.poly-component__title');
          if (!linkElement) {
            linkElement = elemento.querySelector('a');
          }
          const link = linkElement ? linkElement.href : '';
          
          preciosArray.push({
            posicion: i + 1,
            titulo: titulo,
            precio: precio,
            link: link
          });
        }
      }
      
      return preciosArray;
    });

    console.log('\n=== RESULTADOS ===\n');
    precios.forEach(item => {
      console.log(`${item.posicion}. ${item.titulo}`);
      console.log(`   Precio: $${item.precio} MXN`);
      console.log(`   Link: ${item.link}\n`);
    });

    // Guardar resultados en archivo JSON
    const fecha = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const nombreArchivo = `resultados-${producto.replace(/\s+/g, '-')}-${fecha}.json`;
    const rutaArchivo = path.join(__dirname, 'resultados', nombreArchivo);
    
    // Crear carpeta resultados si no existe
    const carpetaResultados = path.join(__dirname, 'resultados');
    if (!fs.existsSync(carpetaResultados)) {
      fs.mkdirSync(carpetaResultados);
    }
    
    const datosGuardar = {
      producto: producto,
      fecha: new Date().toISOString(),
      totalResultados: precios.length,
      resultados: precios
    };
    
    fs.writeFileSync(rutaArchivo, JSON.stringify(datosGuardar, null, 2), 'utf8');
    console.log(`\n✓ Resultados guardados en: ${rutaArchivo}`);

    return precios;

  } catch (error) {
    console.error('Error durante el scraping:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Ejecutar el scraper
const productoABuscar = process.argv[2] || 'laptop';
console.log(`\nIniciando búsqueda de: "${productoABuscar}"\n`);

buscarYGuardarProducto(productoABuscar)
  .then(resultados => {
    console.log(`\n✓ Proceso completado - ${resultados.length} productos encontrados`);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
