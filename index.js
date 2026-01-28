const puppeteer = require('puppeteer');

/**
 * Función principal para buscar productos en Mercado Libre México
 * @param {string} producto - Nombre del producto a buscar
 * @returns {Promise<Array>} Array con los primeros 10 precios encontrados
 */
async function buscarProducto(producto) {
  const browser = await puppeteer.launch({
    headless: false, // Cambia a true si no quieres ver el navegador
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    
    // Navegar directamente a la búsqueda en Mercado Libre México
    console.log('Navegando a Mercado Libre México...');
    const searchUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(producto)}`;
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log(`Buscando: ${producto}...`);
    
    // Esperar a que carguen los resultados con diferentes posibles selectores
    await page.waitForFunction(() => {
      return document.querySelectorAll('.ui-search-layout__item').length > 0 ||
             document.querySelectorAll('.ui-search-result').length > 0;
    }, { timeout: 15000 });
    
    // Esperar un poco más para asegurar que todos los elementos estén cargados
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extraer los precios
    console.log('Extrayendo precios...');
    const precios = await page.evaluate(() => {
      // Intentar con diferentes selectores
      let elementos = document.querySelectorAll('.ui-search-layout__item');
      if (elementos.length === 0) {
        elementos = document.querySelectorAll('.ui-search-result');
      }
      
      const preciosArray = [];
      
      for (let i = 0; i < Math.min(elementos.length, 10); i++) {
        const elemento = elementos[i];
        
        // Buscar el precio dentro del elemento (varios posibles selectores)
        let precioElement = elemento.querySelector('.andes-money-amount__fraction');
        if (!precioElement) {
          precioElement = elemento.querySelector('.price-tag-fraction');
        }
        
        if (precioElement) {
          const precio = precioElement.textContent.trim();
          
          // Obtener el título del producto - probar múltiples selectores
          let titulo = 'Sin título';
          
          // Intentar con diferentes selectores de título
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
          
          // Obtener el link del producto
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

buscarProducto(productoABuscar)
  .then(resultados => {
    console.log(`\n✓ Se encontraron ${resultados.length} productos`);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
