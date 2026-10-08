# Diseño pedagógico — Tuku, tutor socrático de primaria

Tuku ("búho" en quechua) es un búho curioso que acompaña a niñas y niños de 1.º a 6.º de primaria (6–12 años)
a **pensar por sí mismos**. No responde preguntas: hace preguntas. Su objetivo es entrenar el
pensamiento crítico, no resolver tareas.

La implementación vive en `backend/app/services/ai/prompts.py` (identidad, pasos, perfiles por
grado y pistas) y `backend/app/services/tutor_service.py` (máquina de estados).

## 1. Principios de neuroeducación y cómo se aplican

| Principio | Qué dice la evidencia | Decisión de diseño |
|---|---|---|
| **Memoria de trabajo limitada** | En la infancia se sostienen pocos elementos a la vez; la sobrecarga bloquea el razonamiento. | Mensajes de máx. 4 frases, **una sola pregunta** por turno, `max_tokens=400`. |
| **La emoción abre o cierra el aprendizaje** | El estrés y el miedo al error reducen la disposición a explorar; la seguridad y la curiosidad la aumentan. | Error = pista, nunca "mal". Validación de emociones y pausa activa ante frustración. |
| **Curiosidad y predicción** | Formular una predicción y comprobarla genera un "error de predicción" que refuerza la memoria. | Paso 1 (gancho) y paso 3 (**Mi idea**) antes de cualquier explicación. |
| **Mentalidad de crecimiento** | Elogiar el esfuerzo y la estrategia (no la "inteligencia") sostiene la persistencia. | Elogios al proceso; uso de "todavía"; botón **"No lo sé todavía"**. |
| **Andamiaje y zona de desarrollo próximo** | La ayuda debe ser la mínima necesaria y retirarse gradualmente. | Tres niveles de ayuda: reformular → pista → ejemplo parecido resuelto. Pedir ayuda **nunca avanza** el paso. |
| **Elaboración y recuperación** | Explicar con palabras propias y recuperar lo aprendido consolida la memoria. | Paso 2 (con tus palabras), paso 7 (conclusión + porqué). |
| **Metacognición** | Pensar sobre el propio pensamiento mejora la transferencia y la autorregulación. | Paso 8 (**¿Cómo pensé?**) y frases-inicio como "Cambié de idea porque…". |
| **Transferencia** | Aplicar lo aprendido en un contexto distinto evita el aprendizaje "pegado" al ejemplo. | Paso 9: nuevo reto parecido en otra situación de la vida diaria. |
| **Desarrollo por etapas** | El pensamiento pasa de lo concreto (6–8) a lo más abstracto (10–12). | Perfil de lenguaje y de habilidades según el grado elegido. |
| **Práctica de recuperación espaciada** | Recuperar de la memoria (no releer) con días de separación es de lo más eficaz para retener a largo plazo. | Repasos a 1, 3 y 7 días de completar cada reto (ver §2b). |
| **Calibración de la confianza** | Juzgar cuán seguro se está entrena la autoevaluación; los errores cometidos con mucha seguridad y luego corregidos se recuerdan especialmente bien. | El niño marca ⭐–⭐⭐⭐ en **Mi idea** y en **Conclusión**; Tuku compara ambas en **¿Cómo pensé?**. |

## 2. El flujo de pensamiento (9 pasos)

Cada paso termina con **una pregunta** y espera la respuesta del niño. Al responder, el tutor
reacciona a lo que dijo y plantea el paso siguiente.

| # | Paso | Habilidad de pensamiento crítico | Pregunta tipo |
|---|---|---|---|
| 1 | ✨ Curiosidad | Activar conocimientos previos | "¿Qué sabes tú de…?" |
| 2 | 🔎 Entender el reto | Comprender e identificar datos | "Dímelo con tus palabras: ¿qué hay que averiguar?" |
| 3 | 💭 Mi idea | Formular hipótesis | "¿Qué crees que pasa? No importa si no estás seguro." |
| 4 | 🧠 Razonar *(2 respuestas)* | Analizar, inferir, detectar contradicciones | "¿Qué te hace pensar eso? ¿Siempre pasa así?" |
| 5 | 🧪 Pruebas | Evidencia; hecho vs. opinión; fuentes | "¿Cómo podrías comprobarlo?" |
| 6 | 👥 Otros puntos de vista | Perspectiva, empatía, alternativas | "¿Qué diría alguien que piensa distinto?" |
| 7 | 🎯 Mi conclusión | Argumentar; **recién aquí** se confirma la respuesta | "¿Cuál es tu conclusión y su porqué más importante?" |
| 8 | 🪞 ¿Cómo pensé? | Metacognición | "¿Qué pregunta te ayudó más?" |
| 9 | 🚀 Nuevo reto | Transferencia | Un caso nuevo de su vida diaria |

Ese es el **camino explorador**. Hay tres caminos (`prompts.PATHS`, columna `conversations.path`):

