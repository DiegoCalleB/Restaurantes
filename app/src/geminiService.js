import { GoogleGenAI, Type } from '@google/genai';

// Initialize the client. The API key must be in the .env file as VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Si no hay key, tiraremos un error controlado
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Convert File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // FileReader returns something like "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      const result = reader.result;
      const base64Data = result.split(',')[1];
      resolve({
        mimeType: file.type,
        data: base64Data
      });
    };
    reader.onerror = error => reject(error);
  });
}

export async function extraerDatosAlbaran(file) {
  if (!ai) {
    throw new Error('API Key de Gemini no encontrada. Configúrala en el archivo .env de la carpeta app.');
  }

  const base64File = await fileToBase64(file);

  const schema = {
    type: Type.OBJECT,
    properties: {
      proveedor: {
        type: Type.STRING,
        description: "Nombre del proveedor o empresa que emite el albarán"
      },
      tipo: {
        type: Type.STRING,
        description: "Categoría principal de los productos del albarán. Elige UNA de estas opciones basándote en los artículos: 'Alimentación', 'Bebidas', 'Limpieza', 'Menaje', 'Suministros', 'Otros'."
      },
      numero: {
        type: Type.STRING,
        description: "Número de albarán o factura"
      },
      fecha: {
        type: Type.STRING,
        description: "Fecha de emisión del albarán en formato DD/MM/YYYY"
      },
      baseImponible: {
        type: Type.STRING,
        description: "El importe total de la base imponible (subtotal antes de impuestos). Formato número con decimales."
      },
      desgloseIva: {
        type: Type.ARRAY,
        description: "Lista de los diferentes tipos de IVA aplicados. Si no hay IVA, déjalo vacío.",
        items: {
          type: Type.OBJECT,
          properties: {
            porcentaje: { type: Type.STRING, description: "Porcentaje de IVA (ej: '21', '10', '4')" },
            base: { type: Type.STRING, description: "Base imponible a la que se le aplica este porcentaje" },
            cuota: { type: Type.STRING, description: "Importe de la cuota de IVA para este porcentaje" }
          }
        }
      },
      importeTotal: {
        type: Type.STRING,
        description: "Importe total del albarán. Sólo el número con decimales, sin el símbolo del euro."
      },
      lineas: {
        type: Type.ARRAY,
        description: "Lista de todos los productos incluidos en el albarán",
        items: {
          type: Type.OBJECT,
          properties: {
            producto: {
              type: Type.STRING,
              description: "Nombre del producto"
            },
            cantidad: {
              type: Type.NUMBER,
              description: "Cantidad entregada (en unidades, kg, litros, etc.)"
            },
            precioUnitario: {
              type: Type.STRING,
              description: "Precio por unidad del producto. Sólo número."
            },
            importeLinea: {
              type: Type.STRING,
              description: "Importe total de esta línea (cantidad * precio unitario). Sólo número."
            }
          },
          required: ["producto", "cantidad"]
        }
      }
    },
    required: ["proveedor", "tipo", "numero", "fecha", "importeTotal", "lineas"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { text: "Eres un extractor de datos de albaranes. Extrae los datos de esta imagen con precisión. Devuelve ÚNICAMENTE un JSON válido que cumpla estrictamente con el esquema. Si algún dato no se ve claro, déjalo vacío. BAJO NINGÚN CONCEPTO repitas o incluyas cadenas de texto largas (como base64 o datos binarios) en ninguno de los campos, limítate a los datos legibles del documento." },
          { 
            inlineData: {
              mimeType: base64File.mimeType,
              data: base64File.data
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1, // Baja temperatura para mayor precisión y determinismo
      maxOutputTokens: 8192 // Asegurar margen por si las líneas son muchas
    }
  });

  let rawText = response.text;
  // Gemini a veces devuelve el JSON envuelto en markdown (```json ... ```) a pesar del responseMimeType
  rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error("JSON Error parsing Gemini response (Albarán):", err);
    try {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        // Rudimentary trailing comma fix
        let cleanText = rawText.substring(firstBrace, lastBrace + 1).replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(cleanText);
      }
    } catch (fallbackErr) {
      console.error("Fallback JSON Error (Albarán):", fallbackErr);
    }
    throw new Error("La IA generó una respuesta con formato inválido. Por favor, inténtalo de nuevo.");
  }
}

