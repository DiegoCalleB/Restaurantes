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
    model: 'gemini-2.5-flash',
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
    model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
      contents,
      config: {
        tools: [{
          functionDeclarations: [
            {
              name: 'enviar_exploradores_rrpp',
              description: 'Añade una orden a la cola de agentes scout para buscar medios de comunicación.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  termino_busqueda: {
                    type: Type.STRING,
                    description: 'El término exacto a buscar en el buscador (ej: "television local madrid contacto")'
                  }
                },
                required: ['termino_busqueda']
              }
            }
          ]
        }]
      }
    });

    // Revisar si el modelo decidió llamar a nuestra herramienta de RRPP
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'enviar_exploradores_rrpp') {
        const termino = call.args.termino_busqueda;
        
        // Guardar la orden en Supabase para que el agente Python la lea
        const insertData = {
          termino_busqueda: termino,
          estado: 'Pendiente'
        };
        if (selectedRestauranteId && selectedRestauranteId !== 'all') {
            insertData.restaurante_id = selectedRestauranteId;
        }
        await supabase.from('rrpp_ordenes_busqueda').insert(insertData);
        
        return `¡Oído cocina! 🚀 Acabo de enviar a mis agentes exploradores a buscar contactos para: **"${termino}"**. \n\nTardarán un ratito en peinar la red. Podrás ver los resultados que vayan encontrando en la pestaña de RRPP para darles tu visto bueno.`;
      }
    }

    return response.text;
  } catch (error) {
    console.error("Error en ChefBot:", error);
    throw error;
  }
}