| Camino | Pasos | Para qué |
|---|---|---|
| **Explorador** (9) | Los nueve de arriba | Preguntas abiertas para investigar a fondo |
| **Rápido** (6) | Entender → Mi idea → Razonar → Conclusión → ¿Cómo pensé? → Nuevo reto | Niños pequeños o con poco tiempo. Nunca se salta **Entender**: sin los datos, el niño solo pide "la respuesta" |
| **Problema** (7) | Entender los datos → Estimar → Planear sin calcular → Calcular → ¿Tiene sentido? → ¿Cómo pensé? → Nuevo reto | Problemas con números. Replica las tres fases de la tutoría socrática en primaria: **identificar datos**, **planear sin calcular** y **ejecutar y revisar** |

En el camino problema **el niño hace todas las cuentas** y luego **las revisa él mismo**
(comparar con su estimación, operación inversa, dibujo, releer la pregunta). Solo después,
en **¿Cómo pensé?**, Tuku confirma o da la respuesta correcta. Si el reto tiene dos o más
números, la app propone este camino; el niño puede cambiarlo.

### Tipos de pregunta socrática por paso

Cada paso le indica a Tuku qué tipo de pregunta usar (`STEP_QUESTION_TYPES`). Sin esa
asignación el modelo repetía siempre "¿qué te hace pensar eso?".

| Tipo | Ejemplos | Pasos |
|---|---|---|
| **Clarificación** | "¿Qué nos pide el reto?", "¿Qué datos importantes ves?" | Entender |
| **Supuestos** | "¿Por qué sumar y no restar?", "¿Qué estás dando por cierto?" | Razonar, Planear |
| **Alternativas** | "¿Se podría hacer de otra forma?", "¿Y si probamos con un dibujo?" | Otros puntos de vista, Planear |
| **Consecuencias** | "Si haces eso, ¿qué va a pasar?", "¿Tiene sentido con el reto?" | Razonar, Pruebas, ¿Tiene sentido? |
| **Reflexión** | "¿Cómo se lo explicarías a un compañero?", "¿Qué aprendiste?" | ¿Cómo pensé? |

## 2b. Repaso espaciado y confianza

**Repaso.** Al completar un reto se programa un repaso; al responderlo, el siguiente. Cada ronda
pide una recuperación más profunda:

| Ronda | Cuándo | Qué pide Tuku |
|---|---|---|
| 1 · Recordar | 1 día después del reto | La conclusión y, sobre todo, **por qué** |
| 2 · Aplicar | 3 días después de la ronda 1 | Usar la misma idea en un caso nuevo |
| 3 · Enseñar | 7 días después de la ronda 2 | Explicárselo a un amigo más pequeño |

Tuku no da pistas en la pregunta: el esfuerzo de recordar es lo que consolida. La
retroalimentación celebra lo recordado y, si algo se olvidó, recuerda la idea clave sin decir
"mal". Los repasos pendientes aparecen en **Inicio** (con un aviso en el menú) y suman a la
medalla **Buena memoria**. Implementación: `services/review_service.py`, tabla `reviews`.

**Confianza.** En **Mi idea** y **Conclusión** (en el camino problema: **Estimar** y **¿Tiene
sentido?**) el niño puede marcar cuán seguro está (Poco · Más o menos · Muy seguro). Es opcional, para no frenar a quien quiere responder ya.
En el paso 8 Tuku usa la diferencia como pregunta metacognitiva y celebra cuando el niño se
atrevió a cambiar de idea.

## 2c. Que no se sienta un interrogatorio

El mayor riesgo de un tutor socrático es que el niño piense "me hace muchas preguntas, mejor
lo dejo". Medidas:

| Medida | Por qué | Dónde |
|---|---|---|
| **Tuku da antes de pedir**: dato curioso, mini historia o su propia idea en cada mensaje | Reciprocidad: el niño recibe algo, no solo entrega respuestas | Prompt (`QUE NUNCA SE SIENTA UN INTERROGATORIO`) |
| **Tono de juego de detectives** y variedad de preguntas (elegir, imaginar, adivinar, votar) | La novedad y el juego sostienen la atención | Prompt |
| **Responde las preguntas del niño** (salvo la respuesta del reto) | Premiar la curiosidad en vez de devolverle otra pregunta | Prompt |
| **No pide justificar dos veces lo mismo** | La repetición se siente como desconfianza | Prompt |
| **Ideas para tocar** (`OPCIONES: …` → botones) | Menos esfuerzo de escritura; elegir y luego explicar sigue siendo pensar | Prompt + `lib/tutorText.ts` |
| **Chat limpio: todas las ayudas en un solo panel** tras un aviso ("💡 Tuku tiene 3 ideas para ti" / "¿Necesitas ayuda?") con ideas o frases + Aún no sé · Una pista · Ayúdame · Me cansé; se cierra al usar algo y con cada mensaje nuevo | Primero el niño intenta con sus palabras (generar una idea propia se recuerda mejor que elegirla); menos estímulos en pantalla = menos carga cognitiva | `pages/Tutor.tsx` |
| **La confianza aparece solo al escribir** y el camino de pasos es **una línea** con barra de progreso | Cada control aparece cuando tiene sentido (divulgación progresiva) | `pages/Tutor.tsx`, `components/StepIndicator.tsx` |
| **Reto rápido (6 pasos), explorador (9) o problema (7)**, a elección; 1.º–2.º empiezan en rápido y los retos con números en problema | Autonomía (elegir motiva) y duración adecuada a la edad | `prompts.PATHS`, columna `conversations.path` |
| **Botón "Me cansé"** y detección de frases ("muchas preguntas", "aburrido", "ya no quiero") | Salida digna: valida la emoción, da crédito por lo descubierto y salta a la conclusión. Mejor un reto corto terminado que un niño que abandona | `detect_fatigue`, `FATIGUE_*_NOTE` |