export async function extraerDatosFacturaMensual(file) {
  if (!ai) {
    throw new Error('API Key de Gemini no encontrada. Configúrala en el archivo .env de la carpeta app.');
  }

  const base64File = await fileToBase64(file);

  const schema = {
    type: Type.OBJECT,
    properties: {
      proveedor: {
        type: Type.STRING,
        description: "Nombre de la empresa distribuidora o proveedor emisor de la factura"
      },
      numeroFactura: {
        type: Type.STRING,
        description: "Número oficial de la factura"
      },
      fechaEmision: {
        type: Type.STRING,
        description: "Fecha de la factura en formato DD/MM/YYYY"
      },
      periodoMes: {
        type: Type.STRING,
        description: "Mes o período al que corresponde la factura (ej: 'Agosto 2026')"
      },
      importeFactura: {
        type: Type.STRING,
        description: "Importe total de la factura a pagar. Sólo número con decimales."
      },
      albaranesRelacionados: {
        type: Type.ARRAY,
        description: "Lista de números de albarán o entregas citadas expresamente en el resumen de la factura",
        items: {
          type: Type.STRING
        }
      }
    },
    required: ["proveedor", "numeroFactura", "fechaEmision", "importeFactura"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { text: "Eres un auditor financiero que analiza facturas mensuales globales de proveedores de hostelería. Extrae con precisión el número de factura, el proveedor, el período o fecha, el importe total a pagar y los números de albaranes citados. Devuelve ÚNICAMENTE un JSON válido que cumpla estrictamente con el esquema." },
          { 
            inlineData: {
              mimeType: base64File.mimeType,
              data: base64File.data
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1,
      maxOutputTokens: 4096
    }
  });

  let rawText = response.text;
  rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error("JSON Error parsing Gemini response (Factura Mensual):", err);
    throw new Error("No se pudo leer correctamente la factura mensual. Revisa que la imagen sea nítida.");
  }
}

