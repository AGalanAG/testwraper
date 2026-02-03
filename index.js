const puppeteer = require('puppeteer');

/**
 * Función principal para buscar productos en Mercado Libre México
 * @param {string} producto - Nombre del producto a buscar
 * @returns {Promise<Array>} Array con los primeros 10 precios encontrados
 */
async function buscarProducto(producto) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Configurar User-Agent para parecer un navegador real
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Ocultar que estamos usando Puppeteer
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    const searchUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(producto)}`;
    
    try {
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000
      });
    } catch (navError) {
      // Si falla la navegación, intentar continuar de todas formas
      console.error('Advertencia navegación:', navError.message);
    }

    // Esperar con timeout más flexible
    try {
      await page.waitForSelector('.ui-search-layout__item, .ui-search-result', { 
        timeout: 20000 
      });
    } catch (waitError) {
      // Verificar si hay elementos de todas formas
      const elementosExisten = await page.evaluate(() => {
        return document.querySelectorAll('.ui-search-layout__item').length > 0 ||
               document.querySelectorAll('.ui-search-result').length > 0;
      });
      
      if (!elementosExisten) {
        throw new Error('No se encontraron resultados de búsqueda. Posible bloqueo o problema de red.');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const precios = await page.evaluate((productoBuscado) => {
      // Intentar con diferentes selectores
      let elementos = document.querySelectorAll('.ui-search-layout__item');
      if (elementos.length === 0) {
        elementos = document.querySelectorAll('.ui-search-result');
      }
      
      const preciosArray = [];
      
      for (let i = 0; i < Math.min(elementos.length, 15); i++) {
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
      
      // Clasificar: primero los que tienen la palabra exacta, luego el resto
      const palabrasBuscadas = productoBuscado.toLowerCase().split(/\s+/);
      
      const conCoincidenciaExacta = preciosArray.filter(item => {
        const tituloLower = item.titulo.toLowerCase();
        return palabrasBuscadas.every(palabra => {
          // Buscar la palabra completa usando word boundary
          const regex = new RegExp(`\\b${palabra}\\b`, 'i');
          return regex.test(tituloLower);
        });
      });
      
      const sinCoincidenciaExacta = preciosArray.filter(item => {
        const tituloLower = item.titulo.toLowerCase();
        return !palabrasBuscadas.every(palabra => {
          const regex = new RegExp(`\\b${palabra}\\b`, 'i');
          return regex.test(tituloLower);
        });
      });
      
      // Reordenar posiciones
      const resultadosOrdenados = [...conCoincidenciaExacta, ...sinCoincidenciaExacta];
      resultadosOrdenados.forEach((item, index) => {
        item.posicion = index + 1;
        item.coincidenciaExacta = index < conCoincidenciaExacta.length;
      });
      
      return resultadosOrdenados;
    }, producto);

    const exactas = precios.filter(p => p.coincidenciaExacta).length;
    const parciales = precios.length - exactas;

    return {
      exito: true,
      producto: producto,
      totalResultados: precios.length,
      coincidenciasExactas: exactas,
      coincidenciasParciales: parciales,
      resultados: precios
    };

  } catch (error) {
    return {
      exito: false,
      error: error.message,
      producto: producto
    };
  } finally {
    await browser.close();
  }
}

module.exports = buscarProducto;

// Permitir ejecución directa desde CLI si es necesario
if (require.main === module) {
  const productoABuscar = process.argv[2] || 'laptop';
  buscarProducto(productoABuscar)
    .then(resultado => {
      console.log(JSON.stringify(resultado, null, 2));
      process.exit(resultado.exito ? 0 : 1);
    })
    .catch(error => {
      console.error(JSON.stringify({ exito: false, error: error.message }));
      process.exit(1);
    });
}