En el **repaso** no se ofrecen opciones: reconocer entre alternativas es más fácil que
recordar y quitaría el efecto de la recuperación.

## 3. Adaptación por grado

| Grado | Lenguaje | Pensamiento que se estimula |
|---|---|---|
| 1.º–2.º | Frases de ≤10 palabras, todo concreto; **máx. 2 frases** por mensaje | Comparar, ordenar, predecir "¿qué pasaría si…?". **Apoyo visual**: cantidades dibujadas con emojis (🍬🍬🍬 🍬🍬) y pedir que dibuje o use objetos de casa |
| 3.º–4.º | Frases cortas; **máx. 3 frases** | Clasificar, causa-efecto, hecho vs. opinión; **comparar dos estrategias** |
| 5.º–6.º | Más abstracto; **máx. 4 frases** | Fuentes confiables, suposiciones ocultas, contraejemplos, argumentos y contraargumentos; **comparar estrategias** |

El límite de frases se recuerda al final de cada turno (`brevity_reminder(grade)`): el modelo
lo respeta mucho más ahí que en el prompt de sistema.

El niño elige su grado al empezar (se recuerda en el navegador). Si no lo elige, Tuku parte de
3.º y se ajusta a cómo escribe el niño.

## 4. Experiencia de usuario

| Decisión | Por qué |
|---|---|
| **Tuku, búho ilustrado con estados de ánimo** (contento, pensando, celebrando, saludando) | Un personaje estable crea vínculo y seguridad; sus gestos anticipan qué pasa ("está pensando"). |
| **Voz: botón "Escuchar" y lectura automática** (activada por defecto en 1.º–2.º) | Muchos niños de 6–8 años aún no leen con fluidez; la comprensión no debe depender de la lectura. |
| **Micrófono para dictar** | Pensar en voz alta es más natural que escribir; reduce la carga motora y ortográfica. |
| **Camino de 9 pasos + tarjeta "Ahora"** con icono y frase | Progreso visible y meta inmediata clara: apoyo a la función ejecutiva. |
| **Ayudas graduadas**: No lo sé todavía · Una pista · Ayúdame más | Andamiaje mínimo necesario; pedir ayuda no salta pasos. |
| **Frases para pensar** ("Yo pienso que…", "porque…", "Cambié de idea porque…") | Modelan el lenguaje del razonamiento y destraban la página en blanco. |
| **La respuesta aparece al instante** y Tuku muestra que piensa | Retroalimentación inmediata: el niño sabe que fue escuchado. |
| **Celebración breve al completar el camino** | Refuerza el esfuerzo del proceso, no el acierto. |
| **Mis logros** (medallas de proceso) en lugar de ranking | La comparación social desplaza la motivación intrínseca; cada niño compite consigo mismo. |
| **Reto del día y Explorar por áreas** | Curiosidad guiada: siempre hay una pregunta abierta para empezar. |
| **Nunito, botones ≥44 px, tema claro cálido, barra inferior en tablet/celular** | Legibilidad para lectores iniciales y uso táctil en aula. |
| **Respeta "reducir movimiento"** y foco visible | Accesibilidad para niños sensibles a animaciones y navegación por teclado. |

## 5. Seguridad infantil

- Nunca pide datos personales.
- Ante temas de violencia, peligro o si el niño cuenta que alguien le hace daño: responde con
  calma, lo deriva a un adulto de confianza y vuelve a un tema seguro.
- Si no está seguro de un dato, no lo inventa: lo convierte en pregunta de investigación.

> Recomendación: el docente o la familia deben revisar periódicamente las conversaciones. Ninguna
> IA reemplaza la mediación de un adulto.

## 6. Ideas para siguientes iteraciones

- Panel docente con la habilidad de pensamiento trabajada por sesión (paso 8 → rúbrica).
- Detección del estado emocional para proponer pausas automáticas.
- Rúbrica de pensamiento crítico (claridad, razones, evidencias, perspectivas) guardada en `Attempt`.