export async function extraerDatosCarta(file) {
  if (!ai) {
    throw new Error('API Key de Gemini no encontrada. Configúrala en el archivo .env de la carpeta app.');
  }

  const base64File = await fileToBase64(file);

  const schema = {
    type: Type.OBJECT,
    properties: {
      platos: {
        type: Type.ARRAY,
        description: "Lista de platos extraídos de la carta",
        items: {
          type: Type.OBJECT,
          properties: {
            nombre: {
              type: Type.STRING,
              description: "Nombre del plato"
            },
            precioVenta: {
              type: Type.STRING,
              description: "Precio de venta al público (PVP) indicado en la carta. Devuélvelo como texto (ej: '14.50' o '15'). Si no hay precio, devuelve '0'."
            },
            categoria: {
              type: Type.STRING,
              description: "Categoría del plato (ej: 'Entrantes', 'Principales', 'Postres', 'Bebidas'). Dedúcela de la estructura de la carta."
            },
            ingredientes: {
              type: Type.ARRAY,
              description: "Lista de ingredientes principales para este plato. Deduce los ingredientes lógicos según el nombre y tipo de plato. Estima cantidades estándar de hostelería.",
              items: {
                type: Type.OBJECT,
                properties: {
                  nombre: { type: Type.STRING, description: "Nombre del ingrediente genérico, ej: 'Carne de ternera', 'Cebolla', 'Patata'" },
                  cantidad: { type: Type.STRING, description: "Cantidad estimada para una ración estándar (como texto, ej: '0.2' o '1')." },
                  unidadMedida: { type: Type.STRING, description: "Unidad de medida lógica (ej: 'kg', 'litro', 'u'). Dedúcela para el ingrediente." },
                  precioEstimado: { type: Type.STRING, description: "Precio estimado de compra de la materia prima por cada unidad de medida (ej: '5.50' el kilo de patata). Devuélvelo como texto numérico." }
                },
                required: ["nombre", "cantidad", "unidadMedida", "precioEstimado"]
              }
            }
          },
          required: ["nombre", "precioVenta", "categoria", "ingredientes"]
        }
      }
    },
    required: ["platos"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [
      {
        role: 'user',
        parts: [
          { text: "Eres un Chef experto que extrae los platos de la foto de una carta de restaurante. Identifica cada plato y su precio de venta. Además, para cada plato, deduce los ingredientes principales que lo componen y estima una cantidad de ración (gramaje o unidades) estándar de hostelería, junto con su unidad de medida adecuada ('kg', 'litro' o 'u'). Devuelve ÚNICAMENTE un JSON válido que cumpla estrictamente con el esquema." },
          { 
            inlineData: {
              mimeType: base64File.mimeType,
              data: base64File.data
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2, // Un poco más creativo para deducir ingredientes
      maxOutputTokens: 8192
    }
  });

  let rawText = response.text;
  rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error("JSON Error parsing Gemini response (Carta):", err);
    try {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        let cleanText = rawText.substring(firstBrace, lastBrace + 1).replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(cleanText);
      }
    } catch (fallbackErr) {
      console.error("Fallback JSON Error (Carta):", fallbackErr);
    }
    throw new Error("Hubo un error de puntuación al leer la carta. A veces la IA se tropieza con las comillas. ¡Inténtalo de nuevo!");
  }
}

export async function consultarChefBot(mensajeUsuario, historialMensajes, contextoDatos, selectedRestauranteId) {
  if (!ai) throw new Error("Gemini API key no configurada.");
  
  // Importamos Supabase dinámicamente para no romper ciclos si los hubiera
  const { supabase } = await import('./supabaseClient');
  
  const systemInstruction = `
Eres ChefBot, el Director Financiero experto de un restaurante. 
El usuario te hará preguntas sobre el estado de las compras, proveedores y rentabilidad.
Responde de forma concisa, directa, profesional pero con un toque amigable (como un amigo experto). No te enrolles.

Además de finanzas, AHORA TAMBIÉN controlas el módulo de RRPP (Relaciones Públicas). 
Si el usuario te pide buscar medios de comunicación, promocionar el negocio, o buscar teles/periódicos/influencers, DEBES usar tu herramienta (función) 'enviar_exploradores_rrpp' pasándole un término de búsqueda muy optimizado para Google (ej: "revistas gastronomia madrid contacto email").

Basa tus respuestas financieras en estos datos:
--- DATOS DEL RESTAURANTE ---
${JSON.stringify(contextoDatos)}
-----------------------------
`;

  const contents = [
    { role: "user", parts: [{ text: systemInstruction }] },
    { role: "model", parts: [{ text: "Entendido, soy ChefBot. Estoy listo para ayudarte con las finanzas y mandar a los exploradores de RRPP cuando lo pidas." }] }
  ];

  for (const m of historialMensajes) {
    contents.push({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: mensajeUsuario }]
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents,
      config: {
        tools: [{
          functionDeclarations: [
            {
              name: 'enviar_exploradores_rrpp',
              description: 'Añade una orden a la cola de agentes scout para buscar medios de comunicación, revistas, radios, periódicos o tiktokers/influencers.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  termino_busqueda: {
                    type: Type.STRING,
                    description: 'El término exacto a buscar (ej: "radios de madrid contacto email" o "tiktokers comida madrid")'
                  }
                },
                required: ['termino_busqueda']
              }
            },
            {
              name: 'proponer_pitch_rrpp',
              description: 'Redacta un borrador de nota de prensa o propuesta de colaboración para proponer a un medio, revista, radio o influencer.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  nombre_medio: {
                    type: Type.STRING,
                    description: 'Nombre del medio de comunicación o influencer (ej: "Metrópoli (El Mundo)", "Cadena SER", "Foodies Madrid")'
                  },
                  propuesta_pitch: {
                    type: Type.STRING,
                    description: 'El texto del correo o propuesta redactado para el medio.'
                  }
                },
                required: ['nombre_medio', 'propuesta_pitch']
              }
            }
          ]
        }]
      }
    });

    // Revisar si el modelo decidió llamar a alguna herramienta
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      if (call.name === 'enviar_exploradores_rrpp') {
        const termino = call.args.termino_busqueda;
        
        // 1. Investigación inmediata con Gemini AI (Scout en tiempo real sin esperas)
        const scoutPrompt = `
Eres un especialista en RRPP de hostelería y comunicación en España.
El usuario necesita encontrar contactos de medios de comunicación, revistas, periódicos, programas de TV/radio o tiktokers/influencers sobre: "${termino}".

Devuelve una lista JSON de 3 a 5 contactos referentes en España altamente específicos para esa búsqueda.
Para cada uno especifica:
- "nombre": Nombre del medio, programa, revista o creador de contenido (ej: "Cocituber", "Metrópoli (El Mundo)", "7 Caníbales", "Tapas Magazine", "Cadena SER Gastronomía", "Foodies Madrid").
- "contacto": Correo electrónico de contacto o prensa (ej: "contacto@cocituber.com", "metropoli@elmundo.es", "redaccion@7canibales.com").
- "tipo": Debe ser EXACTAMENTE uno de: "Prensa", "TV", "Radio" o "Influencer".
- "alcance": Ej: "Nacional", "Local Madrid", "TikTok / Instagram (500k followers)".
- "enfoque_editorial": Breve descripción del tipo de contenido que publican y por qué encaja.

Devuelve ÚNICAMENTE un array JSON válido sin formato markdown ni texto adicional.
`;

        const scoutSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nombre: { type: Type.STRING },
              contacto: { type: Type.STRING },
              tipo: { type: Type.STRING },
              alcance: { type: Type.STRING },
              enfoque_editorial: { type: Type.STRING }
            },
            required: ["nombre", "contacto", "tipo", "alcance", "enfoque_editorial"]
          }
        };

        let candidatos = [];
        try {
          const scoutRes = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [{ role: 'user', parts: [{ text: scoutPrompt }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: scoutSchema,
              temperature: 0.2
            }
          });
          let cleanText = scoutRes.text.replace(/```json/gi, '').replace(/```/g, '').trim();
          candidatos = JSON.parse(cleanText);
        } catch (e) {
          console.error("Error ejecutando Scout en tiempo real:", e);
        }

        // 2. Inserción inmediata en Supabase en la tabla rrpp_medios
        const mediosInsertados = [];
        const tiposValidos = ['Prensa', 'TV', 'Radio', 'Influencer'];

        for (const item of candidatos) {
          const email = item.contacto ? item.contacto.toLowerCase().trim() : '';
          if (!email || !item.nombre) continue;

          let tipoFinal = item.tipo || 'Prensa';
          if (!tiposValidos.includes(tipoFinal)) tipoFinal = 'Prensa';

          // Evitar duplicados por email
          const { data: existing } = await supabase.from('rrpp_medios').select('id').eq('contacto', email);
          if (existing && existing.length > 0) {
            mediosInsertados.push({ ...item, yaExistia: true });
            continue;
          }

          const nuevoMedio = {
            nombre: item.nombre.substring(0, 100),
            contacto: email,
            tipo: tipoFinal,
            alcance: (item.alcance || 'Digital / Redes').substring(0, 50),
            estado: 'Nuevo',
            enfoque_editorial: item.enfoque_editorial || `Búsqueda: ${termino}`
          };
          if (selectedRestauranteId && selectedRestauranteId !== 'all') {
            nuevoMedio.restaurante_id = selectedRestauranteId;
          }

          const { data: inserted } = await supabase.from('rrpp_medios').insert(nuevoMedio).select();
          if (inserted && inserted[0]) {
            mediosInsertados.push(inserted[0]);
          } else {
            mediosInsertados.push({ ...nuevoMedio, id: `temp-${Date.now()}` });
          }
        }

        // Guardar la orden como completada en auditoría
        await supabase.from('rrpp_ordenes_busqueda').insert({
          termino_busqueda: termino,
          estado: 'Completado'
        });

        return {
          text: `¡Oído cocina! 🚀 He peinado la red y he encontrado e insertado **${mediosInsertados.length} contactos** para: **"${termino}"**.`,
          action: {
            type: 'rrpp_medios_encontrados',
            termino: termino,
            medios: mediosInsertados,
            status: 'completed'
          }
        };
      }

      if (call.name === 'proponer_pitch_rrpp') {
        const { nombre_medio, propuesta_pitch } = call.args;
        return {
          text: `He preparado un borrador de propuesta para **${nombre_medio}**. Puedes revisarlo, editarlo y aprobarlo directamente desde aquí:`,
          action: {
            type: 'propose_pitch_approval',
            medioNombre: nombre_medio,
            pitchText: propuesta_pitch,
            status: 'pending'
          }
        };
      }
    }

    return { text: response.text };
  } catch (error) {
    console.error("Error en ChefBot:", error);
    throw error;
  }
}

