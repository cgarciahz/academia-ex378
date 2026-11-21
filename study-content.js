// Contenido de Estudio EX378 — Explicado de forma sencilla (como para un niño) + Código de Examen
window.STUDY_MODULES = [
  {
    id: "config",
    number: 1,
    title: "Configuración y Perfiles de Entorno",
    examScore: "25%",
    pdfPages: "Cap. 2 — Págs. 48 a 62",
    videos: "Videos 8.ch02 y 9.ch02s02",
    labFolder: "ejercicios/Configuracion/",
    kidAnalogyTitle: "🎮 Analogía: Los Ajustes de tu Videojuego",
    kidAnalogy: "Imagina que programas un robot de juguete. Si le sueldas con cables fijos que siempre camine a velocidad 5, cada vez que quieras que vaya a velocidad 10 tendrías que abrirlo con un destornillador (recompilar el código Java). En cambio, poner propiedades en 'application.properties' es como ponerle una perilla por fuera: cambias la velocidad sin abrir el robot. Y los perfiles (%dev, %test, %prod) son como tener 3 modos en el robot: 'Modo Habitación' (%dev), 'Modo Pista de Pruebas' (%test) y 'Modo Competencia Real' (%prod).",
    keyAnnotations: [
      { name: "@ConfigProperty(name, defaultValue)", desc: "Saca UNA sola propiedad por su nombre desde application.properties." },
      { name: "@ConfigMapping(prefix = \"...\")", desc: "Agrupa MUCHAS propiedades que empiezan igual dentro de una interfaz limpia." },
      { name: "@WithDefault(\"valor\")", desc: "Se usa dentro de @ConfigMapping para dar un valor por defecto si no existe en application.properties." },
      { name: "@WithName(\"nombre\")", desc: "Se usa dentro de @ConfigMapping cuando el nombre del método Java no coincide con la propiedad." },
      { name: "Optional<T>", desc: "Evita que Quarkus explote al arrancar si una propiedad es opcional y no fue escrita." },
      { name: "ConfigProvider.getConfig()", desc: "Búsqueda manual (Lookup) para cuando estás en un método static donde @Inject no funciona." }
    ],
    codeSnippets: [
      {
        title: "1. application.properties (Perfiles y Expresiones ${VAR:default})",
        code: `# Propiedad normal (usa kebab-case: guiones medios)
gateway.service-name = PaymentGateway
gateway.max-retries = 3

# Expresión: combina otra propiedad y una variable con valor por defecto (:local)
gateway.banner = Welcome to \${gateway.service-name} [\${ENV_MODE:local}]

# Perfiles: cambian el valor automáticamente según cómo arranques Quarkus
%dev.gateway.max-retries = 5
%test.gateway.max-retries = 10`
      },
      {
        title: "2. Forma A: Inyección individual con @ConfigProperty",
        code: `@ApplicationScoped
public class MyService {
    @ConfigProperty(name = "gateway.service-name")
    String serviceName; // Si no existe en properties, ¡Quarkus NO arranca!

    @ConfigProperty(name = "gateway.timeout", defaultValue = "2500")
    int timeout; // Seguro: si no existe, usa 2500

    @ConfigProperty(name = "gateway.optional-token")
    Optional<String> token; // Seguro: si no existe, queda Optional.empty()

    public String obtenerToken() {
        return token.orElse("SIN_TOKEN"); // ¡NUNCA uses token.get() directo!
    }
}`
      },
      {
        title: "3. Forma B: Interfaz agrupada con @ConfigMapping + @Inject",
        code: `@ConfigMapping(prefix = "gateway")
public interface GatewayConfig {
    String serviceName(); // Busca automáticamente "gateway.service-name"

    @WithDefault("false")
    boolean maintenanceMode(); // Busca "gateway.maintenance-mode"

    @WithName("custom-header")
    @WithDefault("X-Api-Key")
    String header(); // Busca "gateway.custom-header"

    Optional<String> debugNote(); // Opcional
}

// ¡OJO! Para usarla en tu servicio se inyecta con @Inject (NO con @ConfigProperty):
@Inject
GatewayConfig config;`
      },
      {
        title: "4. Forma C: Lookup programático (sin @Inject)",
        code: `// Útil en métodos static o clases utilitarias:
String nombre = ConfigProvider.getConfig()
        .getValue("gateway.service-name", String.class);

Optional<Integer> reintentos = ConfigProvider.getConfig()
        .getOptionalValue("gateway.max-retries", Integer.class);`
      }
    ],
    examTraps: [
      "¡Nunca llames a optional.get() sin verificar! Si la propiedad no está configurada, lanza NoSuchElementException. Usa siempre optional.orElse(\"valor\").",
      "Si usas @ConfigMapping(prefix = \"gateway\"), TODAS las propiedades que empiecen con 'gateway.' en application.properties deben tener su método en la interfaz, o Quarkus fallará con error SRCFG00050.",
      "Orden de prioridad (quien manda más): 1º Línea de comandos (-Dprop=val) > 2º Variable de Entorno (GATEWAY_MAX_RETRIES) > 3º Archivo .env > 4º application.properties."
    ]
  },
  {
    id: "rest",
    number: 2,
    title: "RESTEasy Reactive y Jakarta REST",
    examScore: "0%",
    pdfPages: "Cap. 2 (Págs. 63–79) y Cap. 4 (Págs. 170–189)",
    videos: "Videos 10.ch02s03, 11.ch02s04, 24.ch04 y 25.ch04s02",
    labFolder: "ejercicios/Rest-y-OpenAPI/",
    kidAnalogyTitle: "🍕 Analogía: La Ventanilla de Pedidos de una Pizzería",
    kidAnalogy: "Un Resource REST (@Path) es como el mostrador de una pizzería. @GET es pedir ver el menú (no cambia nada en la cocina). @POST es hacer un pedido nuevo (te dan un ticket con el número y ubicación de tu orden: código 201 Created). @PUT es cambiar los ingredientes de un pedido que ya existe. @DELETE es cancelar el pedido. ¿Y qué es RESTEasy Reactive (@NonBlocking vs @Blocking)? Imagina que el cajero que atiende la fila (Event Loop / Hilo I/O) es súper rápido, pero TIENE PROHIBIDO meterse a hornear una pizza lenta (ir a base de datos clásica). Si el método tarda o usa base de datos tradicional, debes poner @Blocking para que se lo pase a un cocinero de atrás (Worker Thread) y no trabe la fila.",
    keyAnnotations: [
      { name: "@Path(\"/ruta\")", desc: "Define la dirección URL donde escucha la clase o el método." },
      { name: "@GET / @POST / @PUT / @DELETE", desc: "Verbos HTTP para Leer, Crear, Actualizar y Borrar." },
      { name: "@Produces / @Consumes", desc: "Indica qué formato devuelve y recibe (casi siempre MediaType.APPLICATION_JSON)." },
      { name: "@PathParam(\"id\")", desc: "Captura una variable que viene dentro de la ruta: /books/{id}." },
      { name: "@QueryParam(\"sortBy\") @DefaultValue(\"id\")", desc: "Captura parámetros después del signo '?': /books?sortBy=title." },
      { name: "Response.created(uri).header(...).build()", desc: "Construye una respuesta HTTP 201 Created con cabeceras Location e id." },
      { name: "NotFoundException", desc: "Excepción estándar que al lanzarla devuelve automáticamente HTTP 404 Not Found." },
      { name: "@Blocking / @NonBlocking", desc: "Controla si el método corre en un Worker Thread (bloqueante) o en el Event Loop (no bloqueante)." }
    ],
    codeSnippets: [
      {
        title: "1. CRUD Completo con Jakarta REST",
        code: `@Path("/speakers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SpeakerResource {

    @GET
    public List<Speaker> list(
            @DefaultValue("id") @QueryParam("sortBy") String sortBy,
            @DefaultValue("0") @QueryParam("pageIndex") int pageIndex,
            @DefaultValue("25") @QueryParam("pageSize") int pageSize) {
        return service.findAll(sortBy, pageIndex, pageSize);
    }

    @GET
    @Path("/{id}")
    public Speaker getById(@PathParam("id") Long id) {
        return service.findById(id)
                .orElseThrow(NotFoundException::new); // Devuelve 404 si no existe
    }

    @POST
    public Response create(Speaker speaker, @Context UriInfo uriInfo) {
        service.create(speaker);
        URI uri = uriInfo.getAbsolutePathBuilder().path("/{id}").build(speaker.id);
        return Response.created(uri)       // Estado 201 + Header "Location"
                .header("id", speaker.id)  // Header extra "id"
                .entity(speaker)           // Cuerpo JSON
                .build();
    }

    @DELETE
    @Path("/{id}")
    public void delete(@PathParam("id") Long id) {
        if (!service.delete(id)) {
            throw new NotFoundException(); // 404 si no existía; si borra, void devuelve 204 No Content
        }
    }
}`
      }
    ],
    examTraps: [
      "¡PROHIBIDO mezclar extensiones clásicas (quarkus-resteasy) con reactivas (quarkus-resteasy-reactive) en el mismo pom.xml! Quarkus fallará al compilar.",
      "Un método void en Jakarta REST devuelve automáticamente 204 No Content cuando termina sin errores.",
      "Si el test del examen espera código 201 en el POST, NO devuelvas el objeto directo (eso da 200 OK); devuelve Response.created(uri).build()."
    ]
  },
  {
    id: "openapi",
    number: 3,
    title: "MicroProfile OpenAPI y Swagger UI",
    examScore: "20%",
    pdfPages: "Cap. 2 — Págs. 66–68, 72–75 y 106–116",
    videos: "Videos 10.ch02s03, 11.ch02s04 y 16.ch02s09",
    labFolder: "ejercicios/Rest-y-OpenAPI/",
    kidAnalogyTitle: "📖 Analogía: El Manual de Instrucciones Ilustrado",
    kidAnalogy: "Imagina que construyes una nave de LEGO increíble (tu API REST), pero se la entregas a otro niño sin caja ni instructivo. No sabrá qué botón presionar. OpenAPI (@Operation, @APIResponse, @Header) son las etiquetas que le pegas a cada botón para que Quarkus escriba solito el manual de instrucciones en '/q/openapi' y una página interactiva para probar los botones en '/q/swagger-ui'.",
    keyAnnotations: [
      { name: "@Operation(summary, description)", desc: "Describe qué hace un método REST en el manual OpenAPI." },
      { name: "@APIResponse(responseCode, description, headers)", desc: "Documenta un código de respuesta HTTP (ej. \"200\", \"201\", \"404\") y sus cabeceras." },
      { name: "@Header(name, description, schema)", desc: "Documenta una cabecera HTTP devuelta dentro de @APIResponse." },
      { name: "@Schema(implementation = Clase.class)", desc: "Define el tipo de dato (ej. Integer.class o String.class) de un @Header o cuerpo." }
    ],
    codeSnippets: [
      {
        title: "1. Propiedades en application.properties",
        code: `# Título, versión y descripción global del documento /q/openapi
quarkus.smallrye-openapi.info-title=Conference Speakers API
quarkus.smallrye-openapi.info-version=1.0.0
quarkus.smallrye-openapi.info-description=API for managing speakers

# Mostrar Swagger UI siempre (incluso fuera de modo dev)
quarkus.swagger-ui.always-include=true`
      },
      {
        title: "2. Documentar un POST con cabeceras en OpenAPI (¡Clásico de Examen!)",
        code: `@POST
@Operation(summary = "Adds a speaker", description = "Registers a new speaker")
@APIResponse(
    responseCode = "201",
    description = "Entity successfully created",
    headers = {
        @Header(
            name = "id",
            description = "ID of the created entity",
            schema = @Schema(implementation = Integer.class)
        ),
        @Header(
            name = "location",
            description = "URI of the created entity",
            schema = @Schema(implementation = String.class)
        )
    }
)
public Response createSpeaker(Speaker newSpeaker, @Context UriInfo uriInfo) { ... }`
      }
    ],
    examTraps: [
      "El script evaluador del examen descarga el JSON de '/q/openapi' y compara texto por texto el 'summary', 'description', 'responseCode' y los nombres de '@Header'. ¡Copia y pega los textos exactos que te pida el enunciado!",
      "Recuerda que en @APIResponse el código va como String entre comillas: responseCode = \"201\"."
    ]
  },
  {
    id: "panache",
    number: 4,
    title: "Persistencia Simplificada con Panache (JPA)",
    examScore: "0%",
    pdfPages: "Cap. 2 (Págs. 80–95, 106–116) y Cap. 4 (Págs. 188–194)",
    videos: "Videos 12.ch02s05, 13.ch02s06, 16.ch02s09, 26.ch04s03 y 27.ch04s04",
    labFolder: "lab-panache-practice/",
    kidAnalogyTitle: "📓 Analogía: El Cuaderno Inteligente que se Guarda Solo",
    kidAnalogy: "En el Java antiguo (JPA tradicional), guardar un dato en la base de datos era como llenar 5 formularios burocráticos (getters, setters, DAOs, EntityManager). Con Panache Active Record ('extends PanacheEntity'), el objeto mismo sabe guardarse: le dices 'libro.persist()' y listo. PERO hay una regla sagrada: para escribir o borrar en el cuaderno necesitas abrir el candado mágico llamado '@Transactional'. Si olvidas '@Transactional', el cuaderno está cerrado con llave y lanza error.",
    keyAnnotations: [
      { name: "extends PanacheEntity", desc: "Patrón Active Record: te regala el campo 'id' autogenerado y métodos estáticos como listAll(), findById(), persist()." },
      { name: "implements PanacheRepository<Entidad>", desc: "Patrón Repository: separa los métodos de base de datos en una clase aparte anotada con @ApplicationScoped." },
      { name: "@Transactional", desc: "¡OBLIGATORIO en cualquier método que haga persist(), delete(), deleteById() o modifique campos de una entidad!" },
      { name: "@OneToMany(mappedBy, cascade = CascadeType.ALL)", desc: "Relación Padre -> Hijos. CascadeType.ALL guarda los hijos automáticamente al guardar al padre." },
      { name: "@JsonIgnore / @JsonbTransient", desc: "Se pone en el lado @ManyToOne (hijo -> padre) para evitar un bucle infinito al convertir a JSON." }
    ],
    codeSnippets: [
      {
        title: "1. Entidad Active Record + Relación sin Bucle Infinito",
        code: `@Entity
public class Speaker extends PanacheEntity { // ¡NO declares 'Long id', PanacheEntity ya lo tiene!
    public String name; // Campos públicos (Panache genera getters/setters en compilación)
    public String organization;

    @OneToMany(mappedBy = "speaker", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    public List<Talk> talks = new ArrayList<>();
}

@Entity
public class Talk extends PanacheEntity {
    public String title;
    public int duration;

    @ManyToOne
    @JoinColumn(name = "speaker_id")
    @JsonIgnore // ¡VITAL con Jackson! (o @JsonbTransient con JSON-B) Corta el ciclo infinito
    public Speaker speaker;
}`
      },
      {
        title: "2. Consultas, Ordenamiento, Paginación y Escritura (@Transactional)",
        code: `// 1. Listar paginado y ordenado:
List<Speaker> pagina = Speaker.findAll(Sort.by("name"))
        .page(Page.of(pageIndex, pageSize)) // o .page(pageIndex, pageSize)
        .list();

// 2. Buscar por condición con parámetros posicionales (?1, ?2):
List<Speaker> redhatters = Speaker.list("organization = ?1", "Red Hat");

// 3. Crear (¡Siempre con @Transactional!):
@POST
@Transactional
public void create(Speaker s) {
    s.persist();
}

// 4. Actualizar una entidad existente (¡Siempre con @Transactional!):
@PUT
@Path("/{id}")
@Transactional
public Speaker update(@PathParam("id") Long id, Speaker datosNuevos) {
    Speaker entity = Speaker.<Speaker>findByIdOptional(id)
            .orElseThrow(NotFoundException::new);
    entity.name = datosNuevos.name; // Hibernate guarda el cambio solo al cerrar @Transactional
    return entity;
}`
      }
    ],
    examTraps: [
      "Si extiendes de PanacheEntity y declaras tú mismo 'public Long id;', chocarás con el id de Panache y fallará.",
      "Olvidar @Transactional en POST, PUT o DELETE lanza TransactionRequiredException (HTTP 500) y te deja el objetivo en 0%.",
      "Olvidar @JsonIgnore (Jackson) o @JsonbTransient (JSON-B) en la entidad hija con @ManyToOne provoca StackOverflowError al devolver la entidad en un GET."
    ]
  },
  {
    id: "restclient",
    number: 5,
    title: "REST Client Reactive",
    examScore: "0%",
    pdfPages: "Cap. 2 (Págs. 65–66, 76–79) y Cap. 4 (Págs. 176–184)",
    videos: "Videos 10.ch02s03, 11.ch02s04, 24.ch04 y 25.ch04s02",
    labFolder: "ejercicios/Rest-y-OpenAPI/video11-develop-rest/",
    kidAnalogyTitle: "📞 Analogía: El Walkie-Talkie con Marcación Rápida",
    kidAnalogy: "Cuando tu microservicio 'Parques' necesita preguntarle el clima al microservicio 'Clima', no necesitas programar antenas ni cables de red. Solo dibujas los botones del walkie-talkie en una interfaz Java ('interface WeatherClient'), le pegas la etiqueta '@RegisterRestClient(configKey = \"weather-api\")' y en application.properties anotas a qué número debe llamar ('quarkus.rest-client.weather-api.url=http://localhost:8081'). Quarkus construye el walkie-talkie real por ti.",
    keyAnnotations: [
      { name: "@RegisterRestClient(configKey = \"...\")", desc: "Se pone sobre la interfaz para que Quarkus genere el cliente HTTP y lea su URL usando ese configKey." },
      { name: "@RestClient", desc: "Se usa junto con @Inject para inyectar la interfaz del cliente REST en tu servicio o resource." },
      { name: "Uni<T>", desc: "Tipo de retorno de Mutiny cuando quieres que la llamada del cliente REST sea asíncrona / no bloqueante." }
    ],
    codeSnippets: [
      {
        title: "1. Definir la Interfaz del Cliente REST",
        code: `@Path("/warnings")
@RegisterRestClient(configKey = "weather-service")
public interface WeatherServiceClient {

    // Llamada síncrona (bloqueante):
    @GET
    @Path("/{city}")
    List<WeatherWarning> getWarningsByCity(@PathParam("city") String city);

    // Llamada reactiva asíncrona (no bloqueante con Mutiny):
    @GET
    @Path("/{city}")
    Uni<List<WeatherWarning>> getWarningsByCityAsync(@PathParam("city") String city);
}`
      },
      {
        title: "2. Inyectar el Cliente y Configurar su URL",
        code: `// En tu clase Java (Resource o Service):
@Inject
@RestClient
WeatherServiceClient weatherClient;

// En application.properties:
quarkus.rest-client.weather-service.url=http://localhost:8082`
      }
    ],
    examTraps: [
      "Si olvidas poner @RestClient en el punto de inyección (@Inject @RestClient), CDI no encontrará el bean y fallará al arrancar.",
      "El nombre en 'quarkus.rest-client.<configKey>.url' debe coincidir EXACTAMENTE con el configKey puesto en @RegisterRestClient(configKey = \"...\")."
    ]
  },
  {
    id: "faulttolerance",
    number: 6,
    title: "MicroProfile Fault Tolerance (Resiliencia)",
    examScore: "0%",
    pdfPages: "Cap. 7 — Págs. 298 a 309 y 322 a 328",
    videos: "Videos 42.ch07, 43.ch07s02 y 46.ch07s05",
    labFolder: "RepositorioOficial/DO378-apps/tolerance-review/",
    kidAnalogyTitle: "🛡️ Analogía: Los 4 Superpoderes contra Accidentes",
    kidAnalogy: "Cuando llamas por teléfono a un amigo (otro microservicio), pueden pasar cosas malas. Quarkus te da 4 escudos:\n1. @Timeout: 'Si no me contesta en 2 segundos, cuelgo para no quedarme esperando toda la tarde'.\n2. @Retry: 'Si la llamada se corta, vuelvo a marcar hasta 3 veces'.\n3. @CircuitBreaker: 'Si ya intenté llamarlo 4 veces y la mitad falló, su teléfono está roto; dejo de marcarle por 5 segundos (circuito abierto) para no gastar batería'.\n4. @Fallback: 'Si todo lo anterior falla, aplico el Plan B (un método de respaldo que devuelve una respuesta por defecto)'.",
    keyAnnotations: [
      { name: "@Retry(maxRetries, delay, retryOn)", desc: "Reintenta ejecutar el método si lanza excepción." },
      { name: "@Timeout(value)", desc: "Cancela la ejecución y lanza TimeoutException si tarda más de X milisegundos." },
      { name: "@CircuitBreaker(requestVolumeThreshold, failureRatio, delay, successThreshold)", desc: "Abre el circuito (falla rápido con CircuitBreakerOpenException) cuando el porcentaje de fallos supera failureRatio en la ventana de peticiones." },
      { name: "@Fallback(fallbackMethod = \"nombreMetodo\")", desc: "Ejecuta un método alternativo cuando el método principal falla por cualquier excepción, timeout o circuito abierto." }
    ],
    codeSnippets: [
      {
        title: "Combinación de @Timeout, @Retry, @CircuitBreaker y @Fallback",
        code: `@GET
@Path("/{id}/sessions")
@Timeout(1000) // Falla si tarda más de 1000 ms (1 segundo)
@Retry(maxRetries = 3, delay = 200) // Reintenta hasta 3 veces esperando 200 ms
@CircuitBreaker(
    requestVolumeThreshold = 4, // Evalúa las últimas 4 llamadas
    failureRatio = 0.5,         // Si 50% (2 de 4) fallan, ABRE el circuito
    delay = 5000,               // Espera 5000 ms antes de probar de nuevo (half-open)
    successThreshold = 2        // Necesita 2 éxitos seguidos para CERRAR el circuito
)
@Fallback(fallbackMethod = "fallbackSessions")
public List<Session> getSessions(@PathParam("id") Long speakerId) {
    return sessionClient.getBySpeaker(speakerId);
}

// ¡REGLA DE ORO!: El método fallback DEBE tener EXACTAMENTE el mismo tipo
// de retorno y los mismos parámetros que el método original:
public List<Session> fallbackSessions(Long speakerId) {
    return Collections.emptyList();
}`
      }
    ],
    examTraps: [
      "El método indicado en fallbackMethod DEBE tener exactamente la misma firma (mismo tipo de retorno y mismos argumentos en el mismo orden) que el método anotado con @Fallback. Si el original devuelve Uni<List<T>>, el fallback también debe devolver Uni<List<T>>.",
      "En @CircuitBreaker, 'failureRatio' va entre 0.0 y 1.0 (ej. 50% es 0.5, ¡no pongas 50!)."
    ]
  },
  {
    id: "health",
    number: 7,
    title: "MicroProfile Health Check (Sondas de Salud)",
    examScore: "0%",
    pdfPages: "Cap. 7 — Págs. 310 a 328",
    videos: "Videos 44.ch07s03, 45.ch07s04 y 46.ch07s05",
    labFolder: "RepositorioOficial/DO378-apps/tolerance-health/",
    kidAnalogyTitle: "🩺 Analogía: El Chequeo Médico del Restaurante",
    kidAnalogy: "Kubernetes/OpenShift es como el gerente de un centro comercial que vigila tu restaurante (tu microservicio) haciéndole 3 preguntas:\n1. @Startup (/q/health/started): '¿Ya terminaste de abrir las cortinas por primera vez?'\n2. @Liveness (/q/health/live): '¿Sigues vivo y respirando?' (Si dices DOWN, Kubernetes mata el contenedor y lo reinicia desde cero).\n3. @Readiness (/q/health/ready): '¿Estás listo para atender clientes ahora mismo o estás esperando que conecte la base de datos?' (Si dices DOWN, no te mata, pero deja de mandarte clientes hasta que digas UP).",
    keyAnnotations: [
      { name: "@Liveness", desc: "Registra una sonda de vida expuesta en /q/health/live." },
      { name: "@Readiness", desc: "Registra una sonda de disponibilidad expuesta en /q/health/ready." },
      { name: "@Startup", desc: "Registra una sonda de arranque expuesta en /q/health/started." },
      { name: "implements HealthCheck", desc: "Interfaz obligatoria cuyo único método es 'public HealthCheckResponse call()'." },
      { name: "HealthCheckResponse", desc: "Builder para responder UP o DOWN con nombre y datos extra (.withData(k, v))." }
    ],
    codeSnippets: [
      {
        title: "Implementación completa de @Liveness y @Readiness",
        code: `@Liveness
@ApplicationScoped
public class SimpleLivenessCheck implements HealthCheck {
    @Override
    public HealthCheckResponse call() {
        // Forma rápida cuando no piden datos extra:
        return HealthCheckResponse.up("Simple liveness check");
    }
}

@Readiness
@ApplicationScoped
public class DatabaseReadinessCheck implements HealthCheck {
    @Override
    public HealthCheckResponse call() {
        boolean dbOk = checkDatabase();
        // Forma completa con .withData() y .up() / .down():
        HealthCheckResponseBuilder builder = HealthCheckResponse
                .named("Database connection health check")
                .withData("database", "PostgreSQL");

        return dbOk ? builder.up().build() : builder.down().build();
    }
}`
      }
    ],
    examTraps: [
      "Nunca olvides poner @ApplicationScoped junto a @Liveness o @Readiness en tu clase que implementa HealthCheck.",
      "Verifica letra por letra el nombre que pide el examen en HealthCheckResponse.named(\"...\") y las llaves de .withData(\"clave\", \"valor\")."
    ]
  },
  {
    id: "metrics",
    number: 8,
    title: "Micrometer Metrics (Métricas de Aplicación)",
    examScore: "0%",
    pdfPages: "Cap. 8 — Págs. 344 a 354 y 366 a 372",
    videos: "Videos 49.ch08s03, 50.ch08s04 y 53.ch08s07",
    labFolder: "RepositorioOficial/DO378-apps/monitor-metrics/",
    kidAnalogyTitle: "⏱️ Analogía: El Tablero del Auto (Odómetro, Cronómetro y Termómetro)",
    kidAnalogy: "Con Micrometer le pones 3 instrumentos de medición a tu aplicación (que se ven en '/q/metrics'):\n1. Counter (Odómetro / Contador de visitas): Solo sube (+1, +1, +1). Cuenta cuántas veces llamaron a un método.\n2. Timer (Cronómetro): Mide cuánto tiempo tardó en ejecutarse un método y cuántas veces se ejecutó.\n3. Gauge (Termómetro / Nivel de gasolina): Mide un valor que puede subir y bajar en cualquier momento (ej. cuántos usuarios hay conectados ahora o cuál fue la última temperatura registrada).",
    keyAnnotations: [
      { name: "@Inject MeterRegistry registry", desc: "El registro central de Micrometer para crear contadores, timers y gauges por código." },
      { name: "@Counted(value = \"...\")", desc: "Anotación rápida para contar cuántas veces se invoca un método." },
      { name: "@Timed(value = \"...\")", desc: "Anotación rápida para medir el tiempo de ejecución de un método." },
      { name: "registry.counter(\"nombre\").increment()", desc: "Incrementa en +1 un contador programático." },
      { name: "registry.timer(\"nombre\").wrap(supplier).get()", desc: "Envuelve y cronometra la ejecución de una función." },
      { name: "registry.gauge(\"nombre\", Tags, obj, Clase::metodo)", desc: "Registra un medidor de estado actual (se suele registrar en el constructor o @PostConstruct)." }
    ],
    codeSnippets: [
      {
        title: "1. Métricas Programáticas con MeterRegistry (¡El patrón más pedido!)",
        code: `@Path("/parks")
@ApplicationScoped
public class ParksResource {

    @Inject
    MeterRegistry registry;

    @PostConstruct
    void initMetrics() {
        // GAUGE: observa el valor devuelto por this.getLastWarningCount()
        registry.gauge("weather.warnings.gauge", Tags.empty(), this, ParksResource::getLastWarningCount);
    }

    @GET
    public List<Park> listParks() {
        // COUNTER: incrementa en 1 cada vez que llaman a listParks()
        registry.counter("parks.list.counter", Tags.of("env", "prod")).increment();

        // TIMER: mide cuánto tarda Park.listAll() y devuelve su resultado
        return registry.timer("parks.list.timer")
                .wrap((Supplier<List<Park>>) () -> Park.listAll())
                .get();
    }

    public int getLastWarningCount() { return 5; }
}`
      },
      {
        title: "2. Métricas Declarativas con @Counted y @Timed",
        code: `@GET
@Path("/ custom")
@Counted(value = "expenses.get.counter", description = "Count of GET calls")
@Timed(value = "expenses.get.timer", description = "Time taken by GET calls")
public List<Expense> getAll() {
    return service.list();
}`
      }
    ],
    examTraps: [
      "Cuando consultas '/q/metrics' en formato Prometheus, Micrometer transforma los puntos '.' en guiones bajos '_' y agrega '_total' a los contadores (ej. 'parks.list.counter' aparece como 'parks_list_counter_total'). ¡Pero en tu código Java debes escribir el nombre con puntos exactamente como te lo pida el examen!",
      "En registry.timer(\"...\").wrap(...), no olvides llamar a .get() al final (si es un Supplier) o .run() (si es un Runnable), o el código dentro del wrap ¡nunca se ejecutará!"
    ]
  },
  {
    id: "otel",
    number: 9,
    title: "OpenTelemetry (OTel) Distributed Tracing",
    examScore: "25%",
    pdfPages: "Cap. 8 — Págs. 355 a 372",
    videos: "Videos 51.ch08s05, 52.ch08s06 y 53.ch08s07",
    labFolder: "RepositorioOficial/DO378-apps/monitor-trace/",
    kidAnalogyTitle: "📦 Analogía: El Número de Rastreo de un Paquete de Envío",
    kidAnalogy: "Cuando compras algo por internet, el paquete pasa por la bodega, el camión, el avión y el repartidor. Para saber en cuál de todos se atoró, le pegan un código de barras único ('traceId') y cada parada registra su propio sello ('spanId'). Con la extensión 'quarkus-opentelemetry', Quarkus le pega ese código automáticamente a todas las peticiones REST y llamadas REST Client. Y si quieres rastrear también un método interno tuyo que no es REST, le pones la etiqueta '@WithSpan'.",
    keyAnnotations: [
      { name: "@WithSpan(\"nombre-opcional\")", desc: "Crea un nuevo Span hijo para rastrear cuánto tarda un método CDI interno." },
      { name: "@SpanAttribute(\"nombre.atributo\")", desc: "Se pone en el parámetro de un método con @WithSpan para guardar el valor de ese parámetro dentro de la traza en Jaeger." },
      { name: "quarkus.otel.service.name", desc: "Nombre con el que aparece tu microservicio en Jaeger." },
      { name: "quarkus.otel.exporter.otlp.traces.endpoint", desc: "URL del colector OTLP / Jaeger donde se envían las trazas (ej. http://localhost:4317)." }
    ],
    codeSnippets: [
      {
        title: "1. Configuración de OpenTelemetry y Logs en application.properties",
        code: `# Nombre del servicio en las trazas
quarkus.otel.service.name=sessions-service

# Endpoint donde escucha Jaeger / OTLP Collector
quarkus.otel.exporter.otlp.traces.endpoint=http://localhost:4317

# Formato de log para imprimir traceId, spanId y sampled en consola:
quarkus.log.console.format=%d{HH:mm:ss} %-5p traceId=%X{traceId}, parentId=%X{parentId}, spanId=%X{spanId}, sampled=%X{sampled} [%c{2.}] (%t) %s%e%n`
      },
      {
        title: "2. Crear un Span personalizado con @WithSpan y @SpanAttribute",
        code: `import io.opentelemetry.instrumentation.annotations.WithSpan;
import io.opentelemetry.instrumentation.annotations.SpanAttribute;

@ApplicationScoped
public class ConferenceService {

    @WithSpan(" enrich-session-span")
    public Session enrichSession(@SpanAttribute("session.id") String sessionId) {
        // Este método aparecerá como un bloque propio dentro de la traza en Jaeger
        return findSession(sessionId);
    }
}`
      }
    ],
    examTraps: [
      "En Quarkus 3.8 se usa la extensión 'quarkus-opentelemetry' (NO uses la antigua 'quarkus-smallrye-opentracing' de Quarkus 2).",
      "En el formato de log de consola, las variables MDC de trazas van con %X mayúscula: %X{traceId}, %X{spanId}, %X{parentId}, %X{sampled}."
    ]
  },
  {
    id: "jwt",
    number: 10,
    title: "Seguridad MicroProfile JWT RBAC y CORS",
    examScore: "25%",
    pdfPages: "Cap. 5 — Págs. 221 a 242 y 253 a 258",
    videos: "Videos 31.ch05, 32.ch05s03, 33.ch05s04 y 36.ch05s07",
    labFolder: "RepositorioOficial/DO378-apps/secure-review/",
    kidAnalogyTitle: "🎟️ Analogía: La Pulsera VIP del Parque de Diversiones",
    kidAnalogy: "Un token JWT es como una pulsera VIP firmada con tinta invisible (llave privada 'privateKey.pem') en la taquilla de entrada. Dentro de la pulsera dice tu nombre ('upn'), quién te la dio ('issuer') y qué juegos puedes usar ('groups': Admin, Ranger). Cuando llegas a una montaña rusa ('@RolesAllowed(\"Admin\")'), el guardia revisa con una lámpara de luz ultravioleta (llave pública 'publicKey.pem') que la pulsera no sea falsa y que tenga escrito el grupo 'Admin'.",
    keyAnnotations: [
      { name: "@RolesAllowed({\"Admin\", \"User\"})", desc: "Solo permite ejecutar el método si el JWT tiene al menos uno de esos roles en su claim 'groups'." },
      { name: "@PermitAll / @DenyAll", desc: "Permite el acceso a todos (incluso sin token) o bloquea el acceso a todos." },
      { name: "@Inject JsonWebToken jwt", desc: "Inyecta el token JWT del usuario actual para leer su nombre, grupos o claims." },
      { name: "Jwt.issuer(...).upn(...).groups(...).sign()", desc: "Builder de SmallRye para crear y firmar un nuevo token JWT." }
    ],
    codeSnippets: [
      {
        title: "1. Propiedades de Verificación y Firma en application.properties",
        code: `# Para VERIFICAR tokens recibidos (extensión: quarkus-smallrye-jwt):
mp.jwt.verify.issuer=https://example.com/issuer
mp.jwt.verify.publickey.location=publicKey.pem

# Para CREAR/FIRMAR tokens nuevos (extensión: quarkus-smallrye-jwt-build):
smallrye.jwt.sign.key.location=privateKey.pem

# Habilitar CORS si una web en otro puerto llama a tu API:
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:8080`
      },
      {
        title: "2. Generar un Token JWT y Proteger un Endpoint con @RolesAllowed",
        code: `// A. Generar y firmar un JWT:
String token = Jwt.issuer("https://example.com/issuer")
        .upn("carlos@redhat.com")
        .groups(new HashSet<>(Arrays.asList("Admin", "Subscriber")))
        .claim("department", "Engineering")
        .expiresIn(Duration.ofHours(1))
        .sign();

// B. Proteger endpoint REST con RBAC:
@PUT
@Path("/parks")
@RolesAllowed("Admin") // Devuelve 401 si no hay token, o 403 Forbidden si no tiene el grupo "Admin"
@Transactional
public void updatePark(Park park) { ... }`
      }
    ],
    examTraps: [
      "No confundas las dos llaves: para FIRMAR (crear token) se usa la llave PRIVADA ('smallrye.jwt.sign.key.location=privateKey.pem'). Para VERIFICAR (proteger endpoints) se usa la llave PÚBLICA ('mp.jwt.verify.publickey.location=publicKey.pem').",
      "El método .groups(...) de Jwt builder asigna el claim 'groups' que es el que lee @RolesAllowed. ¡Respeta mayúsculas y minúsculas en el nombre del rol (ej. \"Admin\" vs \"admin\")!"
    ]
  },
  {
    id: "messaging",
    number: 11,
    title: "Reactive Messaging con Apache Kafka",
    examScore: "33%",
    pdfPages: "Cap. 4 — Págs. 195 a 218",
    videos: "Videos 28.ch04s05, 29.ch04s06 y 30.ch04s07",
    labFolder: "RepositorioOficial/DO378-apps/reactive-review/",
    kidAnalogyTitle: "📬 Analogía: El Tren de Tubos Neumáticos de Mensajes",
    kidAnalogy: "En vez de que un microservicio llame a otro por teléfono y se quede esperando, mete una cápsula con un mensaje en un tubo ('@Channel' + 'Emitter.send()'). Ese tubo ('canal') se conecta en application.properties a una estación de tren llamada 'Topic de Kafka'. Otro microservicio pone una canasta receptora ('@Incoming(\"nombre-canal\")') y cada vez que cae una cápsula, la abre y la procesa automáticamente.",
    keyAnnotations: [
      { name: "@Channel(\"canal-salida\") Emitter<T>", desc: "Permite enviar mensajes a un canal reactivo desde código imperativo (como un POST REST)." },
      { name: "@Incoming(\"canal-entrada\")", desc: "Método que escucha y consume cada mensaje que llega al canal." },
      { name: "@Outgoing(\"canal-salida\")", desc: "Método que produce o reenvía el valor retornado hacia un canal de salida." },
      { name: "@Blocking + @Transactional", desc: "¡CRÍTICO! Si tu consumidor @Incoming guarda datos en BD con Panache clásico, necesita AMBAS anotaciones." },
      { name: "ObjectMapperSerializer / ObjectMapperDeserializer<T>", desc: "Convierten tus objetos Java a JSON al enviarlos a Kafka y viceversa al recibirlos." }
    ],
    codeSnippets: [
      {
        title: "1. Enviar con Emitter, Procesar con @Incoming y Deserializar JSON",
        code: `// A. Enviar desde un recurso o servicio:
@Inject
@Channel("warnings-out")
Emitter<WeatherWarning> emitter;

public void emitirAlerta(WeatherWarning w) {
    emitter.send(w);
}

// B. Consumir desde Kafka y guardar en Base de Datos con Panache:
@ApplicationScoped
public class WarningsProcessor {

    @Incoming("warnings-in")
    @Blocking      // ¡Indispensable porque Panache clásico bloquea el hilo!
    @Transactional // ¡Indispensable para hacer persist() en la BD!
    public void processWarning(WeatherWarning warning) {
        Park.updateStatusByCity(warning.city, "CLOSED");
    }
}

// C. Clase Deserializadora (5 líneas que debes saber de memoria):
public class WeatherWarningDeserializer extends ObjectMapperDeserializer<WeatherWarning> {
    public WeatherWarningDeserializer() {
        super(WeatherWarning.class);
    }
}`
      },
      {
        title: "2. Configurar Canales de Kafka en application.properties",
        code: `# Canal de SALIDA (outgoing):
mp.messaging.outgoing.warnings-out.connector=smallrye-kafka
mp.messaging.outgoing.warnings-out.topic=weather-warnings
mp.messaging.outgoing.warnings-out.value.serializer=io.quarkus.kafka.client.serialization.ObjectMapperSerializer

# Canal de ENTRADA (incoming):
mp.messaging.incoming.warnings-in.connector=smallrye-kafka
mp.messaging.incoming.warnings-in.topic=weather-warnings
mp.messaging.incoming.warnings-in.auto.offset.reset=earliest
mp.messaging.incoming.warnings-in.value.deserializer=com.redhat.smartcity.WeatherWarningDeserializer`
      }
    ],
    examTraps: [
      "¡El error #1 en el examen con Kafka!: Tener un método @Incoming que llama a Panache (ej. Park.persist() o Park.find()) y olvidar ponerle @Blocking y @Transactional. Sin @Blocking falla con BlockingNotAllowedException; sin @Transactional falla con TransactionRequiredException.",
      "No confundas el nombre del CANAL (el que pones en @Incoming(\"mi-canal\")) con el nombre del TOPIC de Kafka (mp.messaging.incoming.mi-canal.topic=nombre-topic). Si omites '.topic', Quarkus usa el nombre del canal como topic."
    ]
  }
];