export async function parsearRecetaConIA(textoReceta, catalogoIngredientes = []) {
  if (!ai) {
    throw new Error('API Key de Gemini no encontrada.');
  }

  const nombresCatalogo = catalogoIngredientes.map(i => i.nombre).join(', ');

  const schema = {
    type: Type.OBJECT,
    properties: {
      nombrePlato: {
        type: Type.STRING,
        description: "Nombre del plato o receta"
      },
      tiempoPreparacionMinutos: {
        type: Type.NUMBER,
        description: "Tiempo estimado de preparación y cocina en minutos (ej: 15, 20, 30)"
      },
      categoriaSugerida: {
        type: Type.STRING,
        description: "Categoría de carta (ej: 'Entrantes & Raciones', 'Carnes & Parrilla', 'Pescados & Mariscos', 'Pastas & Arroces', 'Postres Caseros', 'Bebidas & Bodega')"
      },
      ingredientes: {
        type: Type.ARRAY,
        description: "Lista de ingredientes parseados de la receta",
        items: {
          type: Type.OBJECT,
          properties: {
            nombreIngrediente: {
              type: Type.STRING,
              description: "Nombre del ingrediente parseado de la receta"
            },
            nombreCatalogoEmparejado: {
              type: Type.STRING,
              description: `Intenta emparejar este ingrediente con uno de los existentes en nuestro catálogo maestro: [${nombresCatalogo}]. Si no existe coincidencia exacta, pon el nombre parseado.`
            },
            cantidad: {
              type: Type.NUMBER,
              description: "Cantidad numérica para una ración estándar (ej: 0.200 para 200 gramos en kg, 1 para unidades, 0.15 para litros)"
            },
            unidadMedida: {
              type: Type.STRING,
              description: "Unidad de medida: 'kg', 'g', 'l', 'ml', 'unidades'"
            }
          },
          required: ["nombreIngrediente", "cantidad", "unidadMedida"]
        }
      }
    },
    required: ["nombrePlato", "tiempoPreparacionMinutos", "ingredientes"]
  };

  const promptText = `
Eres un Chef Director de Cocina experto en escandallos y estandarización de recetas.
Analiza la siguiente receta o descripción en lenguaje natural y extrae sus ingredientes, gramajes/cantidades por ración y el tiempo estimado de preparación en minutos.

TEXTO DE LA RECETA A PARSEAR:
"""
${textoReceta}
"""

CATÁLOGO MAESTRO DE INGREDIENTES DISPONIBLES EN EL RESTAURANTE:
[${nombresCatalogo}]

Instrucciones:
1. Normaliza las cantidades para 1 RACIÓN INDIVIDUAL estándar de restaurante.
2. Si las cantidades vienen en gramos (ej: 200g), conviértelas a kg (0.2) o especifica unidad 'g'/'kg' según convenga.
3. Devuelve ÚNICAMENTE un JSON válido que cumpla estrictamente con el esquema.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: [{ role: 'user', parts: [{ text: promptText }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.1
    }
  });

  let rawText = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(rawText);
}
