// ============================================================================
// DICCIONARIO MAESTRO DE ANOTACIONES Y SINTAXIS EX378 (66 Tarjetas de Memoria)
// Incluye: Sintaxis exacta, Dónde se coloca, Cuándo usarla, Atributos, Trampas y Ejemplo
// ============================================================================
window.ANNOTATION_DICTIONARY = [
  // --- TEMA 1: CONFIGURACIÓN (config) ---
  {
    module: "config",
    annotation: "@ConfigProperty(name = \"prop.key\", defaultValue = \"val\")",
    targetPlace: "Sobre un campo o parámetro de constructor/método",
    whenToUse: "Cuando necesitas inyectar UNA propiedad individual desde application.properties, variables de entorno o línea de comandos.",
    attributes: "name (obligatorio si el nombre del campo no coincide), defaultValue (siempre String entre comillas)",
    trapOrVs: "NO confundir con @WithDefault (que solo sirve dentro de interfaces @ConfigMapping) ni con @DefaultValue (que es para @QueryParam en REST).",
    example: `@ConfigProperty(name = "gateway.timeout", defaultValue = "2500")\nint timeout;`,
    distractors: [
      "@ConfigProperty(value = \"prop.key\", default = \"val\")",
      "@WithName(\"prop.key\") @WithDefault(\"val\")",
      "@ConfigMapping(prefix = \"prop.key\", defaultValue = \"val\")"
    ]
  },
  {
    module: "config",
    annotation: "@ConfigProperty(name = \"prop.optional\") Optional<String>",
    targetPlace: "Sobre un campo de tipo Optional<T>",
    whenToUse: "Cuando una propiedad PUEDE NO EXISTIR en application.properties y no tiene defaultValue, evitando que Quarkus falle al arrancar.",
    attributes: "name = \"clave.propiedad\"",
    trapOrVs: "Al leer el valor usa siempre optional.orElse(\"defecto\"), NUNCA optional.get() directo porque lanza NoSuchElementException.",
    example: `@ConfigProperty(name = "billing.custom-note")\nOptional<String> note;`,
    distractors: [
      "@OptionalConfigProperty(name = \"prop.optional\") String",
      "@ConfigProperty(name = \"prop.optional\", optional = true) String",
      "@Nullable @ConfigProperty(\"prop.optional\") String"
    ]
  },
  {
    module: "config",
    annotation: "@ConfigMapping(prefix = \"mi-prefijo\")",
    targetPlace: "Sobre una INTERFAZ Java",
    whenToUse: "Cuando quieres agrupar múltiples propiedades relacionadas que comparten el mismo prefijo (ej. billing.*) en una interfaz tipada.",
    attributes: "prefix = \"prefijo\" (sin punto al final), namingStrategy (opcional)",
    trapOrVs: "La interfaz se inyecta con @Inject (NUNCA con @ConfigProperty). Además, TODAS las propiedades en application.properties bajo ese prefijo deben estar mapeadas en la interfaz.",
    example: `@ConfigMapping(prefix = "billing")\npublic interface BillingConfig {\n    String companyName(); // lee billing.company-name\n}`,
    distractors: [
      "@ConfigProperties(prefix = \"mi-prefijo\")",
      "@ConfigProperty(prefix = \"mi-prefijo\")",
      "@RegisterConfig(prefix = \"mi-prefijo\")"
    ]
  },
  {
    module: "config",
    annotation: "@WithDefault(\"valor\")",
    targetPlace: "Sobre un método dentro de una interfaz @ConfigMapping",
    whenToUse: "Cuando defines un método dentro de una interfaz @ConfigMapping y quieres darle un valor por defecto si la propiedad no está en application.properties.",
    attributes: "value (String con el valor por defecto)",
    trapOrVs: "Solo funciona dentro de @ConfigMapping. En clases normales con @ConfigProperty se usa el atributo defaultValue = \"...\".",
    example: `@ConfigMapping(prefix = "billing")\npublic interface BillingConfig {\n    @WithDefault("USD")\n    String currency();\n}`,
    distractors: [
      "@DefaultValue(\"valor\")",
      "@ConfigProperty(defaultValue = \"valor\")",
      "@Default(\"valor\")"
    ]
  },
  {
    module: "config",
    annotation: "@WithName(\"nombre-exacto\")",
    targetPlace: "Sobre un método dentro de una interfaz @ConfigMapping",
    whenToUse: "Cuando el nombre del método en tu interfaz @ConfigMapping NO coincide con el nombre kebab-case de la propiedad en application.properties.",
    attributes: "value (nombre de la subpropiedad sin el prefijo)",
    trapOrVs: "No incluyas el prefijo otra vez dentro de @WithName; si el prefijo es 'billing' y pones @WithName(\"tax\"), buscará 'billing.tax'.",
    example: `@ConfigMapping(prefix = "billing")\npublic interface BillingConfig {\n    @WithName("tax-rate")\n    double rate();\n}`,
    distractors: [
      "@Named(\"nombre-exacto\")",
      "@PropertyName(\"nombre-exacto\")",
      "@ConfigProperty(name = \"nombre-exacto\")"
    ]
  },
  {
    module: "config",
    annotation: "@WithParentName",
    targetPlace: "Sobre un método dentro de una interfaz @ConfigMapping",
    whenToUse: "Cuando quieres que el método de la interfaz @ConfigMapping lea directamente el valor de la propiedad padre o agrupe un Map sin añadir otro subnivel.",
    attributes: "Ninguno",
    trapOrVs: "No confundir con @WithName.",
    example: `@ConfigMapping(prefix = "server")\npublic interface ServerConfig {\n    @WithParentName\n    Map<String, String> allProps();\n}`,
    distractors: [
      "@RootProperty",
      "@ParentPrefix",
      "@WithRootName"
    ]
  },
  {
    module: "config",
    annotation: "ConfigProvider.getConfig().getValue(\"clave\", Tipo.class)",
    targetPlace: "Dentro de métodos static, constructores o clases que NO son beans CDI",
    whenToUse: "Cuando el examen te pide leer una propiedad dentro de un método estático (static) o clase utilitaria donde @Inject NO funciona.",
    attributes: "Primer argumento: nombre String de la propiedad; Segundo argumento: clase del tipo (ej. String.class, Integer.class)",
    trapOrVs: "Si la propiedad puede no existir, usa .getOptionalValue(\"clave\", Tipo.class) en vez de .getValue(...).",
    example: `public static String getUrl() {\n    return ConfigProvider.getConfig().getValue("api.url", String.class);\n}`,
    distractors: [
      "ConfigProvider.getValue(\"clave\", Tipo.class)",
      "QuarkusConfig.get(\"clave\", Tipo.class)",
      "System.getConfig(\"clave\")"
    ]
  },

  // --- TEMA 2: RESTEASY REACTIVE Y JAKARTA REST (rest) ---
  {
    module: "rest",
    annotation: "@Path(\"/ruta\")",
    targetPlace: "Sobre una clase Resource, interfaz REST Client o método de endpoint",
    whenToUse: "Para indicar la URL base del recurso (sobre la clase) o la sub-ruta específica de una operación (sobre el método).",
    attributes: "value (ej. \"/speakers\" o \"/{id}\")",
    trapOrVs: "Si un método tiene @Path(\"/{id}\"), la variable se captura en el argumento con @PathParam(\"id\").",
    example: `@Path("/books")\npublic class BookResource {\n    @GET\n    @Path("/{id}")\n    public Book get(@PathParam("id") Long id) { ... }\n}`,
    distractors: [
      "@Route(\"/ruta\")",
      "@RequestMapping(\"/ruta\")",
      "@Endpoint(\"/ruta\")"
    ]
  },
  {
    module: "rest",
    annotation: "@GET / @POST / @PUT / @DELETE",
    targetPlace: "Sobre un método dentro de una clase @Path o interfaz @RegisterRestClient",
    whenToUse: "@GET para consultar, @POST para crear (suele devolver 201), @PUT para reemplazar/actualizar, @DELETE para eliminar.",
    attributes: "Ninguno",
    trapOrVs: "Un método con @DELETE o @PUT que retorna 'void' devuelve automáticamente HTTP 204 No Content.",
    example: `@POST\npublic Response create(Book b) { ... }`,
    distractors: [
      "@GetMapping / @PostMapping",
      "@HttpMethod(\"GET\")",
      "@HttpGet / @HttpPost"
    ]
  },
  {
    module: "rest",
    annotation: "@Produces(MediaType.APPLICATION_JSON)",
    targetPlace: "Sobre la clase Resource o sobre un método específico",
    whenToUse: "Para declarar el tipo MIME (Content-Type) que el endpoint devuelve en el cuerpo de la respuesta HTTP.",
    attributes: "MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN, MediaType.SERVER_SENT_EVENTS",
    trapOrVs: "@Produces es lo que tu método DEVUELVE (salida); @Consumes es lo que tu método RECIBE (entrada).",
    example: `@GET\n@Produces(MediaType.APPLICATION_JSON)\npublic List<Book> list() { ... }`,
    distractors: [
      "@Returns(MediaType.APPLICATION_JSON)",
      "@ResponseType(MediaType.APPLICATION_JSON)",
      "@Output(MediaType.APPLICATION_JSON)"
    ]
  },
  {
    module: "rest",
    annotation: "@Consumes(MediaType.APPLICATION_JSON)",
    targetPlace: "Sobre la clase Resource o sobre métodos @POST / @PUT",
    whenToUse: "Para declarar qué formato de cuerpo HTTP acepta el método en la petición entrante (ej. JSON).",
    attributes: "MediaType.APPLICATION_JSON, MediaType.MULTIPART_FORM_DATA, etc.",
    trapOrVs: "Si el cliente envía un Content-Type distinto al de @Consumes, Quarkus devuelve HTTP 415 Unsupported Media Type.",
    example: `@POST\n@Consumes(MediaType.APPLICATION_JSON)\npublic Response create(Book b) { ... }`,
    distractors: [
      "@Accepts(MediaType.APPLICATION_JSON)",
      "@RequestBody(MediaType.APPLICATION_JSON)",
      "@Input(MediaType.APPLICATION_JSON)"
    ]
  },
  {
    module: "rest",
    annotation: "@PathParam(\"id\")",
    targetPlace: "Sobre un parámetro de un método REST (o @RestPath en RESTEasy Reactive)",
    whenToUse: "Cuando el valor viene incrustado como segmento dentro de la URL definida en @Path(\"/items/{id}\").",
    attributes: "value (debe coincidir exactamente con el nombre entre llaves {id} en @Path)",
    trapOrVs: "NO confundir con @QueryParam (que lee valores después de '?' como /items?id=5).",
    example: `@GET\n@Path("/{id}")\npublic Book getById(@PathParam("id") Long id) { ... }`,
    distractors: [
      "@QueryParam(\"id\")",
      "@PathVariable(\"id\")",
      "@UrlParam(\"id\")"
    ]
  },
  {
    module: "rest",
    annotation: "@QueryParam(\"filtro\") @DefaultValue(\"valor\")",
    targetPlace: "Sobre un parámetro de un método REST",
    whenToUse: "Cuando el parámetro es opcional y viene al final de la URL tras el signo de interrogación (ej. /speakers?sortBy=name&pageIndex=0).",
    attributes: "@QueryParam lleva el nombre del parámetro URL; @DefaultValue define qué valor usar si el cliente no lo envía.",
    trapOrVs: "En parámetros REST se usa @DefaultValue (de jakarta.ws.rs.DefaultValue), NUNCA @WithDefault.",
    example: `@GET\npublic List<Speaker> list(@DefaultValue("id") @QueryParam("sortBy") String sortBy) { ... }`,
    distractors: [
      "@QueryParam(\"filtro\") @WithDefault(\"valor\")",
      "@RequestParam(value = \"filtro\", defaultValue = \"valor\")",
      "@PathParam(\"filtro\") @DefaultValue(\"valor\")"
    ]
  },
  {
    module: "rest",
    annotation: "@HeaderParam(\"X-Token\")",
    targetPlace: "Sobre un parámetro de un método REST",
    whenToUse: "Cuando necesitas leer el valor de una cabecera HTTP enviada por el cliente en la petición.",
    attributes: "value (nombre de la cabecera HTTP)",
    trapOrVs: "Para documentar una cabecera en OpenAPI se usa @Header; para leerla en el método Java se usa @HeaderParam.",
    example: `@GET\npublic Response check(@HeaderParam("X-Client-Id") String clientId) { ... }`,
    distractors: [
      "@Header(\"X-Token\")",
      "@RequestHeader(\"X-Token\")",
      "@HttpHeader(\"X-Token\")"
    ]
  },
  {
    module: "rest",
    annotation: "@Context UriInfo uriInfo",
    targetPlace: "Como parámetro de un método REST o campo de clase Resource",
    whenToUse: "En métodos @POST cuando necesitas construir la URL completa del nuevo recurso creado para devolverla en Response.created(uri).",
    attributes: "Ninguno",
    trapOrVs: "Se usa junto con uriInfo.getAbsolutePathBuilder().path(\"/{id}\").build(entity.id).",
    example: `@POST\npublic Response create(Book b, @Context UriInfo uriInfo) {\n    URI uri = uriInfo.getAbsolutePathBuilder().path("/{id}").build(b.id);\n    return Response.created(uri).build();\n}`,
    distractors: [
      "@Inject UriBuilder uriInfo",
      "@PathParam UriInfo uriInfo",
      "@ConfigProperty UriInfo uriInfo"
    ]
  },
  {
    module: "rest",
    annotation: "@Blocking",
    targetPlace: "Sobre un método REST o consumidor @Incoming",
    whenToUse: "Cuando un método en RESTEasy Reactive o Kafka hace trabajo lento/bloqueante (como usar Panache JPA clásico o Thread.sleep) pero su firma devolvería ejecución en el Event Loop (ej. retorna Uni<T> o es @Incoming).",
    attributes: "Ninguno (paquete io.smallrye.common.annotation.Blocking)",
    trapOrVs: "En RESTEasy Reactive, los métodos que retornan tipos síncronos (List<T>, Response) ya son bloqueantes por defecto; los que retornan Uni<T> o Multi<T> son @NonBlocking por defecto.",
    example: `@GET\n@Blocking\npublic Uni<List<Book>> listBlocking() { ... }`,
    distractors: [
      "@WorkerThread",
      "@Synchronized",
      "@AsyncBlocking"
    ]
  },
  {
    module: "rest",
    annotation: "@NonBlocking",
    targetPlace: "Sobre un método REST rápido en memoria",
    whenToUse: "Cuando un método síncrono NO toca base de datos ni disco (solo calcula algo rápido en memoria) y quieres que corra directamente en el Event Loop (I/O thread) para máxima velocidad.",
    attributes: "Ninguno (paquete io.smallrye.common.annotation.NonBlocking)",
    trapOrVs: "Si pones @NonBlocking en un método que llama a Panache clásico (JDBC), lanzará BlockingNotAllowedException.",
    example: `@GET\n@Path("/ping")\n@NonBlocking\npublic String ping() { return "pong"; }`,
    distractors: [
      "@EventLoop",
      "@Reactive",
      "@FastThread"
    ]
  },
  {
    module: "rest",
    annotation: "@ServerExceptionMapper",
    targetPlace: "Sobre un método dentro de una clase Resource o en una clase global",
    whenToUse: "En RESTEasy Reactive cuando quieres capturar una excepción específica de Java y transformarla limpiamente en un objeto Response con un código HTTP personalizado.",
    attributes: "value (opcional si el método ya recibe la excepción como parámetro)",
    trapOrVs: "Es mucho más corto que implementar la interfaz clásica ExceptionMapper<T>.",
    example: `@ServerExceptionMapper\npublic Response mapException(IllegalArgumentException ex) {\n    return Response.status(Response.Status.BAD_REQUEST).entity(ex.getMessage()).build();\n}`,
    distractors: [
      "@ExceptionHandler",
      "@CatchException",
      "@ErrorMapper"
    ]
  },

  // --- TEMA 3: MICROPROFILE OPENAPI (openapi) ---
  {
    module: "openapi",
    annotation: "@Operation(summary = \"...\", description = \"...\")",
    targetPlace: "Sobre un método de endpoint REST (@GET, @POST, @PUT, @DELETE)",
    whenToUse: "Cuando el examen pide documentar qué hace un endpoint en el contrato /q/openapi con un título corto (summary) y una explicación (description).",
    attributes: "summary = \"...\", description = \"...\", operationId = \"...\", hidden = true/false",
    trapOrVs: "¡Copia exactamente las cadenas de texto que pida el enunciado del examen porque el test automático las compara carácter por carácter!",
    example: `@GET\n@Operation(summary = "Lists all courses", description = "Returns the complete list of courses")\npublic List<Course> list() { ... }`,
    distractors: [
      "@ApiOperation(value = \"...\", notes = \"...\")",
      "@OpenAPI(summary = \"...\", description = \"...\")",
      "@EndpointDoc(summary = \"...\")"
    ]
  },
  {
    module: "openapi",
    annotation: "@APIResponse(responseCode = \"201\", description = \"...\", headers = { ... })",
    targetPlace: "Sobre un método de endpoint REST (puedes poner varias o envolverlas en @APIResponses)",
    whenToUse: "Para documentar qué códigos de estado HTTP (\"200\", \"201\", \"204\", \"404\") devuelve un endpoint, su descripción, sus cabeceras (@Header) o su contenido (@Content).",
    attributes: "responseCode (¡siempre como String entre comillas!), description, headers, content",
    trapOrVs: "Recuerda que responseCode es un String (\"201\", NO el número 201).",
    example: `@APIResponse(\n    responseCode = "404",\n    description = "Speaker not found"\n)`,
    distractors: [
      "@ResponseStatus(code = 201, message = \"...\")",
      "@OpenAPIResponse(status = 201, description = \"...\")",
      "@OperationResponse(code = \"201\")"
    ]
  },
  {
    module: "openapi",
    annotation: "@Header(name = \"id\", description = \"...\", schema = @Schema(implementation = Integer.class))",
    targetPlace: "Dentro del arreglo 'headers = { ... }' de una anotación @APIResponse",
    whenToUse: "Cuando un método (como @POST) devuelve cabeceras HTTP personalizadas (ej. 'id' o 'location') y el examen pide documentarlas en OpenAPI.",
    attributes: "name, description, schema = @Schema(implementation = Clase.class)",
    trapOrVs: "No confundir @Header (documentación OpenAPI) con @HeaderParam (leer cabecera en Jakarta REST).",
    example: `@Header(\n    name = "id",\n    description = "ID of created resource",\n    schema = @Schema(implementation = Integer.class)\n)`,
    distractors: [
      "@HeaderParam(name = \"id\", type = Integer.class)",
      "@ResponseHeader(name = \"id\", schema = Integer.class)",
      "@OpenAPIHeader(key = \"id\")"
    ]
  },
  {
    module: "openapi",
    annotation: "@Schema(implementation = Clase.class)",
    targetPlace: "Sobre una clase DTO/Entidad, campo, o dentro de @Header / @Content",
    whenToUse: "Para indicar el tipo de dato o modelo que representa un cuerpo JSON, una cabecera o una propiedad en la especificación OpenAPI.",
    attributes: "implementation = Clase.class, type = SchemaType.ARRAY, description = \"...\", required = true",
    trapOrVs: "Si el endpoint devuelve una lista y lo documentas en @Content, se usa @Schema(type = SchemaType.ARRAY, implementation = MiClase.class).",
    example: `@Content(\n    mediaType = MediaType.APPLICATION_JSON,\n    schema = @Schema(type = SchemaType.ARRAY, implementation = Book.class)\n)`,
    distractors: [
      "@Model(type = Clase.class)",
      "@OpenAPIType(Clase.class)",
      "@JsonSchema(Clase.class)"
    ]
  },
  {
    module: "openapi",
    annotation: "@Parameter(description = \"...\", required = true)",
    targetPlace: "Sobre un parámetro de un método REST (junto a @PathParam o @QueryParam)",
    whenToUse: "Cuando el examen pide documentar en OpenAPI para qué sirve un parámetro de ruta o de consulta.",
    attributes: "name, description, required, example",
    trapOrVs: "Viene de org.eclipse.microprofile.openapi.annotations.parameters.Parameter.",
    example: `public Book get(@Parameter(description = "Book ID", required = true) @PathParam("id") Long id)`,
    distractors: [
      "@ApiParam(value = \"...\")",
      "@ParamDoc(description = \"...\")",
      "@SchemaParam(description = \"...\")"
    ]
  },
  {
    module: "openapi",
    annotation: "@Tag(name = \"...\", description = \"...\")",
    targetPlace: "Sobre la clase Resource o sobre un método REST",
    whenToUse: "Cuando el examen pide agrupar los endpoints bajo una categoría o etiqueta específica en Swagger UI / OpenAPI.",
    attributes: "name = \"NombreGrupo\", description = \"...\"",
    trapOrVs: "Si se pone sobre la clase Resource, todos sus métodos heredan ese Tag automáticamente.",
    example: `@Path("/books")\n@Tag(name = "Books", description = "Operations about books")\npublic class BookResource { ... }`,
    distractors: [
      "@Group(name = \"...\")",
      "@Category(\"...?\")",
      "@OpenAPITag(\"...\")"
    ]
  },

  // --- TEMA 4: PERSISTENCIA CON PANACHE (panache) ---
  {
    module: "panache",
    annotation: "@Entity + extends PanacheEntity",
    targetPlace: "En la declaración de la clase de entidad JPA",
    whenToUse: "Cuando usas el patrón Active Record (los métodos como listAll(), findById(), persist() viven directamente en la propia clase Entidad) y quieres un ID numérico Long autogenerado.",
    attributes: "@Entity (de jakarta.persistence.Entity)",
    trapOrVs: "¡PROHIBIDO declarar 'public Long id;' si extiendes PanacheEntity, porque PanacheEntity ya lo declara por ti! Si necesitas un ID propio (ej. String o UUID), extiende de PanacheEntityBase.",
    example: `@Entity\npublic class Speaker extends PanacheEntity {\n    public String name;\n    public String organization;\n}`,
    distractors: [
      "@Table + implements PanacheEntity",
      "@PanacheEntity + public class Speaker",
      "@Entity + extends PanacheRepository<Speaker>"
    ]
  },
  {
    module: "panache",
    annotation: "@ApplicationScoped + implements PanacheRepository<Entidad>",
    targetPlace: "En una clase Repository separada de la entidad",
    whenToUse: "Cuando el proyecto usa el patrón Repository / DAO (la entidad solo tiene datos y las consultas se hacen inyectando el repositorio con @Inject).",
    attributes: "Tipo genérico <Entidad> (y PanacheRepositoryBase<Entidad, TipoId> si el ID no es Long)",
    trapOrVs: "¡No olvides anotar la clase repositorio con @ApplicationScoped! En Quarkus NO se usa @Repository de Spring.",
    example: `@ApplicationScoped\npublic class SpeakerRepository implements PanacheRepository<Speaker> {\n    public List<Speaker> findByOrg(String org) {\n        return list("organization", org);\n    }\n}`,
    distractors: [
      "@Repository + extends PanacheRepository<Entidad>",
      "@Entity + implements PanacheRepository<Entidad>",
      "@SingletonRepository + implements JpaRepository<Entidad, Long>"
    ]
  },
  {
    module: "panache",
    annotation: "@Transactional",
    targetPlace: "Sobre cualquier método (REST, Servicio o consumidor Kafka) que modifique la base de datos",
    whenToUse: "SIEMPRE que llames a persist(), delete(), deleteById(), update() o modifiques un atributo de una entidad recuperada de la base de datos.",
    attributes: "TxType (por defecto REQUIRED)",
    trapOrVs: "Si olvidas @Transactional en un POST, PUT o DELETE, Hibernate lanzará TransactionRequiredException y el test dará HTTP 500.",
    example: `@POST\n@Transactional\npublic Response create(Speaker s) {\n    s.persist();\n    return Response.status(201).build();\n}`,
    distractors: [
      "@TransactionAttribute",
      "@Commit",
      "@WriteTransaction"
    ]
  },
  {
    module: "panache",
    annotation: "@OneToMany(mappedBy = \"padre\", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)",
    targetPlace: "Sobre la lista List<Hijo> dentro de la entidad Padre",
    whenToUse: "Cuando una entidad Padre (ej. Speaker) tiene muchos Hijos (ej. Talk) y quieres que al guardar o borrar al Padre se guarden/borren sus Hijos automáticamente.",
    attributes: "mappedBy (nombre del campo en la clase Hijo), cascade = CascadeType.ALL, fetch = FetchType.EAGER",
    trapOrVs: "mappedBy debe tener el nombre exacto de la variable Java en la clase Hijo (ej. 'speaker').",
    example: `@OneToMany(mappedBy = "speaker", cascade = CascadeType.ALL, fetch = FetchType.EAGER)\npublic List<Talk> talks = new ArrayList<>();`,
    distractors: [
      "@ManyToOne(mappedBy = \"padre\")",
      "@HasMany(target = Hijo.class)",
      "@OneToMany(joinColumn = \"padre_id\")"
    ]
  },
  {
    module: "panache",
    annotation: "@ManyToOne + @JoinColumn(name = \"...\") + @JsonIgnore",
    targetPlace: "Sobre el campo que referencia al Padre dentro de la entidad Hijo",
    whenToUse: "En el lado Hijo de una relación bidireccional. @JsonIgnore (Jackson) o @JsonbTransient (JSON-B) evita que al serializar Padre -> Hijos -> Padre se produzca un bucle infinito (StackOverflowError).",
    attributes: "@JoinColumn(name = \"columna_fk\")",
    trapOrVs: "¡Cuidado! NO uses @Transient de JPA para ignorar en JSON (porque @Transient borra la columna de la base de datos). Usa @JsonIgnore (Jackson) o @JsonbTransient (JSON-B).",
    example: `@ManyToOne\n@JoinColumn(name = "speaker_id")\n@JsonIgnore\npublic Speaker speaker;`,
    distractors: [
      "@ManyToOne + @Transient",
      "@OneToMany + @IgnoreJson",
      "@BelongsTo + @JsonExclude"
    ]
  },

  // --- TEMA 5: REST CLIENT REACTIVE (restclient) ---
  {
    module: "restclient",
    annotation: "@RegisterRestClient(configKey = \"mi-api\")",
    targetPlace: "Sobre la INTERFAZ Java que define el cliente HTTP remoto",
    whenToUse: "Siempre que creas una interfaz para llamar a otro microservicio por HTTP. El configKey permite configurar su URL en application.properties con 'quarkus.rest-client.mi-api.url'.",
    attributes: "configKey = \"clave-corta\", baseUri = \"http://...\" (opcional)",
    trapOrVs: "@RegisterRestClient va SOLO en la interfaz; para inyectarla en otra clase se usa @Inject @RestClient.",
    example: `@Path("/warnings")\n@RegisterRestClient(configKey = "weather-api")\npublic interface WeatherClient {\n    @GET\n    List<Warning> getAll();\n}`,
    distractors: [
      "@RestClient(configKey = \"mi-api\")",
      "@FeignClient(name = \"mi-api\")",
      "@HttpClient(prefix = \"mi-api\")"
    ]
  },
  {
    module: "restclient",
    annotation: "@Inject @RestClient",
    targetPlace: "Sobre el campo donde inyectas tu interfaz de cliente REST dentro de un Resource o Service",
    whenToUse: "Cada vez que necesitas usar una interfaz anotada con @RegisterRestClient dentro de una clase CDI.",
    attributes: "Ninguno (ambas anotaciones van juntas sin parámetros)",
    trapOrVs: "Si pones solo @Inject sin @RestClient, Quarkus lanza UnsatisfiedResolutionException al compilar/arrancar.",
    example: `@Inject\n@RestClient\nWeatherClient weatherClient;`,
    distractors: [
      "@Inject @RegisterRestClient",
      "@ConfigProperty @RestClient",
      "@AutowiredClient"
    ]
  },
  {
    module: "restclient",
    annotation: "@ClientHeaderParam(name = \"X-Header\", value = \"valor\")",
    targetPlace: "Sobre la interfaz @RegisterRestClient o sobre uno de sus métodos",
    whenToUse: "Cuando tu REST Client debe enviar automáticamente una cabecera HTTP fija o calculada en todas las peticiones hacia el servicio remoto.",
    attributes: "name = \"Nombre-Cabecera\", value = \"valor-o-{metodoCalculador}\"",
    trapOrVs: "Ahorra tener que pasar @HeaderParam como argumento en cada llamada del método.",
    example: `@RegisterRestClient(configKey = "ext-api")\n@ClientHeaderParam(name = "X-Api-Version", value = "v2")\npublic interface ExternalClient { ... }`,
    distractors: [
      "@HeaderParam(name = \"X-Header\", defaultValue = \"valor\")",
      "@Header(name = \"X-Header\", value = \"valor\")",
      "@RequestHeader(name = \"X-Header\", value = \"valor\")"
    ]
  },

  // --- TEMA 6: MICROPROFILE FAULT TOLERANCE (faulttolerance) ---
  {
    module: "faulttolerance",
    annotation: "@Timeout(1500)",
    targetPlace: "Sobre un método CDI o endpoint REST que llama a un recurso lento/remoto",
    whenToUse: "Cuando quieres limitar el tiempo máximo que puede tardar un método. Si supera el tiempo, aborta y lanza org.eclipse.microprofile.faulttolerance.exceptions.TimeoutException.",
    attributes: "value (por defecto en milisegundos, ej. 1500), unit = ChronoUnit.MILLIS / SECONDS",
    trapOrVs: "Si combinas @Timeout con @Retry y @Fallback, el Timeout dispara el Retry, y si se agotan los reintentos se activa el Fallback.",
    example: `@GET\n@Timeout(1500)\n@Fallback(fallbackMethod = "defaultWeather")\npublic Weather getWeather() { ... }`,
    distractors: [
      "@TimeLimit(1500)",
      "@Deadline(ms = 1500)",
      "@MaxExecutionTime(1500)"
    ]
  },
  {
    module: "faulttolerance",
    annotation: "@Retry(maxRetries = 3, delay = 200, retryOn = ..., abortOn = ...)",
    targetPlace: "Sobre un método CDI, cliente REST o endpoint",
    whenToUse: "Cuando una operación puede fallar temporalmente (ej. red inestable) y quieres que Quarkus la vuelva a ejecutar automáticamente antes de rendirse.",
    attributes: "maxRetries (nº de reintentos extra), delay (espera entre intentos), retryOn = {Excepcion.class}, abortOn = {Excepcion.class}",
    trapOrVs: "Si maxRetries = 3, el método se ejecutará hasta 4 veces en total (1 intento original + 3 reintentos).",
    example: `@Retry(maxRetries = 3, delay = 200, retryOn = IOException.class)\npublic List<Session> fetchSessions() { ... }`,
    distractors: [
      "@Repeat(times = 3, wait = 200)",
      "@RetryPolicy(attempts = 3, sleep = 200)",
      "@AutoRetry(count = 3, delayMs = 200)"
    ]
  },
  {
    module: "faulttolerance",
    annotation: "@CircuitBreaker(requestVolumeThreshold = 4, failureRatio = 0.75, delay = 2000, successThreshold = 2)",
    targetPlace: "Sobre un método que invoca un servicio externo propenso a caídas prolongadas",
    whenToUse: "Para dejar de golpear un servicio caído y fallar de inmediato (CircuitBreakerOpenException) cuando la proporción de fallos supera el umbral.",
    attributes: "requestVolumeThreshold (tamaño de ventana), failureRatio (0.0 a 1.0), delay (ms que dura abierto), successThreshold (éxitos en half-open para cerrar)",
    trapOrVs: "failureRatio es un decimal entre 0.0 y 1.0: 75% se escribe 0.75 (3 fallos de 4 peticiones), ¡NUNCA escribas 75!",
    example: `@CircuitBreaker(requestVolumeThreshold = 4, failureRatio = 0.75, delay = 2000, successThreshold = 2)\npublic Forecast getForecast() { ... }`,
    distractors: [
      "@CircuitBreaker(window = 4, ratio = 75, openMs = 2000, successes = 2)",
      "@Breaker(threshold = 4, failurePercent = 0.75, wait = 2000)",
      "@CircuitBreaker(requests = 4, failures = 3, timeout = 2000)"
    ]
  },
  {
    module: "faulttolerance",
    annotation: "@Fallback(fallbackMethod = \"nombreMetodoRespaldo\")",
    targetPlace: "Sobre el método propenso a fallar",
    whenToUse: "Cuando necesitas devolver una respuesta alternativa segura (Plan B) si el método principal lanza excepción, hace Timeout o tiene el CircuitBreaker abierto.",
    attributes: "fallbackMethod = \"nombreMetodo\", applyOn = {Ex.class}, skipOn = {Ex.class}",
    trapOrVs: "¡REGLA CRÍTICA!: El método indicado en fallbackMethod DEBE tener exactamente el mismo tipo de retorno y los mismos tipos de parámetros que el método original.",
    example: `@Fallback(fallbackMethod = "emptyList")\npublic List<Talk> getTalks(Long speakerId) { ... }\n\npublic List<Talk> emptyList(Long speakerId) {\n    return Collections.emptyList();\n}`,
    distractors: [
      "@OnError(method = \"nombreMetodoRespaldo\")",
      "@Recover(handler = \"nombreMetodoRespaldo\")",
      "@DefaultResponse(method = \"nombreMetodoRespaldo\")"
    ]
  },
  {
    module: "faulttolerance",
    annotation: "@Bulkhead(value = 5, waitingTaskQueue = 10)",
    targetPlace: "Sobre un método que quieres proteger contra sobrecarga de llamadas concurrentes",
    whenToUse: "Cuando quieres limitar cuántas peticiones pueden ejecutar ese método al mismo tiempo (ej. máximo 5 en paralelo) para que no agote todos los hilos del servidor.",
    attributes: "value (ejecuciones concurrentes máximas), waitingTaskQueue (cola de espera si también lleva @Asynchronous)",
    trapOrVs: "Si se supera el límite de concurrencia, lanza BulkheadException.",
    example: `@Bulkhead(5)\npublic Report generateHeavyReport() { ... }`,
    distractors: [
      "@MaxConcurrency(5)",
      "@RateLimit(5)",
      "@Semaphore(5)"
    ]
  },

  // --- TEMA 7: MICROPROFILE HEALTH CHECK (health) ---
  {
    module: "health",
    annotation: "@Liveness + @ApplicationScoped + implements HealthCheck",
    targetPlace: "Sobre la clase que verifica si el proceso sigue vivo",
    whenToUse: "Cuando el examen pide crear una sonda de vida en '/q/health/live'. Si devuelve DOWN, Kubernetes/OpenShift mata y reinicia el contenedor.",
    attributes: "Ninguno en la anotación; se implementa el método public HealthCheckResponse call()",
    trapOrVs: "No confundir con @Readiness: @Liveness responde '¿debo reiniciar el pod?', mientras que @Readiness responde '¿puedo enviarle tráfico ahora?'.",
    example: `@Liveness\n@ApplicationScoped\npublic class LiveCheck implements HealthCheck {\n    @Override\n    public HealthCheckResponse call() {\n        return HealthCheckResponse.up("alive");\n    }\n}`,
    distractors: [
      "@LiveProbe + implements HealthProbe",
      "@HealthCheck(type = \"live\")",
      "@Alive + @Singleton"
    ]
  },
  {
    module: "health",
    annotation: "@Readiness + @ApplicationScoped + implements HealthCheck",
    targetPlace: "Sobre la clase que verifica dependencias externas (BD, API remota, Kafka)",
    whenToUse: "Cuando el examen pide una sonda de disponibilidad en '/q/health/ready' que compruebe si la BD o un servicio externo responde antes de recibir peticiones de usuarios.",
    attributes: "Ninguno en la anotación; se implementa HealthCheck",
    trapOrVs: "Siempre incluye @ApplicationScoped junto a @Readiness.",
    example: `@Readiness\n@ApplicationScoped\npublic class ApiReadyCheck implements HealthCheck {\n    @Override\n    public HealthCheckResponse call() {\n        return HealthCheckResponse.named("API Ready").withData("env", "prod").up().build();\n    }\n}`,
    distractors: [
      "@Ready + implements ReadinessCheck",
      "@Health(ready = true)",
      "@ReadinessProbe + implements Callable<Health>"
    ]
  },
  {
    module: "health",
    annotation: "@Startup + @ApplicationScoped + implements HealthCheck",
    targetPlace: "Sobre la clase que verifica si la aplicación terminó su inicialización inicial",
    whenToUse: "Cuando el examen pide una sonda de arranque expuesta en '/q/health/started' para aplicaciones que tardan en calentar cachés o cargar datos al inicio.",
    attributes: "Ninguno",
    trapOrVs: "Expone su resultado en /q/health/started (mientras que @Liveness es /q/health/live y @Readiness es /q/health/ready).",
    example: `@Startup\n@ApplicationScoped\npublic class WarmupCheck implements HealthCheck {\n    @Override\n    public HealthCheckResponse call() {\n        return HealthCheckResponse.up("started");\n    }\n}`,
    distractors: [
      "@OnStart + implements HealthCheck",
      "@Started + @ApplicationScoped",
      "@BootCheck"
    ]
  },

  // --- TEMA 8: MICROMETER METRICS (metrics) ---
  {
    module: "metrics",
    annotation: "@Counted(value = \"nombre.contador\", description = \"...\")",
    targetPlace: "Sobre un método CDI o endpoint REST",
    whenToUse: "Cuando quieres contar automáticamente cuántas veces se ha ejecutado un método sin escribir código con MeterRegistry.",
    attributes: "value (nombre de la métrica), description, extraTags = {\"k\", \"v\"}",
    trapOrVs: "Viene de io.micrometer.core.annotation.Counted. Si necesitas incrementar condicionalmente a mitad de un método, usa registry.counter(\"...\").increment().",
    example: `@GET\n@Counted(value = "parks.get.counter", description = "Total GET calls")\npublic List<Park> getAll() { ... }`,
    distractors: [
      "@Counter(name = \"nombre.contador\")",
      "@MetricCount(\"nombre.contador\")",
      "@Increment(\"nombre.contador\")"
    ]
  },
  {
    module: "metrics",
    annotation: "@Timed(value = \"nombre.timer\", description = \"...\")",
    targetPlace: "Sobre un método CDI o endpoint REST",
    whenToUse: "Cuando quieres medir automáticamente cuánto tiempo tarda en ejecutarse un método y cuántas veces fue invocado.",
    attributes: "value (nombre del timer), description, histogram = true/false",
    trapOrVs: "Viene de io.micrometer.core.annotation.Timed. Si el examen te pide medir solo una línea específica dentro de un método, usa registry.timer(\"...\").wrap(...).get().",
    example: `@GET\n@Timed(value = "parks.get.timer", description = "Latency of GET parks")\npublic List<Park> getAll() { ... }`,
    distractors: [
      "@Timer(name = \"nombre.timer\")",
      "@MeasureTime(\"nombre.timer\")",
      "@Stopwatch(\"nombre.timer\")"
    ]
  },
  {
    module: "metrics",
    annotation: "@Inject MeterRegistry registry;",
    targetPlace: "Sobre un campo en tu clase Resource o Service",
    whenToUse: "Cuando el examen pide crear contadores (registry.counter), cronómetros (registry.timer) o medidores de estado (registry.gauge) de forma programática.",
    attributes: "Ninguno (de io.micrometer.core.instrument.MeterRegistry)",
    trapOrVs: "Recuerda las 3 llamadas: registry.counter(\"x\").increment(), registry.timer(\"y\").wrap((Supplier<T>) () -> ...).get(), y registry.gauge(\"z\", Tags.empty(), this, Clase::metodo).",
    example: `@Inject\nMeterRegistry registry;\n\n@PostConstruct\nvoid init() {\n    registry.gauge("level.gauge", Tags.empty(), this, MyService::getLevel);\n}`,
    distractors: [
      "@Inject MetricRegistry registry;",
      "@ConfigProperty MeterRegistry registry;",
      "@Inject PrometheusRegistry registry;"
    ]
  },

  // --- TEMA 9: OPENTELEMETRY TRACING (otel) ---
  {
    module: "otel",
    annotation: "@WithSpan(\"nombre-span-opcional\")",
    targetPlace: "Sobre un método de un bean CDI interno (ej. Service o Guard)",
    whenToUse: "Cuando quieres que un método de negocio interno (que NO es un endpoint REST) genere su propio Span hijo dentro de la traza distribuida en Jaeger.",
    attributes: "value (opcional: nombre personalizado del Span; si lo omites usa Clase.metodo)",
    trapOrVs: "¡En Quarkus 3.8 con OpenTelemetry la anotación es @WithSpan (de io.opentelemetry.instrumentation.annotations.WithSpan), NUNCA uses @Traced que era del viejo OpenTracing!",
    example: `@WithSpan("check-weather-span")\npublic Uni<Void> checkWeatherForPark(Park park) { ... }`,
    distractors: [
      "@Traced(\"nombre-span-opcional\")",
      "@NewSpan(\"nombre-span-opcional\")",
      "@TraceSpan(\"nombre-span-opcional\")"
    ]
  },
  {
    module: "otel",
    annotation: "@SpanAttribute(\"nombre.etiqueta\")",
    targetPlace: "Sobre un parámetro de un método que ya está anotado con @WithSpan",
    whenToUse: "Cuando quieres que el valor del argumento recibido por un método @WithSpan quede registrado como atributo/tag visible dentro del Span en Jaeger.",
    attributes: "value (nombre del atributo en el span, ej. \"park.id\")",
    trapOrVs: "Solo funciona en métodos que tienen @WithSpan.",
    example: `@WithSpan\npublic void inspectPark(@SpanAttribute("park.name") String parkName) { ... }`,
    distractors: [
      "@TraceParam(\"nombre.etiqueta\")",
      "@SpanTag(\"nombre.etiqueta\")",
      "@Attribute(\"nombre.etiqueta\")"
    ]
  },

  // --- TEMA 10: SEGURIDAD JWT RBAC (jwt) ---
  {
    module: "jwt",
    annotation: "@RolesAllowed({ \"Admin\", \"Ranger\" })",
    targetPlace: "Sobre un método REST/CDI o sobre toda la clase Resource",
    whenToUse: "Cuando quieres restringir el acceso únicamente a usuarios autenticados cuyo token JWT contenga al menos uno de esos roles dentro del claim 'groups'.",
    attributes: "value (un String \"Admin\" o un arreglo de Strings {\"Admin\", \"User\"})",
    trapOrVs: "Si el cliente NO envía token recibe HTTP 401 Unauthorized; si envía un token válido pero sin ese rol en 'groups', recibe HTTP 403 Forbidden.",
    example: `@PUT\n@RolesAllowed({ "Admin" })\n@Transactional\npublic void updatePark(Park park) { ... }`,
    distractors: [
      "@RequiresRole(\"Admin\")",
      "@HasGroup(\"Admin\")",
      "@AllowedGroups({ \"Admin\" })"
    ]
  },
  {
    module: "jwt",
    annotation: "@PermitAll",
    targetPlace: "Sobre un método REST (especialmente cuando la clase tiene @RolesAllowed o @DenyAll)",
    whenToUse: "Cuando quieres dejar un endpoint público abierto a todo el mundo (incluso sin token JWT), aunque el resto de la clase esté protegida.",
    attributes: "Ninguno (de jakarta.annotation.security.PermitAll)",
    trapOrVs: "Si quieres exigir que el usuario tenga un token válido pero sin importar qué rol tenga, usa @Authenticated (de io.quarkus.security.Authenticated) en lugar de @PermitAll.",
    example: `@GET\n@PermitAll\npublic List<Park> listPublicParks() { ... }`,
    distractors: [
      "@PublicEndpoint",
      "@AllowAnonymous",
      "@NoAuth"
    ]
  },
  {
    module: "jwt",
    annotation: "@DenyAll",
    targetPlace: "Sobre un método REST o clase Resource",
    whenToUse: "Cuando quieres bloquear completamente un endpoint para todos los usuarios sin importar qué roles tengan (siempre devuelve 403/401).",
    attributes: "Ninguno (de jakarta.annotation.security.DenyAll)",
    trapOrVs: "Útil como política por defecto a nivel de clase cuando abres métodos puntuales con @RolesAllowed o @PermitAll.",
    example: `@DELETE\n@Path("/reset-db")\n@DenyAll\npublic void danger() { ... }`,
    distractors: [
      "@BlockAll",
      "@Forbidden",
      "@RolesAllowed({})"
    ]
  },
  {
    module: "jwt",
    annotation: "@Authenticated",
    targetPlace: "Sobre un método REST o clase Resource",
    whenToUse: "Cuando cualquier usuario con un token JWT válido puede acceder, sin importar a qué grupo/rol pertenezca.",
    attributes: "Ninguno (de io.quarkus.security.Authenticated)",
    trapOrVs: "Diferencia clave: @PermitAll no exige token; @Authenticated exige token válido (cualquier rol); @RolesAllowed exige token válido + rol específico.",
    example: `@GET\n@Path("/profile")\n@Authenticated\npublic String myProfile() { ... }`,
    distractors: [
      "@RequiresLogin",
      "@JwtRequired",
      "@LoggedIn"
    ]
  },
  {
    module: "jwt",
    annotation: "@Inject JsonWebToken jwt;",
    targetPlace: "Sobre un campo en tu Resource o Service",
    whenToUse: "Cuando necesitas inspeccionar dentro de tu código Java los datos del token JWT del usuario actual (jwt.getName(), jwt.getGroups(), jwt.getClaim(\"...\")).",
    attributes: "Ninguno (de org.eclipse.microprofile.jwt.JsonWebToken)",
    trapOrVs: "Para crear un token nuevo se usa la clase 'Jwt' (builder estático); para leer el token entrante se inyecta la interfaz 'JsonWebToken'.",
    example: `@Inject\nJsonWebToken jwt;\n\npublic String currentUser() {\n    return jwt.getName(); // devuelve el upn\n}`,
    distractors: [
      "@Inject Jwt token;",
      "@ConfigProperty JsonWebToken jwt;",
      "@Context JwtToken jwt;"
    ]
  },
  {
    module: "jwt",
    annotation: "@Inject @Claim(standard = Claims.upn) String upn;",
    targetPlace: "Sobre un campo en un bean con ámbito @RequestScoped (o inyectando ClaimValue<String>)",
    whenToUse: "Cuando quieres inyectar directamente un único dato específico (claim) del token JWT (como el email, upn, birthdate o un claim personalizado) sin usar todo el objeto JsonWebToken.",
    attributes: "standard = Claims.upn / Claims.preferred_username, o value = \"nombreClaimPersonalizado\"",
    trapOrVs: "Si tu clase es @ApplicationScoped y necesitas inyectar un @Claim directo, el campo debe ser Provider<String> o ClaimValue<String>, o bien cambiar la clase a @RequestScoped.",
    example: `@Inject\n@Claim(standard = Claims.upn)\nString userEmail;`,
    distractors: [
      "@JwtClaim(\"upn\") String upn;",
      "@ConfigProperty(name = \"jwt.upn\") String upn;",
      "@HeaderParam(\"upn\") String upn;"
    ]
  },

  // --- TEMA 11: REACTIVE MESSAGING CON KAFKA (messaging) ---
  {
    module: "messaging",
    annotation: "@Incoming(\"nombre-canal\")",
    targetPlace: "Sobre un método dentro de una clase @ApplicationScoped",
    whenToUse: "Cuando quieres que ese método consuma y se ejecute automáticamente por cada mensaje que llegue desde un canal de entrada (ej. un topic de Kafka).",
    attributes: "value (nombre del canal configurado en mp.messaging.incoming.<canal>.*)",
    trapOrVs: "¡Recuerda!: Si el método @Incoming usa Panache clásico (BD bloqueante), DEBES añadirle también @Blocking y @Transactional.",
    example: `@Incoming("warnings-in")\n@Blocking\n@Transactional\npublic void consume(WeatherWarning w) {\n    w.persist();\n}`,
    distractors: [
      "@KafkaListener(topic = \"nombre-canal\")",
      "@Consumer(\"nombre-canal\")",
      "@Subscribe(\"nombre-canal\")"
    ]
  },
  {
    module: "messaging",
    annotation: "@Outgoing(\"nombre-canal\")",
    targetPlace: "Sobre un método dentro de una clase @ApplicationScoped",
    whenToUse: "Cuando un método produce un flujo continuo (Multi<T>) o cuando un método procesador recibe con @Incoming(\"in\"), transforma el dato y lo reenvía con @Outgoing(\"out\").",
    attributes: "value (nombre del canal configurado en mp.messaging.outgoing.<canal>.*)",
    trapOrVs: "NUNCA pongas @Outgoing sobre un campo Emitter<T>. @Outgoing es exclusivo para métodos; en campos Emitter<T> se usa @Channel.",
    example: `@Incoming("raw-prices")\n@Outgoing("converted-prices")\npublic double convert(int priceUsd) {\n    return priceUsd * 0.92;\n}`,
    distractors: [
      "@Producer(\"nombre-canal\")",
      "@Publish(\"nombre-canal\")",
      "@SendTo(\"nombre-canal\")"
    ]
  },
  {
    module: "messaging",
    annotation: "@Inject @Channel(\"nombre-canal\") Emitter<T> emitter;",
    targetPlace: "Sobre un campo dentro de un Resource REST o Service",
    whenToUse: "Cuando necesitas enviar mensajes a Kafka bajo demanda desde código imperativo (por ejemplo, cuando un usuario hace un POST a un endpoint REST y quieres publicar un evento).",
    attributes: "value en @Channel (nombre del canal de salida en mp.messaging.outgoing.<canal>.*)",
    trapOrVs: "Se envía llamando a emitter.send(objeto). Si necesitas enviar metadatos de Kafka, envías Message.of(objeto).",
    example: `@Inject\n@Channel("orders-out")\nEmitter<Order> orderEmitter;\n\n@POST\npublic void createOrder(Order o) {\n    orderEmitter.send(o);\n}`,
    distractors: [
      "@Inject @Outgoing(\"nombre-canal\") Emitter<T> emitter;",
      "@ConfigProperty(name = \"nombre-canal\") Emitter<T> emitter;",
      "@Inject @KafkaTopic(\"nombre-canal\") Producer<T> emitter;"
    ]
  },
  {
    module: "messaging",
    annotation: "@Broadcast",
    targetPlace: "Sobre un método @Outgoing o junto a @Channel",
    whenToUse: "Cuando tienes múltiples consumidores internos (@Incoming) escuchando el mismo canal en memoria y quieres que cada mensaje se entregue a TODOS ellos.",
    attributes: "value (opcional: número mínimo de suscriptores antes de empezar a emitir)",
    trapOrVs: "Viene de io.smallrye.reactive.messaging.annotations.Broadcast.",
    example: `@Outgoing("internal-alerts")\n@Broadcast\npublic Multi<String> streamAlerts() { ... }`,
    distractors: [
      "@Multicast",
      "@Fanout",
      "@PublishAll"
    ]
  },

  // --- EXTRAS DE CDI Y TESTING EN EL EXAMEN (transversal a todos los temas) ---
  {
    module: "rest",
    annotation: "@ApplicationScoped",
    targetPlace: "Sobre clases de Servicio, Repositorios Panache, HealthChecks o Consumidores Kafka",
    whenToUse: "Para registrar tu clase como un bean CDI con una única instancia compartida durante toda la vida de la aplicación (con proxy).",
    attributes: "Ninguno (de jakarta.enterprise.context.ApplicationScoped)",
    trapOrVs: "Es el ámbito por defecto recomendado en Quarkus para servicios, repositorios, sondas @Liveness/@Readiness y procesadores @Incoming.",
    example: `@ApplicationScoped\npublic class ExpenseService { ... }`,
    distractors: [
      "@Service",
      "@Component",
      "@Bean"
    ]
  },
  {
    module: "rest",
    annotation: "@QuarkusTest",
    targetPlace: "Sobre una clase de pruebas JUnit 5",
    whenToUse: "Cuando creas un test de integración en Quarkus que levanta la aplicación y permite usar RestAssured e @Inject dentro del test.",
    attributes: "Ninguno (de io.quarkus.test.junit.QuarkusTest)",
    trapOrVs: "Para apuntar RestAssured automáticamente a la ruta de un Resource puedes acompañar la clase con @TestHTTPEndpoint(MiResource.class).",
    example: `@QuarkusTest\n@TestHTTPEndpoint(SpeakerResource.class)\npublic class SpeakerResourceTest { ... }`,
    distractors: [
      "@SpringBootTest",
      "@MicroProfileTest",
      "@QuarkusIntegration"
    ]
  },
  {
    module: "restclient",
    annotation: "@InjectMock @RestClient",
    targetPlace: "Sobre un campo de cliente REST dentro de una clase @QuarkusTest",
    whenToUse: "Cuando en un test quieres simular (mockear con Mockito) un cliente REST (@RegisterRestClient) para no llamar al servidor externo real.",
    attributes: "Ninguno (de io.quarkus.test.InjectMock + org.eclipse.microprofile.rest.client.inject.RestClient)",
    trapOrVs: "Si el bean a mockear es un REST Client, necesitas poner AMBAS anotaciones en el test: @InjectMock y @RestClient.",
    example: `@QuarkusTest\npublic class ParksTest {\n    @InjectMock\n    @RestClient\n    WeatherClient mockWeather;\n}`,
    distractors: [
      "@Mock @InjectClient",
      "@MockBean @RegisterRestClient",
      "@TestMock @RestClient"
    ]
  },
  {
    module: "jwt",
    annotation: "@TestSecurity(user = \"alice\", roles = { \"Admin\" })",
    targetPlace: "Sobre un método @Test dentro de una clase @QuarkusTest",
    whenToUse: "Cuando quieres probar un endpoint protegido con @RolesAllowed en un test sin tener que generar ni firmar un token JWT real.",
    attributes: "user = \"nombre\", roles = {\"Rol1\", \"Rol2\"}, authorizationEnabled = true/false",
    trapOrVs: "Requiere la dependencia quarkus-test-security en pom.xml.",
    example: `@Test\n@TestSecurity(user = "adminUser", roles = { "Admin" })\npublic void testUpdatePark() { ... }`,
    distractors: [
      "@WithMockUser(username = \"alice\", roles = \"Admin\")",
      "@MockJwt(user = \"alice\", group = \"Admin\")",
      "@SimulateAuth(role = \"Admin\")"
    ]
  }
];

// Compatibilidad con generador previo de flashcards
window.DRILL_ITEMS = window.ANNOTATION_DICTIONARY.map(item => ({
  module: item.module,
  target: item.annotation,
  prompt: item.whenToUse,
  where: item.targetPlace,
  attributes: item.attributes,
  trapOrVs: item.trapOrVs,
  example: item.example,
  distractors: item.distractors
}));

// ============================================================================
// BANCO MASIVO DE PREGUNTAS CURADAS (Enfocado en Anotaciones, Cuándo Usarlas y Código)
// Categorías:
//   - "annotation": Sintaxis exacta, atributos y ubicación de la anotación
//   - "when": ¿Cuándo usar X vs Y? (Diferenciar anotaciones parecidas y casos de uso)
//   - "code": Completar código de examen y comportamiento en ejecución
// ============================================================================
window.QUESTION_BANK = [
  // =========================================================================
  // 1. CONFIGURACIÓN Y PERFILES (config)
  // =========================================================================
  {
    id: "cfg-1",
    module: "config",
    category: "annotation",
    question: "¿Qué anotación debes colocar en el código faltante para inyectar la propiedad 'gateway.timeout' con un valor por defecto de 2500 si no existe en application.properties?",
    code: `@ApplicationScoped
public class PaymentService {
    // ¿Qué anotación va aquí?
    int timeout;
}`,
    options: [
      "@ConfigProperty(name = \"gateway.timeout\", defaultValue = \"2500\")",
      "@ConfigProperty(value = \"gateway.timeout\", default = 2500)",
      "@ConfigMapping(prefix = \"gateway.timeout\", defaultValue = \"2500\")",
      "@WithDefault(\"2500\") @Inject(\"gateway.timeout\")"
    ],
    correct: 0,
    explanation: "En MicroProfile Config, '@ConfigProperty' usa los atributos 'name' y 'defaultValue' (siempre como String entre comillas).",
    kidTip: "Piensa en @ConfigProperty como pedir UN solo juguete por su nombre ('name') y decir cuál quieres de repuesto ('defaultValue') si no hay."
  },
  {
    id: "cfg-2",
    module: "config",
    category: "annotation",
    question: "Tienes una interfaz anotada con @ConfigMapping(prefix = \"billing\"). ¿Qué anotación usas para inyectarla dentro de tu clase InvoiceService?",
    code: `@ApplicationScoped
public class InvoiceService {
    // ¿Cómo inyectas BillingConfig aquí?
    BillingConfig config;
}`,
    options: [
      "@Inject",
      "@ConfigProperty(name = \"billing\")",
      "@ConfigMapping",
      "@RestClient"
    ],
    correct: 0,
    explanation: "Las interfaces anotadas con '@ConfigMapping' se registran automáticamente como beans CDI y se inyectan con '@Inject' estándar, NUNCA con '@ConfigProperty'.",
    kidTip: "@ConfigMapping ya es una mochila completa; solo pides que te la entreguen con @Inject."
  },
  {
    id: "cfg-3",
    module: "config",
    category: "code",
    question: "En una interfaz @ConfigMapping(prefix = \"expense\"), ¿a qué propiedad de application.properties se mapea automáticamente el método 'boolean debugEnabled();'?",
    code: `@ConfigMapping(prefix = "expense")
public interface ExpenseConfig {
    boolean debugEnabled();
}`,
    options: [
      "expense.debug-enabled",
      "expense.debugEnabled",
      "expense.debug_enabled",
      "debug-enabled"
    ],
    correct: 0,
    explanation: "@ConfigMapping convierte automáticamente los nombres de métodos en camelCase ('debugEnabled') a kebab-case ('debug-enabled') bajo el prefijo ('expense.').",
    kidTip: "Cada letra mayúscula en el nombre del método se transforma en un guion '-' y minúscula."
  },
  {
    id: "cfg-4",
    module: "config",
    category: "annotation",
    question: "Dentro de una interfaz @ConfigMapping(prefix = \"billing\"), quieres que el método 'String currencyCode()' lea la propiedad 'billing.currency' y tenga por defecto 'USD'. ¿Qué anotaciones usas?",
    code: `@ConfigMapping(prefix = "billing")
public interface BillingConfig {
    // ¿Qué anotaciones van aquí?
    String currencyCode();
}`,
    options: [
      "@WithName(\"currency\") y @WithDefault(\"USD\")",
      "@ConfigProperty(name = \"currency\", defaultValue = \"USD\")",
      "@Named(\"currency\") y @DefaultValue(\"USD\")",
      "@WithPrefix(\"currency\") y @WithDefault(\"USD\")"
    ],
    correct: 0,
    explanation: "Dentro de '@ConfigMapping' se usan las anotaciones de SmallRye Config: '@WithName' para cambiar el nombre de la propiedad y '@WithDefault' para el valor por defecto.",
    kidTip: "Recuerda la pareja de @ConfigMapping: empieza siempre con '@With...' (@WithName y @WithDefault)."
  },
  {
    id: "cfg-5",
    module: "config",
    category: "when",
    question: "¿Cuándo debes usar '@WithDefault(\"10\")' en lugar de '@DefaultValue(\"10\")' o 'defaultValue = \"10\"'?",
    code: `// Tres formas distintas de dar un valor por defecto en Quarkus:
// 1. defaultValue = "10"
// 2. @WithDefault("10")
// 3. @DefaultValue("10")`,
    options: [
      "@WithDefault se usa en métodos de una interfaz @ConfigMapping; defaultValue es un atributo de @ConfigProperty; y @DefaultValue se usa con @QueryParam/@HeaderParam en Jakarta REST",
      "Las tres son intercambiables en cualquier clase de Quarkus",
      "@WithDefault es para variables de entorno y @DefaultValue es para application.properties",
      "@DefaultValue es para interfaces @ConfigMapping y @WithDefault es para endpoints REST"
    ],
    correct: 0,
    explanation: "¡Esta es una de las confusiones más frecuentes en el examen! '@WithDefault' es exclusivo de SmallRye '@ConfigMapping'; 'defaultValue' es un atributo dentro de '@ConfigProperty'; y '@DefaultValue' pertenece a 'jakarta.ws.rs' para parámetros HTTP (@QueryParam).",
    kidTip: "ConfigMapping = @WithDefault | ConfigProperty = defaultValue | QueryParam REST = @DefaultValue."
  },
  {
    id: "cfg-6",
    module: "config",
    category: "when",
    question: "¿Cuándo debes elegir @ConfigMapping(prefix = \"...\") en una interfaz en lugar de usar @ConfigProperty en tus clases?",
    code: `// ¿Cuándo conviene crear una interfaz con @ConfigMapping?`,
    options: [
      "Cuando tienes un grupo de propiedades relacionadas bajo un mismo prefijo (ej. 'billing.*') y quieres inyectarlas juntas como un objeto tipado",
      "Cuando estás dentro de un método static donde no funciona @Inject",
      "Cuando solo necesitas leer el puerto HTTP de Quarkus una única vez",
      "Cuando necesitas conectarte a un servicio REST remoto por HTTP"
    ],
    correct: 0,
    explanation: "'@ConfigMapping' agrupa todas las propiedades que comparten un prefijo dentro de una interfaz limpia, validando los tipos al arrancar.",
    kidTip: "1 propiedad suelta = @ConfigProperty. Familia de propiedades con el mismo apellido = @ConfigMapping."
  },
  {
    id: "cfg-7",
    module: "config",
    category: "code",
    question: "¿Qué ocurre al arrancar Quarkus si inyectas '@ConfigProperty(name = \"app.secret\") String secret;' y 'app.secret' NO existe en ninguna fuente de configuración?",
    code: `@ConfigProperty(name = "app.secret")
String secret;`,
    options: [
      "Quarkus falla al arrancar lanzando DeploymentException / NoSuchElementException",
      "El campo 'secret' queda en null y la aplicación arranca normalmente",
      "El campo 'secret' queda como cadena vacía \"\"",
      "Quarkus ignora el campo hasta que se llame por primera vez"
    ],
    correct: 0,
    explanation: "Quarkus valida todas las propiedades inyectadas en el arranque. Si falta una obligatoria (sin defaultValue ni Optional<T>), aborta el inicio.",
    kidTip: "Si un dato puede no existir, envuélvelo siempre en Optional<String> o ponle defaultValue."
  },
  {
    id: "cfg-8",
    module: "config",
    category: "when",
    question: "Estás en un método 'static' de una clase utilitaria donde NO puedes usar @Inject ni @ConfigProperty. ¿Cómo obtienes el valor String de la propiedad 'billing.company-name'?",
    code: `public static String getCompany() {
    return ____________________________;
}`,
    options: [
      "ConfigProvider.getConfig().getValue(\"billing.company-name\", String.class)",
      "ConfigProvider.getValue(\"billing.company-name\")",
      "QuarkusConfig.getString(\"billing.company-name\")",
      "System.getProperty(\"billing.company-name\")"
    ],
    correct: 0,
    explanation: "'ConfigProvider.getConfig().getValue(key, Type.class)' es la forma estándar de hacer Lookup programático en MicroProfile Config cuando estás fuera de CDI.",
    kidTip: "Cuando no hay @Inject (como en un método static), llamas por teléfono a la central: ConfigProvider.getConfig()."
  },
  {
    id: "cfg-9",
    module: "config",
    category: "code",
    question: "¿Cómo escribes en application.properties que 'gateway.max-retries' valga 3 normalmente, pero valga 10 cuando corres los tests con 'mvn test'?",
    code: `gateway.max-retries = 3
# ¿Cómo defines el valor para el perfil de pruebas?`,
    options: [
      "%test.gateway.max-retries = 10",
      "@test.gateway.max-retries = 10",
      "gateway.max-retries.%test = 10",
      "$test.gateway.max-retries = 10"
    ],
    correct: 0,
    explanation: "En Quarkus los perfiles se anteponen al nombre de la propiedad usando el signo de porcentaje: '%dev.', '%test.', '%prod.'.",
    kidTip: "El símbolo '%' al inicio es el disfraz del perfil: %dev (desarrollo), %test (pruebas), %prod (producción)."
  },
  {
    id: "cfg-10",
    module: "config",
    category: "code",
    question: "En application.properties quieres que 'app.url' use la variable 'HOST_NAME', pero si no existe use 'localhost' por defecto. ¿Cuál es la sintaxis correcta?",
    code: `app.url = http://_________________:8080`,
    options: [
      "${HOST_NAME:localhost}",
      "${HOST_NAME?localhost}",
      "#{HOST_NAME:localhost}",
      "$HOST_NAME|localhost"
    ],
    correct: 0,
    explanation: "Las expresiones de propiedades en Quarkus usan '${PROPIEDAD:valorPorDefecto}' separados por dos puntos ':'.",
    kidTip: "Los dos puntos ':' dentro de ${VAR:defecto} significan 'y si no está, pon esto'."
  },

  // =========================================================================
  // 2. RESTEASY REACTIVE Y JAKARTA REST (rest)
  // =========================================================================
  {
    id: "rest-1",
    module: "rest",
    category: "code",
    question: "¿Cómo construyes en un método @POST una respuesta HTTP 201 Created que incluya la cabecera 'Location' (uri), una cabecera 'id' con el valor 42 y el objeto 'book' en el cuerpo?",
    code: `@POST
public Response create(Book book, @Context UriInfo uriInfo) {
    URI uri = uriInfo.getAbsolutePathBuilder().path("/{id}").build(42);
    return _____________________________________________;
}`,
    options: [
      "Response.created(uri).header(\"id\", 42).entity(book).build()",
      "Response.status(201).location(uri).addHeader(\"id\", 42).body(book)",
      "Response.ok(book).status(201).header(\"Location\", uri).build()",
      "new Response(201, uri, book)"
    ],
    correct: 0,
    explanation: "'Response.created(uri)' establece automáticamente el código 201 y la cabecera 'Location'. Luego encadenas '.header(\"id\", ...)', '.entity(...)' y cierras con '.build()'.",
    kidTip: "Response.created(uri) hace 2 cosas de golpe: pone el código 201 y pega la etiqueta Location."
  },
  {
    id: "rest-2",
    module: "rest",
    category: "annotation",
    question: "En un endpoint GET /courses?sortBy=name, quieres capturar el parámetro 'sortBy' y que si el usuario no lo envía en la URL tome el valor \"id\". ¿Qué anotaciones usas en el parámetro?",
    code: `@GET
public List<Course> list(________________________________ String sortBy) {
    return store.findAll(sortBy);
}`,
    options: [
      "@DefaultValue(\"id\") @QueryParam(\"sortBy\")",
      "@PathParam(\"sortBy\") @WithDefault(\"id\")",
      "@QueryParam(name = \"sortBy\", defaultValue = \"id\")",
      "@HeaderParam(\"sortBy\") @DefaultValue(\"id\")"
    ],
    correct: 0,
    explanation: "En Jakarta REST, los parámetros después de '?' se leen con '@QueryParam' y su valor por defecto se indica con '@DefaultValue' (de jakarta.ws.rs.DefaultValue).",
    kidTip: "Ojo: En configuración es @WithDefault, pero en parámetros REST (@QueryParam) es @DefaultValue."
  },
  {
    id: "rest-3",
    module: "rest",
    category: "when",
    question: "¿Cuándo debes usar @PathParam(\"id\") y cuándo debes usar @QueryParam(\"id\") en un método REST?",
    code: `// URL 1: GET /speakers/42
// URL 2: GET /speakers?id=42`,
    options: [
      "@PathParam(\"id\") cuando el valor forma parte de la ruta (@Path(\"/{id}\")); @QueryParam(\"id\") cuando viene después del signo '?' (?id=42)",
      "@PathParam es para números Long y @QueryParam es solo para textos String",
      "@PathParam solo sirve en @GET y @QueryParam solo sirve en @POST",
      "Son sinónimos y ambos leen tanto la ruta como el '?' automáticamente"
    ],
    correct: 0,
    explanation: "'@PathParam' extrae variables definidas entre llaves '{...}' dentro de '@Path'. '@QueryParam' extrae pares clave=valor de la cadena de consulta después de '?'.",
    kidTip: "Dentro de barras /42 = @PathParam. Después del signo de pregunta ?id=42 = @QueryParam."
  },
  {
    id: "rest-4",
    module: "rest",
    category: "when",
    question: "¿Cuál es la diferencia entre @Produces(MediaType.APPLICATION_JSON) y @Consumes(MediaType.APPLICATION_JSON)?",
    code: `@Path("/expenses")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ExpenseResource { ... }`,
    options: [
      "@Produces define el formato que tu endpoint DEVUELVE al cliente; @Consumes define el formato que tu endpoint ACEPTA recibir en el cuerpo de la petición",
      "@Produces se usa en clientes REST y @Consumes se usa en servidores REST",
      "@Produces es para métodos @POST y @Consumes es para métodos @GET",
      "@Consumes convierte de Java a JSON y @Produces convierte de JSON a Java"
    ],
    correct: 0,
    explanation: "'@Produces' controla la cabecera 'Content-Type' de la respuesta saliente (y negociación con 'Accept'). '@Consumes' valida el 'Content-Type' del cuerpo entrante (en POST/PUT).",
    kidTip: "Produce = lo que sale de tu cocina hacia el cliente. Consume = los ingredientes que entran del cliente a tu cocina."
  },
  {
    id: "rest-5",
    module: "rest",
    category: "code",
    question: "Si un cliente pide DELETE /speakers/999 y el speaker 999 no existe, ¿qué excepción estándar de Jakarta REST puedes lanzar para devolver automáticamente HTTP 404 Not Found?",
    code: `@DELETE
@Path("/{id}")
public void delete(@PathParam("id") Long id) {
    if (!Speaker.deleteById(id)) {
        throw new ______________________();
    }
}`,
    options: [
      "NotFoundException",
      "NoSuchElementException",
      "EntityNotFoundException",
      "Http404Exception"
    ],
    correct: 0,
    explanation: "'jakarta.ws.rs.NotFoundException' (o 'new WebApplicationException(Response.Status.NOT_FOUND)') hace que RESTEasy devuelva inmediatamente un estado HTTP 404.",
    kidTip: "NotFoundException es el botón de emergencia 404 de Jakarta REST."
  },
  {
    id: "rest-6",
    module: "rest",
    category: "code",
    question: "¿Qué código de estado HTTP devuelve por defecto un método REST cuya firma retorna 'void' (por ejemplo, 'public void delete(@PathParam(\"id\") Long id)') cuando finaliza sin lanzar excepciones?",
    code: `@DELETE
@Path("/{id}")
public void delete(@PathParam("id") Long id) {
    service.remove(id);
}`,
    options: [
      "204 No Content",
      "200 OK",
      "201 Created",
      "202 Accepted"
    ],
    correct: 0,
    explanation: "Según el estándar Jakarta REST, cualquier método que retorne 'void' devuelve HTTP 204 No Content al completarse con éxito.",
    kidTip: "void = vacío = 204 No Content (Todo salió bien, pero no tengo nada que mostrarte en pantalla)."
  },
  {
    id: "rest-7",
    module: "rest",
    category: "when",
    question: "En RESTEasy Reactive, ¿cuándo debes anotar un método con @Blocking?",
    code: `@GET
@Path("/report")
// ¿Cuándo es necesario poner @Blocking aquí?
public Uni<Report> generateBlockingReport() { ... }`,
    options: [
      "Cuando el método se ejecutaría en el Event Loop (por ejemplo porque retorna Uni/Multi o es un consumidor @Incoming) pero realiza operaciones bloqueantes como JDBC/Panache clásico",
      "Cuando quieres prohibir que los usuarios llamen al endpoint sin permiso",
      "Cuando quieres que el método corra en el hilo de I/O (Event Loop) sin bloquear",
      "Siempre que un método devuelva un String constante en memoria"
    ],
    correct: 0,
    explanation: "'@Blocking' (de io.smallrye.common.annotation.Blocking) indica a Quarkus que despache la ejecución en el pool de Worker Threads para no bloquear el Event Loop.",
    kidTip: "Si retorna Uni/Multi o es @Incoming pero por dentro usa BD clásica (bloquea), ponle @Blocking."
  },
  {
    id: "rest-8",
    module: "rest",
    category: "annotation",
    question: "En RESTEasy Reactive, ¿qué anotación pones sobre un método dentro de tu Resource para capturar cualquier 'IllegalArgumentException' y devolver un Response HTTP 400 sin crear una clase separada?",
    code: `// ¿Qué anotación convierte este método en un manejador de excepciones REST?
public Response handleBadArg(IllegalArgumentException ex) {
    return Response.status(Response.Status.BAD_REQUEST).build();
}`,
    options: [
      "@ServerExceptionMapper",
      "@ExceptionHandler",
      "@CatchException",
      "@ProviderMapper"
    ],
    correct: 0,
    explanation: "'@ServerExceptionMapper' (de org.jboss.resteasy.reactive.server.ServerExceptionMapper) permite mapear excepciones a objetos Response directamente en un método.",
    kidTip: "@ServerExceptionMapper = el atrapa-errores automático de RESTEasy Reactive."
  },
  {
    id: "rest-9",
    module: "rest",
    category: "annotation",
    question: "Para inyectar el objeto 'UriInfo' dentro de los parámetros de un método @POST en Jakarta REST y armar la cabecera Location, ¿qué anotación colocas delante de 'UriInfo uriInfo'?",
    code: `@POST
public Response create(Book book, __________ UriInfo uriInfo) {
    URI uri = uriInfo.getAbsolutePathBuilder().path("/{id}").build(book.id);
    return Response.created(uri).build();
}`,
    options: [
      "@Context",
      "@PathParam",
      "@QueryParam",
      "@ConfigProperty"
    ],
    correct: 0,
    explanation: "En Jakarta REST, objetos del contexto HTTP como 'UriInfo', 'HttpHeaders' o 'SecurityContext' se inyectan en los parámetros con '@Context' (de jakarta.ws.rs.core.Context).",
    kidTip: "Para pedir información del contexto de la petición actual (UriInfo, SecurityContext), usas @Context."
  },

  // =========================================================================
  // 3. MICROPROFILE OPENAPI (openapi)
  // =========================================================================
  {
    id: "oa-1",
    module: "openapi",
    category: "code",
    question: "¿Qué propiedad debes agregar en application.properties para cambiar el título principal del documento OpenAPI (/q/openapi) a 'Training Courses API'?",
    code: `# application.properties
_____________________________________ = Training Courses API`,
    options: [
      "quarkus.smallrye-openapi.info-title",
      "mp.openapi.title",
      "quarkus.openapi.title",
      "quarkus.swagger-ui.title"
    ],
    correct: 0,
    explanation: "En Quarkus, los metadatos 'info' del documento OpenAPI se configuran con el prefijo 'quarkus.smallrye-openapi.info-title', 'info-version', 'info-description'.",
    kidTip: "Acuérdate que la extensión se llama 'smallrye-openapi', así que todas sus propiedades empiezan por 'quarkus.smallrye-openapi.info-...'."
  },
  {
    id: "oa-2",
    module: "openapi",
    category: "code",
    question: "Por defecto, Quarkus solo incluye Swagger UI (/q/swagger-ui) en modo desarrollo (%dev) y test. ¿Qué propiedad hace que Swagger UI esté disponible SIEMPRE (incluso en producción)?",
    code: `# application.properties
_____________________________________ = true`,
    options: [
      "quarkus.swagger-ui.always-include",
      "quarkus.smallrye-openapi.swagger-enabled",
      "quarkus.swagger.enabled",
      "mp.openapi.swagger-ui.active"
    ],
    correct: 0,
    explanation: "'quarkus.swagger-ui.always-include=true' incluye la interfaz gráfica de Swagger UI en el empaquetado final de producción.",
    kidTip: "always-include = incluir siempre la página visual de Swagger."
  },
  {
    id: "oa-3",
    module: "openapi",
    category: "annotation",
    question: "¿Qué anotación de MicroProfile OpenAPI se coloca sobre un método REST para darle un resumen ('summary') y una descripción ('description')?",
    code: `@GET
// ¿Qué anotación va aquí?
public List<Park> listParks() { ... }`,
    options: [
      "@Operation(summary = \"List parks\", description = \"Lists all parks\")",
      "@OpenAPIOperation(title = \"List parks\", detail = \"Lists all parks\")",
      "@APIDocumentation(summary = \"List parks\")",
      "@Schema(summary = \"List parks\", description = \"Lists all parks\")"
    ],
    correct: 0,
    explanation: "'@Operation' (de org.eclipse.microprofile.openapi.annotations.Operation) documenta cada endpoint HTTP con 'summary' y 'description'.",
    kidTip: "Cada método HTTP (@GET, @POST) es una '@Operation' en OpenAPI."
  },
  {
    id: "oa-4",
    module: "openapi",
    category: "annotation",
    question: "Dentro de @APIResponse(responseCode = \"201\", headers = { ... }), ¿cómo documentas que la cabecera 'id' tiene un esquema de tipo Integer?",
    code: `@APIResponse(
    responseCode = "201",
    headers = {
        @Header(
            name = "id",
            description = "ID of the created entity",
            schema = _______________________________________
        )
    }
)`,
    options: [
      "@Schema(implementation = Integer.class)",
      "Integer.class",
      "@HeaderSchema(type = \"integer\")",
      "@Type(Integer.class)"
    ],
    correct: 0,
    explanation: "El atributo 'schema' dentro de '@Header' recibe una anotación '@Schema(implementation = Clase.class)' o '@Schema(type = SchemaType.INTEGER)'.",
    kidTip: "Dentro de @Header, el tipo de dato siempre va envuelto en un @Schema(implementation = ...)."
  },
  {
    id: "oa-5",
    module: "openapi",
    category: "when",
    question: "¿Cuál es la diferencia entre usar @Operation, @APIResponse, @Parameter y @Schema en MicroProfile OpenAPI?",
    code: `// ¿Cuándo usas cada una de estas 4 anotaciones de OpenAPI?`,
    options: [
      "@Operation describe el endpoint en general; @APIResponse describe un código HTTP devuelto (ej. \"201\", \"404\"); @Parameter describe un @PathParam/@QueryParam; y @Schema define el tipo de dato o modelo",
      "@Operation es para GET, @APIResponse es para POST, @Parameter es para PUT y @Schema es para DELETE",
      "Todas hacen lo mismo y se ponen sobre la clase Resource",
      "@Schema reemplaza a @Entity en la base de datos"
    ],
    correct: 0,
    explanation: "Cada nivel del documento OpenAPI tiene su anotación: '@Operation' (qué hace el método), '@Parameter' (qué entra por URL), '@APIResponse' (qué códigos HTTP salen) y '@Schema' (qué forma tienen los datos).",
    kidTip: "Operation = el verbo | Parameter = lo que entra | APIResponse = el código que sale | Schema = la forma del dato."
  },
  {
    id: "oa-6",
    module: "openapi",
    category: "annotation",
    question: "Quieres documentar en @APIResponse que cuando tu endpoint @DELETE no encuentra el registro devuelve el código HTTP 404 con la descripción 'Course not found'. ¿Cuál es la sintaxis exacta?",
    code: `@DELETE
@Path("/{id}")
// ¿Qué anotación va aquí?
public void delete(@PathParam("id") Integer id) { ... }`,
    options: [
      "@APIResponse(responseCode = \"404\", description = \"Course not found\")",
      "@APIResponse(status = 404, message = \"Course not found\")",
      "@Operation(errorCode = \"404\", errorDescription = \"Course not found\")",
      "@ErrorResponse(code = 404, description = \"Course not found\")"
    ],
    correct: 0,
    explanation: "'@APIResponse' usa los atributos 'responseCode' (como String entre comillas) y 'description'.",
    kidTip: "En @APIResponse nunca olvides las comillas en responseCode = \"404\" y el atributo se llama description."
  },

  // =========================================================================
  // 4. PANACHE JPA (panache)
  // =========================================================================
  {
    id: "pan-1",
    module: "panache",
    category: "when",
    question: "En una entidad que usa el patrón Active Record ('extends PanacheEntity'), ¿por qué NO debes declarar el campo '@Id public Long id;' manualmente?",
    code: `@Entity
public class Book extends PanacheEntity {
    public String title;
}`,
    options: [
      "Porque PanacheEntity ya hereda un campo público 'id' de tipo Long con @Id y @GeneratedValue",
      "Porque en Panache las tablas no tienen llave primaria",
      "Porque Panache usa el primer campo String como llave primaria",
      "Porque el id solo existe en PanacheRepository"
    ],
    correct: 0,
    explanation: "La superclase 'PanacheEntity' ya define 'public Long id;' autogenerado. Si necesitas otro tipo de ID (ej. UUID o String), extiendes de 'PanacheEntityBase' en su lugar.",
    kidTip: "PanacheEntity ya trae el 'id' de fábrica; si le pones otro 'id', chocan."
  },
  {
    id: "pan-2",
    module: "panache",
    category: "annotation",
    question: "Al llamar a 'book.persist()' dentro de un método @POST, obtienes 'jakarta.persistence.TransactionRequiredException'. ¿Qué anotación olvidaste poner?",
    code: `@POST
// ¿Qué anotación falta aquí?
public Response create(Book book) {
    book.persist();
    return Response.status(201).build();
}`,
    options: [
      "@Transactional (de jakarta.transaction.Transactional)",
      "@Entity",
      "@PersistenceContext",
      "@Blocking"
    ],
    correct: 0,
    explanation: "En Hibernate ORM con Panache, TODA operación de escritura (persist, delete, deleteById o actualización de campos) requiere una transacción activa con '@Transactional'.",
    kidTip: "Sin el candado mágico @Transactional, la base de datos no te deja escribir ni borrar nada."
  },
  {
    id: "pan-3",
    module: "panache",
    category: "annotation",
    question: "Tienes una relación bidireccional: Speaker (@OneToMany) -> Talk (@ManyToOne). Cuando haces GET /speakers, la aplicación lanza StackOverflowError al serializar a JSON con Jackson. ¿Qué anotación colocas en Talk?",
    code: `@Entity
public class Talk extends PanacheEntity {
    public String title;

    @ManyToOne
    // ¿Qué anotación evita la recursión infinita en JSON?
    public Speaker speaker;
}`,
    options: [
      "@JsonIgnore (o @JsonbTransient si usas JSON-B)",
      "@Transient (de jakarta.persistence.Transient)",
      "@OneToOne",
      "@Transactional"
    ],
    correct: 0,
    explanation: "Al serializar Speaker -> lista de Talks -> cada Talk tiene a Speaker -> que tiene Talks..., se forma un ciclo infinito. '@JsonIgnore' (Jackson) o '@JsonbTransient' (JSON-B) en el hijo corta el ciclo.",
    kidTip: "El hijo (@ManyToOne) no debe volver a pintar al papá en el JSON, o se vuelven un espejo frente a otro espejo hasta explotar."
  },
  {
    id: "pan-4",
    module: "panache",
    category: "when",
    question: "¡Trampa clásica de examen! ¿Por qué NO debes poner '@Transient' (de jakarta.persistence) en el campo '@ManyToOne public Speaker speaker;' cuando solo quieres ocultarlo del JSON?",
    code: `@ManyToOne
@Transient // <-- ¡ERROR GRAVE SI HACES ESTO!
public Speaker speaker;`,
    options: [
      "Porque @Transient le dice a JPA/Hibernate que NO guarde ese campo en la base de datos; para ocultarlo solo del JSON debes usar @JsonIgnore (o @JsonbTransient)",
      "Porque @Transient solo funciona en métodos y no en campos",
      "Porque @Transient convierte el campo en estático",
      "Porque @Transient hace que el campo sea obligatorio en el JSON"
    ],
    correct: 0,
    explanation: "'@Transient' pertenece a JPA e ignora el campo en la tabla SQL (rompiendo la llave foránea). '@JsonIgnore' / '@JsonbTransient' solo lo oculta al serializar a JSON, manteniendo la relación intacta en la BD.",
    kidTip: "@Transient = lo borra de la Base de Datos | @JsonIgnore = lo oculta solo del JSON."
  },
  {
    id: "pan-5",
    module: "panache",
    category: "code",
    question: "Usando Panache Active Record, ¿cómo obtienes la lista de Speakers ordenada por el campo 'name' y paginada en la página 'pageIndex' de tamaño 'pageSize'?",
    code: `public List<Speaker> getSpeakers(String sortBy, int pageIndex, int pageSize) {
    return _________________________________________________________;
}`,
    options: [
      "Speaker.findAll(Sort.by(sortBy)).page(pageIndex, pageSize).list()",
      "Speaker.listAll().sort(sortBy).limit(pageIndex, pageSize)",
      "Speaker.findPage(pageIndex, pageSize, sortBy)",
      "Speaker.query().orderBy(sortBy).getPage(pageIndex, pageSize)"
    ],
    correct: 0,
    explanation: "'findAll(Sort.by(...))' devuelve un 'PanacheQuery', sobre el cual aplicas '.page(pageIndex, pageSize)' (o 'Page.of(pageIndex, pageSize)') y materializas con '.list()'.",
    kidTip: "Recuerda la escalera de 3 pasos en Panache: 1º findAll(Sort) -> 2º .page(...) -> 3º .list()."
  },
  {
    id: "pan-6",
    module: "panache",
    category: "annotation",
    question: "Si decides usar el patrón Repository ('public class SessionRepository implements PanacheRepository<Session>'), ¿qué anotación de ámbito CDI debes ponerle a la clase SessionRepository para poder inyectarla con @Inject?",
    code: `// ¿Qué anotación es obligatoria aquí?
public class SessionRepository implements PanacheRepository<Session> {
}`,
    options: [
      "@ApplicationScoped",
      "@Entity",
      "@Repository",
      "@RegisterRestClient"
    ],
    correct: 0,
    explanation: "En Quarkus no existe '@Repository' de Spring. Un 'PanacheRepository' es un bean CDI normal y debe anotarse con '@ApplicationScoped'.",
    kidTip: "Entidad lleva @Entity; Repositorio lleva @ApplicationScoped."
  },
  {
    id: "pan-7",
    module: "panache",
    category: "when",
    question: "¿Cuándo debes extender de 'PanacheEntityBase' en lugar de 'PanacheEntity' al usar el patrón Active Record?",
    code: `@Entity
public class CustomItem extends _____________________ {
    @Id
    public String code; // Queremos que la PK sea este String, no un Long
}`,
    options: [
      "Cuando necesitas definir tú mismo la llave primaria '@Id' (por ejemplo un String, UUID o clave compuesta) en lugar del Long id autogenerado de PanacheEntity",
      "Cuando no quieres que la clase se guarde en una base de datos",
      "Cuando usas el patrón Repository con PanacheRepository",
      "Cuando la tabla tiene más de 10 columnas"
    ],
    correct: 0,
    explanation: "'PanacheEntity' hereda de 'PanacheEntityBase' y le añade 'public Long id'. Si quieres definir tu propio '@Id', heredas directamente de 'PanacheEntityBase'.",
    kidTip: "ID automático Long = PanacheEntity. Tu propio @Id personalizado = PanacheEntityBase."
  },
  {
    id: "pan-8",
    module: "panache",
    category: "code",
    question: "En Panache Active Record, ¿cómo buscas todos los pedidos cuyo 'status' sea igual a '?1' y 'totalAmount' sea mayor o igual a '?2'?",
    code: `public static List<Order> findCompletedMin(OrderStatus status, BigDecimal min) {
    return ______________________________________________________________;
}`,
    options: [
      "list(\"status = ?1 and totalAmount >= ?2\", status, min)",
      "find(\"WHERE status = $1 AND totalAmount >= $2\", status, min)",
      "select(\"status = :1, totalAmount >= :2\", status, min)",
      "listAll(\"status\", status, \"totalAmount\", min)"
    ],
    correct: 0,
    explanation: "Panache usa parámetros posicionales empezando en 1 con signo de interrogación ('?1', '?2') en sus métodos cortos 'list(...)' y 'find(...)'.",
    kidTip: "En consultas Panache los parámetros se numeran como '?1', '?2', '?3'."
  },

  // =========================================================================
  // 5. REST CLIENT REACTIVE (restclient)
  // =========================================================================
  {
    id: "rc-1",
    module: "restclient",
    category: "annotation",
    question: "¿Qué dos anotaciones debes colocar sobre una interfaz Java para convertirla en un cliente REST que apunte a '/warnings' y use la clave de configuración 'weather-api'?",
    code: `// ¿Qué dos anotaciones van aquí?
public interface WeatherClient {
    @GET
    List<Warning> getWarnings();
}`,
    options: [
      "@Path(\"/warnings\") y @RegisterRestClient(configKey = \"weather-api\")",
      "@RestClient(\"/warnings\") y @ConfigMapping(prefix = \"weather-api\")",
      "@Path(\"/warnings\") y @RestClient(name = \"weather-api\")",
      "@WebClient(\"/warnings\") y @RegisterClient(\"weather-api\")"
    ],
    correct: 0,
    explanation: "Toda interfaz de MicroProfile REST Client lleva '@Path' para la ruta base remota y '@RegisterRestClient(configKey = \"...\")' para vincularla a application.properties.",
    kidTip: "En la interfaz del cliente siempre pegas '@RegisterRestClient(configKey = ...)'."
  },
  {
    id: "rc-2",
    module: "restclient",
    category: "code",
    question: "Si tu interfaz cliente tiene '@RegisterRestClient(configKey = \"expense-service\")', ¿cómo configuras su URL base en application.properties?",
    code: `# application.properties
__________________________________________ = http://localhost:8080`,
    options: [
      "quarkus.rest-client.expense-service.url",
      "mp.rest-client.expense-service.uri",
      "quarkus.client.expense-service.base-url",
      "expense-service.mp-rest.url"
    ],
    correct: 0,
    explanation: "En Quarkus la propiedad simplificada es 'quarkus.rest-client.<configKey>.url=http://...'.",
    kidTip: "Fórmula de memoria: quarkus.rest-client.<tu-configKey>.url"
  },
  {
    id: "rc-3",
    module: "restclient",
    category: "when",
    question: "¿Cuál es la diferencia exacta de uso entre '@RegisterRestClient' y '@RestClient'?",
    code: `// Dos anotaciones con nombres parecidos:
// 1. @RegisterRestClient
// 2. @RestClient`,
    options: [
      "@RegisterRestClient se coloca sobre la INTERFAZ para declararla como cliente HTTP; @RestClient se coloca junto a @Inject sobre el CAMPO donde la inyectas",
      "@RegisterRestClient es para clientes reactivos y @RestClient es para clientes bloqueantes",
      "Ambas se ponen juntas sobre la interfaz y también sobre el campo",
      "@RestClient va en la interfaz y @RegisterRestClient va en el campo @Inject"
    ],
    correct: 0,
    explanation: "'@RegisterRestClient' registra la interfaz en tiempo de compilación; '@RestClient' es el calificador CDI que acompaña a '@Inject' cuando usas esa interfaz en otra clase.",
    kidTip: "En la Interfaz = @RegisterRestClient ( la registras). En el Campo = @Inject @RestClient (la usas)."
  },
  {
    id: "rc-4",
    module: "restclient",
    category: "annotation",
    question: "En una prueba con @QuarkusTest quieres reemplazar tu cliente 'WeatherClient' por un Mock de Mockito para no hacer llamadas HTTP reales. ¿Qué anotaciones pones sobre el campo en el test?",
    code: `@QuarkusTest
public class ParkResourceTest {
    // ¿Qué DOS anotaciones van aquí para mockear el REST Client?
    WeatherClient weatherClientMock;
}`,
    options: [
      "@InjectMock y @RestClient",
      "Solo @InjectMock",
      "@Mock y @RegisterRestClient",
      "@TestMock y @Inject"
    ],
    correct: 0,
    explanation: "Como el bean original tiene el calificador '@RestClient', al mockearlo en un '@QuarkusTest' debes colocar tanto '@InjectMock' como '@RestClient'.",
    kidTip: "Para mockear un REST Client en tests necesitas el combo: @InjectMock + @RestClient."
  },
  {
    id: "rc-5",
    module: "restclient",
    category: "annotation",
    question: "Quieres que tu interfaz @RegisterRestClient envíe siempre la cabecera HTTP 'X-Api-Key: secret123' en todas sus peticiones sin pasarla como parámetro en cada método. ¿Qué anotación colocas sobre la interfaz?",
    code: `@Path("/api")
@RegisterRestClient(configKey = "partner-api")
// ¿Qué anotación envía una cabecera fija automáticamente?
public interface PartnerClient { ... }`,
    options: [
      "@ClientHeaderParam(name = \"X-Api-Key\", value = \"secret123\")",
      "@HeaderParam(\"X-Api-Key: secret123\")",
      "@Header(name = \"X-Api-Key\", defaultValue = \"secret123\")",
      "@WithHeader(key = \"X-Api-Key\", val = \"secret123\")"
    ],
    correct: 0,
    explanation: "'@ClientHeaderParam' (de org.eclipse.microprofile.rest.client.annotation.ClientHeaderParam) añade cabeceras estáticas o calculadas por un método en las peticiones salientes del REST Client.",
    kidTip: "Cabecera automática en cliente REST = @ClientHeaderParam(name = ..., value = ...)."
  },

  // =========================================================================
  // 6. MICROPROFILE FAULT TOLERANCE (faulttolerance)
  // =========================================================================
  {
    id: "ft-1",
    module: "faulttolerance",
    category: "annotation",
    question: "Quieres que un método que llama a un servicio externo reintente hasta 3 veces con una espera de 200 ms entre intentos si ocurre un fallo. ¿Qué anotación usas?",
    code: `@GET
// ¿Qué anotación va aquí?
public List<Forecast> getForecast() { ... }`,
    options: [
      "@Retry(maxRetries = 3, delay = 200)",
      "@RetryPolicy(attempts = 3, waitMs = 200)",
      "@Repeat(times = 3, sleep = 200)",
      "@Fallback(retries = 3, delay = 200)"
    ],
    correct: 0,
    explanation: "'@Retry' de MicroProfile Fault Tolerance usa 'maxRetries' para el número máximo de reintentos y 'delay' para la pausa entre ellos (en milisegundos por defecto).",
    kidTip: "@Retry(maxRetries = 3, delay = 200): 3 intentos extra esperando 200ms."
  },
  {
    id: "ft-2",
    module: "faulttolerance",
    category: "code",
    question: "Tienes el método 'public Uni<Void> checkWeather(Long parkId)' anotado con '@Fallback(fallbackMethod = \"safeCheck\")'. ¿Cuál debe ser la firma exacta del método 'safeCheck'?",
    code: `@Fallback(fallbackMethod = "safeCheck")
public Uni<Void> checkWeather(Long parkId) { ... }`,
    options: [
      "public Uni<Void> safeCheck(Long parkId)",
      "public void safeCheck(Long parkId)",
      "public Uni<Void> safeCheck()",
      "public Response safeCheck(Long parkId, Throwable t)"
    ],
    correct: 0,
    explanation: "El método 'fallbackMethod' DEBE tener exactamente el mismo tipo de retorno ('Uni<Void>') y la misma lista de parámetros ('Long parkId') que el método original.",
    kidTip: "El método Fallback es el doble de riesgo del método original: debe vestirse igualito (mismo retorno y mismos parámetros)."
  },
  {
    id: "ft-3",
    module: "faulttolerance",
    category: "annotation",
    question: "Quieres configurar un @CircuitBreaker que evalúe una ventana de 4 peticiones, abra el circuito si fallan 3 de esas 4 (75%), permanezca abierto por 2000 ms y se cierre tras 2 éxitos consecutivos. ¿Cuál es la configuración correcta?",
    code: `// ¿Cómo configuras los 4 atributos de @CircuitBreaker?`,
    options: [
      "@CircuitBreaker(requestVolumeThreshold = 4, failureRatio = 0.75, delay = 2000, successThreshold = 2)",
      "@CircuitBreaker(windowSize = 4, failurePercent = 75, openTime = 2000, closeCount = 2)",
      "@CircuitBreaker(requests = 4, ratio = 75, timeout = 2000, successes = 2)",
      "@CircuitBreaker(threshold = 4, failureRatio = 3, delay = 2000)"
    ],
    correct: 0,
    explanation: "Los 4 atributos clave de '@CircuitBreaker' son: 'requestVolumeThreshold' (ventana), 'failureRatio' (de 0.0 a 1.0, por tanto 3/4 = 0.75), 'delay' (tiempo abierto en ms) y 'successThreshold' (éxitos en half-open para cerrar).",
    kidTip: "Memoriza los 4 nombres: requestVolumeThreshold (ventana), failureRatio (0.0 a 1.0), delay (pausa abierto) y successThreshold (éxitos para sanar)."
  },
  {
    id: "ft-4",
    module: "faulttolerance",
    category: "annotation",
    question: "¿Qué anotación de MicroProfile Fault Tolerance aborta la ejecución de un método si tarda más de 1500 milisegundos, lanzando 'org.eclipse.microprofile.faulttolerance.exceptions.TimeoutException'?",
    code: `// ¿Qué anotación corta la espera a los 1500 ms?
public List<Session> getRemoteSessions() { ... }`,
    options: [
      "@Timeout(1500)",
      "@TimeLimit(1500)",
      "@MaxDuration(1500)",
      "@Deadline(1500)"
    ],
    correct: 0,
    explanation: "'@Timeout(1500)' (o '@Timeout(value = 1500)') limita el tiempo máximo de ejecución en milisegundos.",
    kidTip: "@Timeout(ms): el cronómetro que cuelga la llamada si se demora."
  },
  {
    id: "ft-5",
    module: "faulttolerance",
    category: "when",
    question: "¿Cuándo debes usar @Retry vs @CircuitBreaker vs @Fallback en MicroProfile Fault Tolerance?",
    code: `// ¿Cuál es el propósito de cada una de estas 3 anotaciones?`,
    options: [
      "@Retry vuelve a intentar un fallo puntual; @CircuitBreaker deja de llamar temporalmente a un servicio que falla repetidamente (fallo rápido); y @Fallback ejecuta un método alternativo cuando la operación fracasa definitivamente",
      "Las tres hacen exactamente lo mismo: llaman a un método de respaldo",
      "@CircuitBreaker reintenta 10 veces seguidas y @Retry abre el circuito por 5 segundos",
      "@Fallback solo funciona si no hay @Retry ni @CircuitBreaker en el método"
    ],
    correct: 0,
    explanation: "Se complementan: '@Retry' absorbe hipos pasajeros; '@CircuitBreaker' protege de caídas prolongadas cortando el paso rápido; y '@Fallback' ofrece el Plan B cuando ni siquiera los reintentos funcionaron o el circuito está abierto.",
    kidTip: "Retry = intenta otra vez | CircuitBreaker = no insistas por un rato | Fallback = entrega el Plan B."
  },
  {
    id: "ft-6",
    module: "faulttolerance",
    category: "annotation",
    question: "En @Retry, ¿qué atributo usas para especificar que SOLO reintente cuando ocurra 'WebApplicationException', pero que ABORTE de inmediato sin reintentar si ocurre 'NotFoundException'?",
    code: `@Retry(
    maxRetries = 3,
    ________________________ = WebApplicationException.class,
    ________________________ = NotFoundException.class
)`,
    options: [
      "retryOn = WebApplicationException.class, abortOn = NotFoundException.class",
      "include = WebApplicationException.class, exclude = NotFoundException.class",
      "onException = WebApplicationException.class, skipOn = NotFoundException.class",
      "catchOn = WebApplicationException.class, ignoreOn = NotFoundException.class"
    ],
    correct: 0,
    explanation: "En '@Retry' los atributos se llaman 'retryOn' (excepciones que disparan reintento) y 'abortOn' (excepciones que cancelan los reintentos inmediatamente). Ojo: en '@Fallback' se llaman 'applyOn' y 'skipOn'.",
    kidTip: "En @Retry es retryOn / abortOn. En @Fallback es applyOn / skipOn."
  },

  // =========================================================================
  // 7. MICROPROFILE HEALTH CHECK (health)
  // =========================================================================
  {
    id: "hc-1",
    module: "health",
    category: "annotation",
    question: "Para crear una sonda de disponibilidad que se exponga en '/q/health/ready', ¿qué anotación debes poner en tu clase y qué interfaz debe implementar?",
    code: `// ¿Qué anotaciones e interfaz faltan aquí?
public class DatabaseHealthCheck implements _______________ {
    @Override
    public HealthCheckResponse call() { ... }
}`,
    options: [
      "@Readiness, @ApplicationScoped e 'implements HealthCheck'",
      "@Liveness, @ApplicationScoped e 'implements HealthProbe'",
      "@ReadyCheck e 'implements MicroProfileHealth'",
      "@Health(type = \"ready\") e 'implements Callable<HealthCheckResponse>'"
    ],
    correct: 0,
    explanation: "Toda sonda de salud en MicroProfile implementa la interfaz 'HealthCheck' (de org.eclipse.microprofile.health.HealthCheck) y lleva '@ApplicationScoped' más '@Readiness' (para /q/health/ready) o '@Liveness' (para /q/health/live).",
    kidTip: "/q/health/ready = @Readiness + @ApplicationScoped + implements HealthCheck."
  },
  {
    id: "hc-2",
    module: "health",
    category: "code",
    question: "Dentro del método 'call()' de un HealthCheck, ¿cómo construyes una respuesta en estado UP llamada 'Weather API check' que incluya el dato adicional 'host' = 'localhost'?",
    code: `@Override
public HealthCheckResponse call() {
    return _______________________________________________________;
}`,
    options: [
      "HealthCheckResponse.named(\"Weather API check\").withData(\"host\", \"localhost\").up().build()",
      "HealthCheckResponse.up(\"Weather API check\", Map.of(\"host\", \"localhost\"))",
      "new HealthCheckResponse(\"Weather API check\", true).addData(\"host\", \"localhost\")",
      "HealthCheckResponse.builder().name(\"Weather API check\").status(\"UP\").data(\"host\", \"localhost\")"
    ],
    correct: 0,
    explanation: "Cuando necesitas agregar datos clave-valor a una sonda de salud, usas 'HealthCheckResponse.named(\"...\").withData(\"k\", \"v\").up().build()' (o '.down().build()').",
    kidTip: "Cadena de 4 eslabones: .named(...) -> .withData(...) -> .up()/.down() -> .build()."
  },
  {
    id: "hc-3",
    module: "health",
    category: "when",
    question: "¿Cuándo debes usar @Liveness (/q/health/live) vs @Readiness (/q/health/ready) vs @Startup (/q/health/started)?",
    code: `// ¿Qué indica cada una de las 3 anotaciones de MicroProfile Health a Kubernetes/OpenShift?`,
    options: [
      "@Startup verifica si la app terminó de arrancar; @Liveness verifica si el proceso sigue vivo (si da DOWN reinicia el pod); y @Readiness verifica si puede atender tráfico ahora (si da DOWN por caída de BD o API externa, deja de enviarle peticiones sin matarlo)",
      "@Liveness verifica la base de datos y @Readiness verifica la memoria RAM",
      "Las tres reinician el contenedor cuando dan DOWN",
      "@Readiness solo se ejecuta una vez al iniciar el contenedor y @Startup cada 5 segundos"
    ],
    correct: 0,
    explanation: "Si un servicio externo o base de datos temporalmente no responde, eso va en '@Readiness' (para no recibir tráfico mientras se recupera, sin reiniciar el contenedor). '@Liveness' es para saber si el propio proceso se quedó colgado.",
    kidTip: "¿Depende de BD o API externa? = @Readiness (/q/health/ready). ¿Sigue vivo mi proceso? = @Liveness (/q/health/live)."
  },

  // =========================================================================
  // 8. MICROMETER METRICS (metrics)
  // =========================================================================
  {
    id: "met-1",
    module: "metrics",
    category: "code",
    question: "Usando la instancia inyectada '@Inject MeterRegistry registry;', ¿cómo incrementas en 1 un contador llamado 'parks.weathercheck.counter'?",
    code: `@Inject
MeterRegistry registry;

public void registrarLlamada() {
    _____________________________________________________;
}`,
    options: [
      "registry.counter(\"parks.weathercheck.counter\").increment();",
      "registry.incrementCounter(\"parks.weathercheck.counter\");",
      "registry.getCounter(\"parks.weathercheck.counter\").add(1);",
      "MeterRegistry.count(\"parks.weathercheck.counter\");"
    ],
    correct: 0,
    explanation: "'registry.counter(\"nombre\")' obtiene (o crea si no existe) el contador en el MeterRegistry, e '.increment()' le suma 1.",
    kidTip: "registry.counter(\"nombre\").increment() -> sacar el contador y darle clic al botón +1."
  },
  {
    id: "met-2",
    module: "metrics",
    category: "code",
    question: "Quieres medir con un Timer programático de Micrometer cuánto tarda en ejecutarse el método 'checkWeatherForPark(park)' usando 'registry.timer(\"weather.timer\")'. ¿Cómo lo envuelves?",
    code: `return registry.timer("weather.timer")
        ._____________________________________________________;`,
    options: [
      "wrap((Supplier<Uni<Void>>) () -> guard.checkWeatherForPark(park)).get()",
      "start(() -> guard.checkWeatherForPark(park))",
      "measure(guard.checkWeatherForPark(park))",
      "time(() -> guard.checkWeatherForPark(park)).build()"
    ],
    correct: 0,
    explanation: "En los laboratorios de DO378 (Cap. 8 y 9), se usa 'registry.timer(\"...\").wrap((Supplier<T>) () -> ...).get()' (o '.record(() -> ...)') para medir el tiempo de ejecución.",
    kidTip: "Envolver con .wrap(...) y ejecutar con .get()."
  },
  {
    id: "met-3",
    module: "metrics",
    category: "when",
    question: "¿Cuándo debes usar un Counter vs un Timer vs un Gauge en Micrometer?",
    code: `// 1. registry.counter("...") o @Counted
// 2. registry.timer("...") o @Timed
// 3. registry.gauge("...", Tags.empty(), this, Clase::metodo)`,
    options: [
      "Counter para valores que solo suben (ej. total de peticiones); Timer para medir duración/latencia de ejecución; y Gauge para observar un valor actual que puede subir y bajar (ej. nivel de alerta o elementos en una lista)",
      "Gauge para contar peticiones HTTP, Counter para medir milisegundos y Timer para medir memoria libre",
      "Los tres sirven únicamente para medir el tiempo de respuesta en segundos",
      "Gauge se llama en cada petición dentro del método @GET igual que increment()"
    ],
    correct: 0,
    explanation: "Counter solo incrementa; Timer mide tiempos y frecuencia; Gauge se registra una sola vez (normalmente en el constructor o '@PostConstruct') apuntando a un método getter cuyo valor sube y baja.",
    kidTip: "Solo sube (+1) = Counter | Mide tiempo = Timer | Sube y baja como termómetro = Gauge."
  },
  {
    id: "met-4",
    module: "metrics",
    category: "annotation",
    question: "Si no quieres usar MeterRegistry por código sino anotar directamente un método para medir su tiempo de ejecución con Micrometer, ¿qué anotación colocas sobre el método?",
    code: `@GET
// ¿Qué anotación de Micrometer mide el tiempo de este método?
public List<Expense> listAll() { ... }`,
    options: [
      "@Timed(value = \"expenses.list.timer\")",
      "@Timer(name = \"expenses.list.timer\")",
      "@Measured(value = \"expenses.list.timer\")",
      "@WithSpan(\"expenses.list.timer\")"
    ],
    correct: 0,
    explanation: "'@Timed' (de io.micrometer.core.annotation.Timed) mide el tiempo y número de ejecuciones del método anotado; '@Counted' (de io.micrometer.core.annotation.Counted) cuenta las invocaciones.",
    kidTip: "Anotación para contar = @Counted. Anotación para cronometrar = @Timed."
  },

  // =========================================================================
  // 9. OPENTELEMETRY TRACING (otel)
  // =========================================================================
  {
    id: "otel-1",
    module: "otel",
    category: "annotation",
    question: "Los endpoints REST ya generan trazas automáticamente con quarkus-opentelemetry. Pero si quieres que un método interno de un bean CDI cree su propio Span hijo dentro de la traza, ¿qué anotación debes ponerle?",
    code: `@ApplicationScoped
public class ParkGuard {
    // ¿Qué anotación crea un nuevo Span para este método en Quarkus 3.8?
    public Uni<Void> checkWeatherForPark(Park park) { ... }
}`,
    options: [
      "@WithSpan",
      "@Traced",
      "@NewSpan",
      "@OpenTelemetrySpan"
    ],
    correct: 0,
    explanation: "En Quarkus 3.8 con OpenTelemetry, se usa '@WithSpan' (de io.opentelemetry.instrumentation.annotations.WithSpan). Ojo: '@Traced' era de la antigua especificación OpenTracing.",
    kidTip: "¡Cuidado con la trampa! En Quarkus 3 es @WithSpan (NUNCA @Traced)."
  },
  {
    id: "otel-2",
    module: "otel",
    category: "annotation",
    question: "Dentro de un método anotado con @WithSpan, quieres que el parámetro 'String city' se guarde como una etiqueta/atributo llamado 'weather.city' dentro del Span en Jaeger. ¿Qué anotación colocas en el parámetro?",
    code: `@WithSpan("check-city-weather")
public void checkCity(_____________________________ String city) {
    ...
}`,
    options: [
      "@SpanAttribute(\"weather.city\")",
      "@TraceParam(\"weather.city\")",
      "@Tag(\"weather.city\")",
      "@PathParam(\"weather.city\")"
    ],
    correct: 0,
    explanation: "'@SpanAttribute' (de io.opentelemetry.instrumentation.annotations.SpanAttribute) adjunta automáticamente el valor del parámetro como atributo del Span creado por '@WithSpan'.",
    kidTip: "Sobre el método va @WithSpan; sobre el parámetro que quieres ver en Jaeger va @SpanAttribute(\"nombre\")."
  },
  {
    id: "otel-3",
    module: "otel",
    category: "code",
    question: "¿Qué propiedad en application.properties define la dirección del colector OTLP (por ejemplo Jaeger en http://localhost:4317) donde Quarkus enviará las trazas de OpenTelemetry?",
    code: `# application.properties
___________________________________________________ = http://localhost:4317`,
    options: [
      "quarkus.otel.exporter.otlp.traces.endpoint",
      "quarkus.jaeger.endpoint",
      "quarkus.opentracing.jaeger.url",
      "mp.otel.collector.url"
    ],
    correct: 0,
    explanation: "'quarkus.otel.exporter.otlp.traces.endpoint' configura el destino donde el exportador OTLP envía las trazas distribuidas.",
    kidTip: "Recuerda la ruta: quarkus.otel -> exporter.otlp -> traces.endpoint."
  },
  {
    id: "otel-4",
    module: "otel",
    category: "code",
    question: "En el Capítulo 8 del curso, te piden incluir el ID de la traza y el ID del span en el formato de logs de consola ('quarkus.log.console.format'). ¿Qué códigos de formato MDC debes usar?",
    code: `quarkus.log.console.format=%d{HH:mm:ss} %-5p traceId=__________, spanId=__________ [%c{2.}] (%t) %s%e%n`,
    options: [
      "%X{traceId} y %X{spanId}",
      "${traceId} y ${spanId}",
      "%t{traceId} y %s{spanId}",
      "%otel{traceId} y %otel{spanId}"
    ],
    correct: 0,
    explanation: "En el patrón de logging de JBoss LogManager en Quarkus, '%X{nombreClave}' imprime cualquier variable guardada en el contexto MDC, donde OpenTelemetry inyecta 'traceId', 'spanId', 'parentId' y 'sampled'.",
    kidTip: "%X mayúscula saca los rayos X de la traza en el log: %X{traceId}, %X{spanId}, %X{sampled}."
  },

  // =========================================================================
  // 10. SEGURIDAD JWT RBAC (jwt)
  // =========================================================================
  {
    id: "jwt-1",
    module: "jwt",
    category: "annotation",
    question: "Quieres que el método 'update(Park park)' en ParksResource solo pueda ser invocado por usuarios cuyo token JWT tenga el grupo 'Admin'. ¿Qué anotación colocas?",
    code: `@PUT
// ¿Qué anotación restringe el acceso al rol Admin?
@Transactional
public void update(Park park) { ... }`,
    options: [
      "@RolesAllowed({ \"Admin\" }) (o @RolesAllowed(\"Admin\"))",
      "@JwtRole(\"Admin\")",
      "@RequiresGroup(\"Admin\")",
      "@PermitOnly(\"Admin\")"
    ],
    correct: 0,
    explanation: "'@RolesAllowed' (de jakarta.annotation.security.RolesAllowed) verifica que el claim 'groups' del token JWT contenga el rol indicado; si no, responde 403 Forbidden (o 401 si no envió token).",
    kidTip: "@RolesAllowed(\"Admin\") es el guardia de seguridad en la puerta del método."
  },
  {
    id: "jwt-2",
    module: "jwt",
    category: "when",
    question: "¿Cuándo debes usar @PermitAll vs @Authenticated vs @RolesAllowed vs @DenyAll en un endpoint de Quarkus?",
    code: `// Cuatro niveles de control de acceso en tus endpoints:`,
    options: [
      "@PermitAll permite acceso público sin token; @Authenticated exige un token válido sin importar el rol; @RolesAllowed exige un token válido que tenga el rol indicado en 'groups'; y @DenyAll rechaza todas las llamadas",
      "@PermitAll exige token válido y @Authenticated no exige token",
      "@RolesAllowed y @Authenticated son idénticos",
      "@DenyAll solo bloquea a usuarios anónimos pero deja pasar al rol Admin"
    ],
    correct: 0,
    explanation: "Es fundamental distinguir '@PermitAll' (abierto incluso a anónimos) de '@Authenticated' (cualquier usuario logueado con JWT válido) y '@RolesAllowed' (usuario logueado que además pertenece a ese grupo específico).",
    kidTip: "Sin token = @PermitAll | Con cualquier token válido = @Authenticated | Con token + grupo específico = @RolesAllowed | Nadie pasa = @DenyAll."
  },
  {
    id: "jwt-3",
    module: "jwt",
    category: "when",
    question: "En application.properties, ¿cuál es la diferencia entre 'mp.jwt.verify.publickey.location' y 'smallrye.jwt.sign.key.location'?",
    code: `mp.jwt.verify.publickey.location = publicKey.pem
smallrye.jwt.sign.key.location = privateKey.pem`,
    options: [
      "'mp.jwt.verify.publickey.location' apunta a la llave PÚBLICA para verificar tokens recibidos, y 'smallrye.jwt.sign.key.location' apunta a la llave PRIVADA para firmar tokens nuevos",
      "Ambas apuntan a la misma llave privada",
      "'mp.jwt.verify...' se usa para crear tokens y 'smallrye.jwt.sign...' para leerlos",
      "Solo se usa una de las dos dependiendo de si es HTTP o HTTPS"
    ],
    correct: 0,
    explanation: "Para FIRMAR un token nuevo con 'Jwt.issuer(...).sign()' necesitas la llave PRIVADA ('smallrye.jwt.sign.key.location'). Para VERIFICAR tokens entrantes en endpoints con '@RolesAllowed' necesitas la llave PÚBLICA ('mp.jwt.verify.publickey.location') y el issuer ('mp.jwt.verify.issuer').",
    kidTip: "sign (firmar) = privateKey.pem | verify (verificar) = publicKey.pem."
  },
  {
    id: "jwt-4",
    module: "jwt",
    category: "code",
    question: "Usando la API 'io.smallrye.jwt.build.Jwt', ¿cómo creas y firmas un token JWT para el usuario (upn) 'jdoe@example.com' con el rol 'Admin' y el emisor 'https://example.com/issuer'?",
    code: `String token = _____________________________________________________;`,
    options: [
      "Jwt.issuer(\"https://example.com/issuer\").upn(\"jdoe@example.com\").groups(Set.of(\"Admin\")).sign()",
      "Jwt.create().withIssuer(\"https://example.com/issuer\").withUser(\"jdoe@example.com\").withRole(\"Admin\").build()",
      "JsonWebToken.builder().issuer(\"https://example.com/issuer\").subject(\"jdoe@example.com\").signWithPrivateKey()",
      "SmallRyeJwt.sign(\"https://example.com/issuer\", \"jdoe@example.com\", \"Admin\")"
    ],
    correct: 0,
    explanation: "La clase 'Jwt' de SmallRye JWT Build tiene métodos fluidos: '.issuer(...)', '.upn(...)', '.groups(...)', '.claim(...)', '.expiresIn(...)' y finaliza firmando con '.sign()'.",
    kidTip: "Recuerda los 4 pasos de la pulsera VIP: Jwt.issuer(...) -> .upn(...) -> .groups(...) -> .sign()."
  },
  {
    id: "jwt-5",
    module: "jwt",
    category: "annotation",
    question: "Dentro de un endpoint protegido, quieres inyectar directamente el valor del claim estándar 'upn' (User Principal Name) del token JWT en un campo String. ¿Qué anotaciones usas?",
    code: `@RequestScoped
@Path("/me")
public class ProfileResource {
    // ¿Cómo inyectas el claim 'upn' del JWT?
    String userUpn;
}`,
    options: [
      "@Inject @Claim(standard = Claims.upn)",
      "@ConfigProperty(name = \"jwt.claims.upn\")",
      "@Inject @HeaderParam(\"upn\")",
      "@JwtClaim(name = \"upn\")"
    ],
    correct: 0,
    explanation: "'@Claim' (de org.eclipse.microprofile.jwt.Claim) permite inyectar un claim individual del JWT usando 'standard = Claims.upn' o 'value = \"nombreClaim\"'.",
    kidTip: "Para inyectar todo el token usas @Inject JsonWebToken; para un solo dato del token usas @Inject @Claim(...)."
  },

  // =========================================================================
  // 11. REACTIVE MESSAGING CON KAFKA (messaging)
  // =========================================================================
  {
    id: "msg-1",
    module: "messaging",
    category: "annotation",
    question: "Un método consumidor de Kafka '@Incoming(\"weather-warnings\")' recibe una alerta y necesita actualizar registros en la base de datos usando Panache clásico ('Park.persist()'). ¿Qué DOS anotaciones adicionales necesita obligatoriamente ese método?",
    code: `@Incoming("weather-warnings")
// ¿Qué DOS anotaciones faltan aquí para poder usar Panache clásico sin errores?
public void processWarning(WeatherWarning warning) {
    Park.closeParksInCity(warning.city);
}`,
    options: [
      "@Blocking y @Transactional",
      "@NonBlocking y @WithSession",
      "@Async y @PersistenceContext",
      "@Broadcast y @Acknowledgment"
    ],
    correct: 0,
    explanation: "Los métodos '@Incoming' corren por defecto en el hilo I/O (Event Loop). Como Panache clásico usa JDBC bloqueante, necesitas '@Blocking' (para ir a un Worker Thread) y '@Transactional' (para abrir la transacción de BD). ¡Olvidar cualquiera de las dos hace fallar el examen!",
    kidTip: "¡Combo salvavidas de Kafka + Base de Datos!: @Incoming + @Blocking + @Transactional."
  },
  {
    id: "msg-2",
    module: "messaging",
    category: "when",
    question: "¿Cuándo debes usar '@Outgoing(\"canal\")' y cuándo debes usar '@Inject @Channel(\"canal\") Emitter<T>' para enviar mensajes a Kafka?",
    code: `// Dos formas de enviar mensajes hacia un canal de salida en Quarkus:
// Forma A: @Outgoing("warnings-out")
// Forma B: @Inject @Channel("warnings-out") Emitter<WeatherWarning> emitter;`,
    options: [
      "@Outgoing se coloca sobre un MÉTODO que produce un flujo automático o transforma mensajes entrantes (@Incoming -> @Outgoing); mientras que @Channel + Emitter<T> se inyecta en un CAMPO para enviar mensajes manualmente (emitter.send(...)) cuando alguien llama a un endpoint REST o servicio",
      "@Outgoing se pone sobre el campo Emitter<T> y @Channel se pone sobre el método",
      "@Channel solo sirve para recibir mensajes y @Outgoing solo para enviar",
      "Son equivalentes y ambos pueden ponerse sobre campos o métodos indistintamente"
    ],
    correct: 0,
    explanation: "Si quieres disparar un mensaje dentro de un '@POST' REST o método imperativo, inyectas '@Inject @Channel(\"nombre\") Emitter<T>' y llamas a 'emitter.send(dato)'. '@Outgoing' solo se coloca sobre métodos que el framework invoca reactivamente.",
    kidTip: "Sobre un MÉTODO va @Outgoing; sobre un CAMPO Emitter<T> va @Inject @Channel."
  },
  {
    id: "msg-3",
    module: "messaging",
    category: "code",
    question: "Necesitas crear un deserializador JSON en Quarkus para que Kafka convierta los mensajes entrantes a tu clase 'WeatherWarning'. ¿De qué clase de Quarkus debes heredar?",
    code: `public class WeatherWarningDeserializer extends _____________________________________ {
    public WeatherWarningDeserializer() {
        super(WeatherWarning.class);
    }
}`,
    options: [
      "ObjectMapperDeserializer<WeatherWarning>",
      "JsonbDeserializer<WeatherWarning>",
      "KafkaJsonDeserializer<WeatherWarning>",
      "SmallRyeDeserializer<WeatherWarning>"
    ],
    correct: 0,
    explanation: "Con Jackson ('quarkus-resteasy-reactive-jackson'), Quarkus provee 'io.quarkus.kafka.client.serialization.ObjectMapperSerializer' para enviar y la superclase 'ObjectMapperDeserializer<T>' para recibir.",
    kidTip: "Para deserializar con Jackson en Kafka: extends ObjectMapperDeserializer<TuClase> y llamas a super(TuClase.class)."
  },
  {
    id: "msg-4",
    module: "messaging",
    category: "code",
    question: "¿Cómo configuras en application.properties que el canal de entrada '@Incoming(\"warnings-in\")' use el conector de Kafka y lea del topic 'weather-events'?",
    code: `# application.properties`,
    options: [
      "mp.messaging.incoming.warnings-in.connector=smallrye-kafka y mp.messaging.incoming.warnings-in.topic=weather-events",
      "quarkus.kafka.incoming.warnings-in.topic=weather-events",
      "mp.kafka.consumer.warnings-in.topic=weather-events",
      "smallrye.messaging.warnings-in.kafka.topic=weather-events"
    ],
    correct: 0,
    explanation: "MicroProfile Reactive Messaging usa el prefijo 'mp.messaging.incoming.<nombre-canal>.*' para canales de entrada y 'mp.messaging.outgoing.<nombre-canal>.*' para canales de salida, con 'connector=smallrye-kafka'.",
    kidTip: "Fórmula de memoria: mp.messaging.[incoming|outgoing].<nombre-canal>.connector=smallrye-kafka"
  },
  {
    id: "msg-5",
    module: "messaging",
    category: "annotation",
    question: "Tienes un método procesador que escucha mensajes del canal 'raw-data', los transforma y envía el resultado directamente al canal 'clean-data'. ¿Qué par de anotaciones colocas sobre ese método?",
    code: `@ApplicationScoped
public class DataProcessor {
    // ¿Qué DOS anotaciones conectan la entrada con la salida en este método?
    public CleanData process(RawData input) {
        return input.sanitize();
    }
}`,
    options: [
      "@Incoming(\"raw-data\") y @Outgoing(\"clean-data\")",
      "@Channel(\"raw-data\") y @Channel(\"clean-data\")",
      "@Consume(\"raw-data\") y @Produce(\"clean-data\")",
      "@Incoming(\"raw-data\") y @Channel(\"clean-data\")"
    ],
    correct: 0,
    explanation: "Un método procesador (processor) que transforma cada mensaje recibido y emite el valor retornado lleva simultáneamente '@Incoming(\"entrada\")' y '@Outgoing(\"salida\")'.",
    kidTip: "Entra por @Incoming(\"A\"), se transforma en el método y sale por @Outgoing(\"B\")."
  }
];

// ============================================================================
// EXPANSIÓN AUTOMÁTICA DE PREGUNTAS PERSISTENTES DE ANOTACIONES (120+ Preguntas)
// Cada anotación del diccionario genera 3 preguntas con ID fijo (para que si
// fallas cualquiera de ellas, entre a tu Cola de Repetición Espaciada):
//   1. [SINTAXIS EXACTA]: ¿Qué anotación debes escribir cuando necesitas...?
//   2. [CUÁNDO USARLA]: ¿Cuándo debes usar esta anotación y dónde se coloca?
//   3. [CÓDIGO REAL]: ¿Qué anotación falta en este fragmento de código?
// ============================================================================
(function expandAnnotationQuestions() {
  const allWhenOptions = window.ANNOTATION_DICTIONARY.map(
    a => "[" + a.targetPlace + "] — " + a.whenToUse
  );

  window.ANNOTATION_DICTIONARY.forEach((item, idx) => {
    // 1. Pregunta de Escenario -> Elegir la Anotación Exacta
    window.QUESTION_BANK.push({
      id: "ann-syn-" + idx,
      module: item.module,
      category: "annotation",
      question: "🏷️ [Memorizar Anotación] ¿Cuál es la anotación o sintaxis EXACTA que debes escribir en este caso?",
      code: `// ¿CUÁNDO SE USA?:\n// ${item.whenToUse}\n//\n// ¿DÓNDE SE COLOCA?: ${item.targetPlace}\n// ATRIBUTOS CLAVE: ${item.attributes}`,
      options: [item.annotation].concat(item.distractors),
      correct: 0,
      explanation: "Se usa '" + item.annotation + "' (" + item.targetPlace + "). " + item.trapOrVs,
      kidTip: "Dónde va: " + item.targetPlace + " | Atributos: " + item.attributes
    });

    // 2. Pregunta de Anotación -> ¿Cuándo usarla y dónde colocarla?
    const correctWhen = "[" + item.targetPlace + "] — " + item.whenToUse;
    const otherSameModule = window.ANNOTATION_DICTIONARY
      .filter((other, oIdx) => oIdx !== idx && other.module === item.module)
      .map(other => "[" + other.targetPlace + "] — " + other.whenToUse);
    const otherAnyModule = window.ANNOTATION_DICTIONARY
      .filter((other, oIdx) => oIdx !== idx && other.module !== item.module)
      .map(other => "[" + other.targetPlace + "] — " + other.whenToUse);

    const distractorWhens = otherSameModule.concat(otherAnyModule).slice(0, 3);

    window.QUESTION_BANK.push({
      id: "ann-when-" + idx,
      module: item.module,
      category: "when",
      question: "🧭 [¿Cuándo usar esta anotación?] ¿Dónde se coloca y en qué situación del examen debes usar la siguiente anotación?",
      code: `${item.annotation}\n\n// Ejemplo en contexto:\n${item.example}`,
      options: [correctWhen].concat(distractorWhens),
      correct: 0,
      explanation: "'" + item.annotation + "' se coloca " + item.targetPlace.toLowerCase() + ". " + item.whenToUse,
      kidTip: "⚠️ Ojo en el examen: " + item.trapOrVs
    });

    // 3. Pregunta de Completar el Hueco en el Código de Ejemplo
    const headAnnotation = item.annotation.split("(")[0].split(" ")[0].trim();
    let maskedExample = item.example;
    if (headAnnotation.startsWith("@") && maskedExample.includes(headAnnotation)) {
      maskedExample = maskedExample.replace(headAnnotation, "/* TODO: ¿QUÉ ANOTACIÓN VA AQUÍ? */");
    } else {
      maskedExample = "// TODO: Completa con la expresión/anotación correcta:\n" + item.example;
    }

    window.QUESTION_BANK.push({
      id: "ann-code-" + idx,
      module: item.module,
      category: "annotation",
      question: "🧩 [Completar Código de Examen] ¿Qué anotación o instrucción completa correctamente el TODO para cumplir: \"" + item.whenToUse + "\"?",
      code: maskedExample,
      options: [item.annotation].concat(item.distractors),
      correct: 0,
      explanation: "En este código va '" + item.annotation + "'. Recuerda: " + item.trapOrVs,
      kidTip: "Ubicación: " + item.targetPlace
    });
  });
})();

// ============================================================================
// BLOQUE ADICIONAL 1: +15 PREGUNTAS DE ANOTACIONES POR SECCIÓN (Secciones 1 a 6)
// ============================================================================
window.QUESTION_BANK.push(
  // -------------------------------------------------------------------------
  // SECCIÓN 1: CONFIGURACIÓN (config) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "cfg-ann-11",
    module: "config",
    category: "annotation",
    question: "¿Qué anotación colocas sobre un argumento del constructor de un bean CDI para inyectar la propiedad 'store.max-items'?",
    code: `@ApplicationScoped
public class StoreService {
    private final int maxItems;

    public StoreService(________________________________ int maxItems) {
        this.maxItems = maxItems;
    }
}`,
    options: [
      "@ConfigProperty(name = \"store.max-items\")",
      "@WithName(\"store.max-items\")",
      "@InjectProperty(\"store.max-items\")",
      "@Value(\"${store.max-items}\")"
    ],
    correct: 0,
    explanation: "'@ConfigProperty' se puede usar tanto sobre campos como directamente sobre parámetros de un constructor en un bean CDI.",
    kidTip: "En constructores también usas @ConfigProperty(name = \"...\") delante del parámetro."
  },
  {
    id: "cfg-ann-12",
    module: "config",
    category: "when",
    question: "Dentro de una interfaz @ConfigMapping(prefix = \"store\"), necesitas que el método 'int maxItems()' tenga un valor por defecto de 50. ¿Por qué NO debes poner @ConfigProperty(defaultValue = \"50\") ahí?",
    code: `@ConfigMapping(prefix = "store")
public interface StoreConfig {
    // ¿Qué anotación va aquí?
    int maxItems();
}`,
    options: [
      "Porque dentro de una interfaz @ConfigMapping debes usar @WithDefault(\"50\") de SmallRye Config, no @ConfigProperty",
      "Porque los métodos int no aceptan valores por defecto",
      "Porque en las interfaces se usa @DefaultValue(\"50\") de Jakarta REST",
      "Porque el valor por defecto solo se puede poner en application.properties"
    ],
    correct: 0,
    explanation: "'@ConfigProperty' es para inyección individual en clases CDI. Dentro de interfaces '@ConfigMapping' siempre se usa '@WithDefault(\"...\")'.",
    kidTip: "Dentro de interface @ConfigMapping -> usa siempre la familia @With (@WithDefault, @WithName)."
  },
  {
    id: "cfg-ann-13",
    module: "config",
    category: "annotation",
    question: "En una interfaz @ConfigMapping(prefix = \"app\"), tienes el método 'String env()' pero en application.properties la propiedad se llama 'app.environment-name'. ¿Qué anotación colocas sobre 'String env()'?",
    code: `@ConfigMapping(prefix = "app")
public interface AppConfig {
    // ¿Qué anotación mapea este método a 'app.environment-name'?
    String env();
}`,
    options: [
      "@WithName(\"environment-name\")",
      "@WithName(\"app.environment-name\")",
      "@ConfigProperty(name = \"environment-name\")",
      "@Named(\"environment-name\")"
    ],
    correct: 0,
    explanation: "'@WithName' especifica el nombre relativo bajo el prefijo 'app' (por tanto solo pones 'environment-name', sin repetir 'app.').",
    kidTip: "En @WithName solo escribes el apellido de la propiedad, porque el prefijo ya está arriba en @ConfigMapping."
  },
  {
    id: "cfg-ann-14",
    module: "config",
    category: "annotation",
    question: "Quieres cambiar la estrategia de nombres de una interfaz @ConfigMapping para que NO convierta camelCase a kebab-case, sino que busque los nombres tal cual (VERBATIM). ¿Cómo lo anotas?",
    code: `// ¿Cómo configuras la estrategia VERBATIM en @ConfigMapping?
public interface LegacyConfig {
    String myCustomProp(); // buscará legacy.myCustomProp
}`,
    options: [
      "@ConfigMapping(prefix = \"legacy\", namingStrategy = ConfigMapping.NamingStrategy.VERBATIM)",
      "@ConfigMapping(prefix = \"legacy\", exactNames = true)",
      "@ConfigMapping(prefix = \"legacy\", strategy = \"camelCase\")",
      "@VerbatimConfig @ConfigMapping(prefix = \"legacy\")"
    ],
    correct: 0,
    explanation: "El atributo 'namingStrategy' de '@ConfigMapping' acepta 'KEBAB_CASE' (por defecto), 'VERBATIM' (tal cual el nombre del método) o 'SNAKE_CASE' (guiones bajos).",
    kidTip: "namingStrategy = ConfigMapping.NamingStrategy.VERBATIM respeta mayúsculas sin poner guiones."
  },
  {
    id: "cfg-ann-15",
    module: "config",
    category: "when",
    question: "¿Cuándo debes usar 'Provider<String>' o 'Supplier<String>' junto con '@ConfigProperty(name = \"...\")'?",
    code: `@ConfigProperty(name = "dynamic.feature.flag")
Provider<Boolean> featureFlag;`,
    options: [
      "Cuando necesitas que el valor de la propiedad se evalúe dinámicamente en cada llamada (featureFlag.get()) o retrasar su lectura hasta que se invoque",
      "Cuando la propiedad es un arreglo de números enteros",
      "Cuando estás dentro de una interfaz @ConfigMapping",
      "Nunca, Provider no es compatible con @ConfigProperty"
    ],
    correct: 0,
    explanation: "Inyectar 'Provider<T>' con '@ConfigProperty' permite leer el valor bajo demanda cada vez que se invoca 'provider.get()' en lugar de fijarlo solo al crear el bean.",
    kidTip: "Provider<T> con @ConfigProperty lee el valor fresco cada vez que haces .get()."
  },
  {
    id: "cfg-ann-16",
    module: "config",
    category: "annotation",
    question: "En application.properties tienes 'shop.tags = java,quarkus,cloud'. ¿Cómo declaras el campo con @ConfigProperty para recibir los 3 elementos como una lista?",
    code: `@ApplicationScoped
public class ShopService {
    @ConfigProperty(name = "shop.tags")
    // ¿Qué tipo de campo convierte automáticamente valores separados por coma?
    ______________________ tags;
}`,
    options: [
      "List<String> (o Set<String> / String[])",
      "Map<Integer, String>",
      "CommaSeparatedList<String>",
      "ConfigList<String>"
    ],
    correct: 0,
    explanation: "MicroProfile Config convierte automáticamente valores separados por coma (',') en 'List<T>', 'Set<T>' o arreglos 'T[]'.",
    kidTip: "Comas en application.properties (a,b,c) se inyectan directo en un List<String>."
  },
  {
    id: "cfg-ann-17",
    module: "config",
    category: "annotation",
    question: "Si quieres inyectar el objeto completo 'Config' de MicroProfile dentro de un bean CDI (en vez de llamar a ConfigProvider.getConfig()), ¿qué anotación usas?",
    code: `@ApplicationScoped
public class AuditHelper {
    // ¿Qué anotación inyecta el objeto Config completo?
    org.eclipse.microprofile.config.Config config;
}`,
    options: [
      "@Inject",
      "@ConfigProperty",
      "@ConfigMapping",
      "@Context"
    ],
    correct: 0,
    explanation: "El objeto 'org.eclipse.microprofile.config.Config' es un bean CDI registrado por Quarkus y se inyecta directamente con '@Inject'.",
    kidTip: "El objeto Config entero se pide con @Inject; una propiedad suelta se pide con @ConfigProperty."
  },
  {
    id: "cfg-ann-18",
    module: "config",
    category: "when",
    question: "En una interfaz @ConfigMapping(prefix = \"server\"), tienes una sub-interfaz anidada 'HostConfig host();' para agrupar 'server.host.ip' y 'server.host.port'. ¿Debes poner @ConfigMapping también sobre la sub-interfaz 'HostConfig'?",
    code: `@ConfigMapping(prefix = "server")
public interface ServerConfig {
    HostConfig host();

    // ¿Lleva @ConfigMapping esta sub-interfaz?
    interface HostConfig {
        String ip();
        int port();
    }
}`,
    options: [
      "No es necesario; los grupos anidados dentro de una interfaz @ConfigMapping se mapean automáticamente usando el nombre del método ('host.') como sub-prefijo",
      "Sí, es obligatorio poner @ConfigMapping(prefix = \"server.host\") en la sub-interfaz",
      "Debes poner @Entity sobre la sub-interfaz",
      "Las interfaces @ConfigMapping no permiten interfaces anidadas"
    ],
    correct: 0,
    explanation: "En SmallRye '@ConfigMapping', cualquier método que retorne otra interfaz se trata automáticamente como un grupo anidado de propiedades ('server.host.ip').",
    kidTip: "Solo la interfaz raíz lleva @ConfigMapping(prefix = ...); las sub-interfaces internas no lo necesitan."
  },
  {
    id: "cfg-ann-19",
    module: "config",
    category: "annotation",
    question: "¿Qué anotación de SmallRye Config colocas sobre un método en una interfaz @ConfigMapping cuando quieres mapear todas las propiedades directamente desde la raíz del prefijo (por ejemplo en un Map<String, String>) sin agregar el nombre del método a la clave?",
    code: `@ConfigMapping(prefix = "labels")
public interface LabelsConfig {
    // ¿Qué anotación evita que busque 'labels.all.*' y lea directo 'labels.*'?
    Map<String, String> all();
}`,
    options: [
      "@WithParentName",
      "@WithRootPrefix",
      "@IgnoreMethodName",
      "@Flatten"
    ],
    correct: 0,
    explanation: "'@WithParentName' indica a SmallRye Config que use el nombre del prefijo padre ('labels') sin añadir el nombre del método ('all').",
    kidTip: "@WithParentName = usa el nombre de mi papá (el prefijo) e ignora mi propio nombre de método."
  },
  {
    id: "cfg-ann-20",
    module: "config",
    category: "when",
    question: "¿Por qué falla Quarkus con el error 'SRCFG00050: prop in PropertiesConfigSource does not map to any root' cuando usas @ConfigMapping(prefix = \"billing\")?",
    code: `// En application.properties existen:
// billing.currency = USD
// billing.extra-flag = true
// Pero en BillingConfig solo declaraste 'String currency();'`,
    options: [
      "Porque @ConfigMapping valida estrictamente que TODA propiedad en application.properties que empiece con 'billing.' tenga su método correspondiente en la interfaz",
      "Porque @ConfigMapping no soporta booleanos",
      "Porque falta @ApplicationScoped en la interfaz BillingConfig",
      "Porque el prefijo 'billing' es una palabra reservada de Quarkus"
    ],
    correct: 0,
    explanation: "Por defecto, '@ConfigMapping' verifica que no existan propiedades huérfanas bajo ese prefijo en 'application.properties'. Debes agregar el método en la interfaz.",
    kidTip: "Con @ConfigMapping no dejes propiedades sueltas con ese prefijo en application.properties sin su método en la interfaz."
  },
  {
    id: "cfg-ann-21",
    module: "config",
    category: "annotation",
    question: "Quieres convertir automáticamente una propiedad String de application.properties (ej. '20M' o 'PT15M') en un objeto 'java.time.Duration' usando @ConfigProperty. ¿Qué anotación adicional necesitas?",
    code: `@ConfigProperty(name = "session.timeout", defaultValue = "PT15M")
Duration sessionTimeout;`,
    options: [
      "Ninguna anotación adicional; MicroProfile Config incluye convertidores automáticos para Duration, LocalDate, Optional, List y tipos primitivos",
      "@ConvertWith(DurationConverter.class)",
      "@Temporal(TemporalType.DURATION)",
      "@DurationFormat(\"ISO-8601\")"
    ],
    correct: 0,
    explanation: "MicroProfile Config convierte de serie tipos como 'Duration' (en formato ISO-8601 o corto de Quarkus como '15m', '10s'), 'Optional<T>', 'List<T>', 'URL', etc.",
    kidTip: "@ConfigProperty convierte solito a Duration, int, boolean, double, List<String> y Optional<T>."
  },
  {
    id: "cfg-ann-22",
    module: "config",
    category: "annotation",
    question: "Si una clase tiene campos con '@ConfigProperty' pero olvidaste ponerle una anotación de alcance CDI (como '@ApplicationScoped') y no es un Resource REST, ¿qué ocurre al intentar inyectar esa clase?",
    code: `// Clase sin @ApplicationScoped ni @Singleton:
public class TaxCalculator {
    @ConfigProperty(name = "tax.rate", defaultValue = "0.16")
    double rate;
}`,
    options: [
      "Falla con UnsatisfiedResolutionException al inyectar TaxCalculator porque sin anotación de ámbito (@ApplicationScoped / @Singleton / @Dependent) no es un bean CDI descubierto",
      "Se convierte automáticamente en un endpoint REST",
      "Quarkus la registra como un cliente Kafka",
      "Funciona como una entidad de base de datos"
    ],
    correct: 0,
    explanation: "En Quarkus (ArC), las clases de servicio requieren una anotación que las defina como bean CDI (como '@ApplicationScoped') para poder ser inyectadas y recibir '@ConfigProperty'.",
    kidTip: "Toda clase de servicio donde uses @ConfigProperty o @Inject debe llevar @ApplicationScoped."
  },
  {
    id: "cfg-ann-23",
    module: "config",
    category: "when",
    question: "¿Cuál es la diferencia al declarar una propiedad opcional en una clase con @ConfigProperty frente a declararla en una interfaz con @ConfigMapping?",
    code: `// Caso A (Clase): @ConfigProperty(name = "a.b") Optional<String> val;
// Caso B (Interfaz @ConfigMapping): Optional<String> b();`,
    options: [
      "En ambos casos basta con envolver el tipo en Optional<String>; en la interfaz @ConfigMapping ni siquiera necesitas poner ninguna anotación extra sobre el método",
      "En @ConfigMapping debes poner @OptionalProperty sobre el método",
      "En @ConfigMapping no se puede usar Optional<T>",
      "En @ConfigProperty Optional<T> sigue lanzando error al arrancar si no existe la propiedad"
    ],
    correct: 0,
    explanation: "Tanto en '@ConfigProperty' como en '@ConfigMapping', usar el tipo de retorno/campo 'Optional<T>' (o 'OptionalInt', 'OptionalDouble') marca la propiedad como opcional sin requerir valor por defecto.",
    kidTip: "Optional<String> es el escudo universal contra propiedades que no existen en application.properties."
  },
  {
    id: "cfg-ann-24",
    module: "config",
    category: "annotation",
    question: "¿Qué paquete debes importar para usar la anotación '@ConfigProperty' en Quarkus?",
    code: `import ___________________________________________.ConfigProperty;`,
    options: [
      "org.eclipse.microprofile.config.inject",
      "io.smallrye.config",
      "jakarta.enterprise.inject",
      "io.quarkus.arc.config"
    ],
    correct: 0,
    explanation: "'@ConfigProperty' proviene del estándar MicroProfile Config ('org.eclipse.microprofile.config.inject.ConfigProperty'), mientras que '@ConfigMapping', '@WithName' y '@WithDefault' vienen de 'io.smallrye.config'.",
    kidTip: "@ConfigProperty = org.eclipse.microprofile.config.inject | @ConfigMapping = io.smallrye.config."
  },
  {
    id: "cfg-ann-25",
    module: "config",
    category: "annotation",
    question: "¿Qué paquete debes importar para usar '@ConfigMapping', '@WithName' y '@WithDefault'?",
    code: `import _________________________.ConfigMapping;
import _________________________.WithDefault;
import _________________________.WithName;`,
    options: [
      "io.smallrye.config",
      "org.eclipse.microprofile.config.inject",
      "jakarta.ws.rs",
      "io.quarkus.runtime.annotations"
    ],
    correct: 0,
    explanation: "Las tres anotaciones ('@ConfigMapping', '@WithDefault', '@WithName') pertenecen al paquete 'io.smallrye.config'.",
    kidTip: "Todo lo de @ConfigMapping y @With... vive en io.smallrye.config."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 2: RESTEASY REACTIVE Y JAKARTA REST (rest) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "rest-ann-10",
    module: "rest",
    category: "annotation",
    question: "En RESTEasy Reactive, además del estándar '@PathParam(\"id\")', ¿qué anotación simplificada de Quarkus puedes usar que ni siquiera requiere escribir el nombre \"id\" si el parámetro Java ya se llama 'id'?",
    code: `@GET
@Path("/{id}")
public Book get(_____________ Long id) { ... }`,
    options: [
      "@RestPath",
      "@AutoPath",
      "@PathVar",
      "@Param"
    ],
    correct: 0,
    explanation: "RESTEasy Reactive ofrece '@RestPath', '@RestQuery', '@RestHeader', '@RestForm', '@RestCookie' y '@RestMatrix' (de org.jboss.resteasy.reactive), que infieren el nombre directamente del parámetro Java.",
    kidTip: "Estándar Jakarta = @PathParam(\"id\") | Atajo RESTEasy Reactive = @RestPath."
  },
  {
    id: "rest-ann-11",
    module: "rest",
    category: "when",
    question: "¿Cuál es la equivalencia entre las anotaciones estándar de Jakarta REST y las de RESTEasy Reactive para parámetros HTTP?",
    code: `// Estándar Jakarta REST vs Atajos RESTEasy Reactive`,
    options: [
      "@PathParam = @RestPath | @QueryParam = @RestQuery | @HeaderParam = @RestHeader",
      "@PathParam = @RestQuery | @QueryParam = @RestPath | @HeaderParam = @Header",
      "@PathParam es para GET y @RestPath es solo para POST",
      "@RestPath solo funciona en interfaces @ConfigMapping"
    ],
    correct: 0,
    explanation: "Ambas familias funcionan en Quarkus 3.8: las de 'jakarta.ws.rs' (@PathParam, @QueryParam, @HeaderParam) y las de 'org.jboss.resteasy.reactive' (@RestPath, @RestQuery, @RestHeader).",
    kidTip: "Reconoce ambas en el examen: @PathParam/@RestPath, @QueryParam/@RestQuery, @HeaderParam/@RestHeader."
  },
  {
    id: "rest-ann-12",
    module: "rest",
    category: "annotation",
    question: "En RESTEasy Reactive, quieres que un método @POST que devuelve directamente el objeto 'Book' responda con código HTTP 201 Created sin tener que envolverlo en 'Response.status(201)'. ¿Qué anotación colocas sobre el método?",
    code: `@POST
// ¿Qué anotación fija el código HTTP de éxito a 201?
public Book create(Book b) {
    return service.save(b);
}`,
    options: [
      "@ResponseStatus(201) (de org.jboss.resteasy.reactive.ResponseStatus)",
      "@Status(201)",
      "@HttpCode(201)",
      "@Created"
    ],
    correct: 0,
    explanation: "'@ResponseStatus(201)' (o RestResponse.StatusCode.CREATED) cambia el código HTTP por defecto (200) de un método en RESTEasy Reactive.",
    kidTip: "Si no necesitas armar cabeceras dinámicas, @ResponseStatus(201) cambia el código HTTP automáticamente."
  },
  {
    id: "rest-ann-13",
    module: "rest",
    category: "annotation",
    question: "Si un método REST recibe datos de un formulario HTML ('application/x-www-form-urlencoded'), ¿qué anotación usas en el parámetro para leer el campo 'username' del formulario?",
    code: `@POST
@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
public Response login(_______________________ String username) { ... }`,
    options: [
      "@FormParam(\"username\") (o @RestForm)",
      "@QueryParam(\"username\")",
      "@PathParam(\"username\")",
      "@BodyParam(\"username\")"
    ],
    correct: 0,
    explanation: "Los campos enviados en el cuerpo de un formulario se extraen con '@FormParam(\"nombre\")' (de jakarta.ws.rs.FormParam) o '@RestForm'.",
    kidTip: "En URL /ruta/{x} = @PathParam | En ?x=1 = @QueryParam | En formulario = @FormParam."
  },
  {
    id: "rest-ann-14",
    module: "rest",
    category: "annotation",
    question: "Necesitas leer el valor de una cookie llamada 'session_id' enviada por el navegador a tu endpoint REST. ¿Qué anotación colocas en el parámetro del método?",
    code: `@GET
public Response profile(_______________________ String sessionId) { ... }`,
    options: [
      "@CookieParam(\"session_id\") (o @RestCookie)",
      "@HeaderParam(\"session_id\")",
      "@QueryParam(\"session_id\")",
      "@SessionParam(\"session_id\")"
    ],
    correct: 0,
    explanation: "'@CookieParam(\"session_id\")' extrae directamente el valor de la cookie indicada desde la petición HTTP.",
    kidTip: "Para leer una cookie por su nombre: @CookieParam(\"nombre\")."
  },
  {
    id: "rest-ann-15",
    module: "rest",
    category: "when",
    question: "En una clase Resource de Quarkus con RESTEasy Reactive, si NO pones ninguna anotación de ámbito (@ApplicationScoped / @RequestScoped), ¿cómo la trata Quarkus por defecto?",
    code: `@Path("/books")
public class BookResource {
    ...
}`,
    options: [
      "Quarkus la registra automáticamente como un bean CDI (con ámbito @RequestScoped por defecto, o @Singleton/@ApplicationScoped si la anotas explícitamente)",
      "Quarkus ignora la clase y devuelve 404 en todas las rutas",
      "Falla al compilar exigiendo @Controller",
      "La convierte en una interfaz @ConfigMapping"
    ],
    correct: 0,
    explanation: "La anotación '@Path' sobre una clase es una 'bean defining annotation' en Quarkus: convierte automáticamente la clase en un bean CDI sin obligarte a escribir '@RequestScoped'.",
    kidTip: "@Path por sí sola ya registra el Resource como bean CDI en Quarkus."
  },
  {
    id: "rest-ann-16",
    module: "rest",
    category: "annotation",
    question: "Quieres agrupar 4 parámetros (@QueryParam, @HeaderParam, @PathParam) dentro de una clase contenedora 'PageFilter' para no tener 4 argumentos sueltos en tu método @GET. ¿Qué anotación colocas delante de 'PageFilter filter' en el método @GET?",
    code: `@GET
public List<Book> search(_____________ PageFilter filter) {
    return service.find(filter);
}`,
    options: [
      "@BeanParam",
      "@QueryParam",
      "@Context",
      "@FormParam"
    ],
    correct: 0,
    explanation: "'@BeanParam' (de jakarta.ws.rs.BeanParam) permite inyectar un objeto Java cuyos campos internos están anotados con '@QueryParam', '@PathParam' o '@HeaderParam'.",
    kidTip: "Muchos @QueryParam/@HeaderParam agrupados dentro de una clase = @BeanParam."
  },
  {
    id: "rest-ann-17",
    module: "rest",
    category: "when",
    question: "En RESTEasy Reactive, tienes dos métodos en tu Resource:\n1) `public List<Book> getAllSync()`\n2) `public Uni<List<Book>> getAllReactive()`\nSin poner @Blocking ni @NonBlocking, ¿en qué hilo se ejecuta cada uno por defecto?",
    code: `@GET @Path("/sync")
public List<Book> getAllSync() { ... }

@GET @Path("/reactive")
public Uni<List<Book>> getAllReactive() { ... }`,
    options: [
      "getAllSync() corre en un Worker Thread (bloqueante) porque retorna List<Book>; getAllReactive() corre en el Event Loop (I/O Thread no bloqueante) porque retorna Uni<...>",
      "Ambos corren en el Event Loop (I/O Thread)",
      "Ambos corren en un Worker Thread",
      "getAllSync() corre en el Event Loop y getAllReactive() en un Worker Thread"
    ],
    correct: 0,
    explanation: "En RESTEasy Reactive la firma determina el hilo por defecto: retornos síncronos van a Worker Thread; retornos reactivos ('Uni<T>', 'Multi<T>', 'CompletionStage<T>') van al Event Loop I/O Thread.",
    kidTip: "Retorno normal (List, Book, Response) = Worker Thread. Retorno Uni/Multi = Event Loop (y si usa BD clásica, requiere @Blocking)."
  },
  {
    id: "rest-ann-18",
    module: "rest",
    category: "annotation",
    question: "Si un método REST emite un flujo continuo de eventos (Server-Sent Events) retornando 'Multi<WeatherWarning>', ¿qué anotación '@Produces' debes colocar sobre el método?",
    code: `@GET
@Path("/stream")
// ¿Qué tipo MediaType indica un stream Server-Sent Events?
public Multi<WeatherWarning> streamWarnings() { ... }`,
    options: [
      "@Produces(MediaType.SERVER_SENT_EVENTS)",
      "@Produces(MediaType.APPLICATION_OCTET_STREAM)",
      "@Produces(MediaType.MULTIPART_FORM_DATA)",
      "@Produces(MediaType.TEXT_HTML)"
    ],
    correct: 0,
    explanation: "Para enviar un flujo reactivo 'Multi<T>' mediante Server-Sent Events (SSE), se anota el método con '@Produces(MediaType.SERVER_SENT_EVENTS)'.",
    kidTip: "Multi<T> en HTTP streaming = @Produces(MediaType.SERVER_SENT_EVENTS)."
  },
  {
    id: "rest-ann-19",
    module: "rest",
    category: "annotation",
    question: "Quieres restringir en '@Path(\"/{id}\")' que el parámetro 'id' de la URL SOLO haga match si está compuesto exclusivamente por dígitos numéricos (expresión regular \\d+). ¿Cuál es la sintaxis correcta en @Path?",
    code: `@GET
// ¿Cómo agregas una expresión regular al parámetro {id} en @Path?
public Book getByNumericId(@PathParam("id") Long id) { ... }`,
    options: [
      "@Path(\"/{id:\\\\d+}\")",
      "@Path(\"/{id}[0-9]+\")",
      "@Path(value = \"/{id}\", regex = \"\\\\d+\")",
      "@Path(\"/{id?number}\")"
    ],
    correct: 0,
    explanation: "Jakarta REST permite especificar una expresión regular dentro de las llaves después de dos puntos: '@Path(\"/{nombreParametro:regex}\")'.",
    kidTip: "En @Path, dos puntos dentro de la llave significan filtro regex: {id:\\d+}."
  },
  {
    id: "rest-ann-20",
    module: "rest",
    category: "when",
    question: "¿Qué ocurre si pones '@Produces(MediaType.APPLICATION_JSON)' a nivel de la clase Resource, pero en un método específico '@GET @Path(\"/status\")' pones '@Produces(MediaType.TEXT_PLAIN)'?",
    code: `@Path("/service")
@Produces(MediaType.APPLICATION_JSON)
public class ServiceResource {
    @GET
    @Path("/status")
    @Produces(MediaType.TEXT_PLAIN)
    public String status() { return "OK"; }
}`,
    options: [
      "La anotación @Produces sobre el método tiene prioridad y sobrescribe la de la clase para ese endpoint específico",
      "Quarkus lanza un error de compilación por conflicto de @Produces",
      "La anotación de la clase gana siempre e ignora la del método",
      "El método devuelve ambos formatos mezclados"
    ],
    correct: 0,
    explanation: "En Jakarta REST, las anotaciones '@Produces' y '@Consumes' a nivel de método sobrescriben las definidas a nivel de clase.",
    kidTip: "La anotación más cercana al método siempre manda sobre la de la clase."
  },
  {
    id: "rest-ann-21",
    module: "rest",
    category: "annotation",
    question: "Si usas la variante clásica de Jakarta REST para crear un manejador global de excepciones ('implements ExceptionMapper<MyException>'), ¿qué anotación de 'jakarta.ws.rs.ext' debes poner sobre esa clase?",
    code: `// ¿Qué anotación registra un ExceptionMapper clásico en Jakarta REST?
public class MyExceptionHandler implements ExceptionMapper<MyException> {
    @Override
    public Response toResponse(MyException ex) { ... }
}`,
    options: [
      "@Provider",
      "@RegisterProvider",
      "@Mapper",
      "@Component"
    ],
    correct: 0,
    explanation: "En Jakarta REST estándar, las clases que implementan 'ExceptionMapper<T>', 'ContainerRequestFilter' o 'ContainerResponseFilter' se registran con '@Provider' (de jakarta.ws.rs.ext.Provider).",
    kidTip: "Clase que implementa ExceptionMapper o Filter lleva @Provider; método directo en RESTEasy Reactive lleva @ServerExceptionMapper."
  },
  {
    id: "rest-ann-22",
    module: "rest",
    category: "annotation",
    question: "En una prueba '@QuarkusTest', ¿qué anotación puedes colocar sobre la clase de test para que todas las peticiones de RestAssured apunten automáticamente al @Path de 'BookResource.class' sin repetir '/books' en cada test?",
    code: `@QuarkusTest
// ¿Qué anotación configura la ruta base del test apuntando a BookResource?
public class BookResourceTest { ... }`,
    options: [
      "@TestHTTPEndpoint(BookResource.class)",
      "@RestPath(BookResource.class)",
      "@TargetResource(BookResource.class)",
      "@BasePath(\"/books\")"
    ],
    correct: 0,
    explanation: "'@TestHTTPEndpoint(MiResource.class)' (de io.quarkus.test.common.http.TestHTTPEndpoint) configura automáticamente RestAssured con el prefijo '@Path' de ese Resource.",
    kidTip: "@TestHTTPEndpoint(ClaseResource.class) te ahorra escribir la ruta base en los tests."
  },
  {
    id: "rest-ann-23",
    module: "rest",
    category: "annotation",
    question: "Necesitas ejecutar un método de inicialización (por ejemplo, cargar datos iniciales en una lista en memoria) justo después de que Quarkus construya tu bean '@ApplicationScoped'. ¿Qué anotación estándar colocas sobre ese método?",
    code: `@ApplicationScoped
public class CourseStore {
    // ¿Qué anotación ejecuta este método automáticamente al crearse el bean?
    void seedData() { ... }
}`,
    options: [
      "@PostConstruct (de jakarta.annotation.PostConstruct)",
      "@OnCreate",
      "@Initialize",
      "@BeforeStart"
    ],
    correct: 0,
    explanation: "'@PostConstruct' se invoca una sola vez justo después de que CDI inyecta las dependencias del bean.",
    kidTip: "@PostConstruct = preparar la tienda justo después de construir el objeto."
  },
  {
    id: "rest-ann-24",
    module: "rest",
    category: "annotation",
    question: "Si necesitas que un método de tu servicio se ejecute inmediatamente al arrancar toda la aplicación Quarkus (sin esperar a que llegue la primera petición HTTP al bean), ¿qué evento observas en el parámetro del método?",
    code: `@ApplicationScoped
public class AppInitializer {
    void onStart(_______________________ StartupEvent ev) {
        // Se ejecuta al arrancar Quarkus
    }
}`,
    options: [
      "@Observes (de jakarta.enterprise.event.Observes)",
      "@PathParam",
      "@Context",
      "@Incoming"
    ],
    correct: 0,
    explanation: "Un método con 'void onStart(@Observes StartupEvent ev)' se dispara automáticamente en cuanto la aplicación Quarkus inicia.",
    kidTip: "@Observes StartupEvent = despierta apenas arranca Quarkus."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 3: MICROPROFILE OPENAPI (openapi) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "oa-ann-7",
    module: "openapi",
    category: "annotation",
    question: "Un endpoint @GET puede devolver código 200 (éxito) o código 404 (no encontrado). ¿Cómo documentas AMBAS respuestas sobre el mismo método usando MicroProfile OpenAPI?",
    code: `@GET
@Path("/{id}")
// ¿Cómo colocas múltiples @APIResponse en el método?
public Book getById(@PathParam("id") Long id) { ... }`,
    options: [
      "Poniendo múltiples @APIResponse directamente sobre el método (es @Repeatable) o envolviéndolas dentro de @APIResponses({ ... })",
      "Separando los códigos con coma dentro de uno solo: @APIResponse(responseCode = \"200,404\")",
      "Solo se permite un @APIResponse por método en OpenAPI",
      "Usando @Operation(responses = {\"200\", \"404\"})"
    ],
    correct: 0,
    explanation: "En MicroProfile OpenAPI, '@APIResponse' es una anotación repetible ('@Repeatable(APIResponses.class)'), por lo que puedes apilar varias '@APIResponse' o agruparlas dentro de '@APIResponses({...})'.",
    kidTip: "Puedes poner varios @APIResponse seguidos uno debajo del otro en el mismo método."
  },
  {
    id: "oa-ann-8",
    module: "openapi",
    category: "annotation",
    question: "Dentro de '@APIResponse', quieres documentar que el cuerpo devuelto es un JSON ('MediaType.APPLICATION_JSON') cuya estructura corresponde a la clase 'Speaker.class'. ¿Qué anotación usas en el atributo 'content'?",
    code: `@APIResponse(
    responseCode = "200",
    description = "Speaker found",
    content = ________________________________________________________
)`,
    options: [
      "@Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = Speaker.class))",
      "@Schema(mediaType = \"application/json\", type = Speaker.class)",
      "@Body(type = Speaker.class)",
      "@Header(name = \"Content-Type\", schema = @Schema(implementation = Speaker.class))"
    ],
    correct: 0,
    explanation: "El atributo 'content' de '@APIResponse' recibe '@Content(mediaType = ..., schema = @Schema(implementation = ...))'.",
    kidTip: "Para cabeceras en @APIResponse usas headers = @Header(...); para el cuerpo usas content = @Content(...)."
  },
  {
    id: "oa-ann-9",
    module: "openapi",
    category: "annotation",
    question: "Si un método devuelve una LISTA de objetos ('List<Speaker>') y quieres documentar su esquema dentro de '@Content', ¿cómo configuras '@Schema' para indicar que es un arreglo (ARRAY) de 'Speaker'?",
    code: `@Content(
    mediaType = MediaType.APPLICATION_JSON,
    schema = ________________________________________________________
)`,
    options: [
      "@Schema(type = SchemaType.ARRAY, implementation = Speaker.class)",
      "@Schema(implementation = List<Speaker>.class)",
      "@ArraySchema(Speaker.class)",
      "@Schema(collection = true, class = Speaker.class)"
    ],
    correct: 0,
    explanation: "En Java no existe 'List<Speaker>.class'. Por eso en MicroProfile OpenAPI se indica 'type = SchemaType.ARRAY' junto con 'implementation = Speaker.class'.",
    kidTip: "Lista en OpenAPI = @Schema(type = SchemaType.ARRAY, implementation = MiClase.class)."
  },
  {
    id: "oa-ann-10",
    module: "openapi",
    category: "annotation",
    question: "Quieres ocultar un endpoint administrativo interno ('@DELETE @Path(\"/internal-wipe\")') para que NO aparezca en el documento '/q/openapi' ni en Swagger UI. ¿Cómo lo logras con '@Operation'?",
    code: `@DELETE
@Path("/internal-wipe")
// ¿Qué atributo de @Operation oculta este endpoint de OpenAPI?
public void wipe() { ... }`,
    options: [
      "@Operation(hidden = true)",
      "@Operation(ignore = true)",
      "@Operation(private = true)",
      "@JsonIgnore"
    ],
    correct: 0,
    explanation: "El atributo 'hidden = true' dentro de '@Operation' excluye ese endpoint de la especificación OpenAPI generada.",
    kidTip: "@Operation(hidden = true) hace invisible el endpoint en Swagger UI y /q/openapi."
  },
  {
    id: "oa-ann-11",
    module: "openapi",
    category: "annotation",
    question: "Quieres documentar un parámetro de ruta '@PathParam(\"id\")' en OpenAPI agregándole la descripción 'Unique identifier of the course' y un ejemplo '101'. ¿Qué anotación colocas junto a '@PathParam'?",
    code: `@GET
@Path("/{id}")
public Course get(
    _______________________________________________________________
    @PathParam("id") Integer id) { ... }`,
    options: [
      "@Parameter(description = \"Unique identifier of the course\", example = \"101\", required = true)",
      "@SchemaParam(description = \"Unique identifier of the course\", sample = 101)",
      "@OperationParam(text = \"Unique identifier of the course\")",
      "@Header(description = \"Unique identifier of the course\")"
    ],
    correct: 0,
    explanation: "'@Parameter' (de org.eclipse.microprofile.openapi.annotations.parameters.Parameter) documenta parámetros '@PathParam', '@QueryParam', '@HeaderParam' o '@CookieParam'.",
    kidTip: "Para describir un @PathParam o @QueryParam en OpenAPI le pones al lado @Parameter(description = ...)."
  },
  {
    id: "oa-ann-12",
    module: "openapi",
    category: "annotation",
    question: "En una clase entidad o DTO 'Course', quieres documentar en OpenAPI que el campo 'String title' es obligatorio y tiene la descripción 'Course title'. ¿Qué anotación colocas sobre el campo 'title'?",
    code: `public class Course {
    // ¿Qué anotación documenta este campo del modelo en OpenAPI?
    public String title;
}`,
    options: [
      "@Schema(required = true, description = \"Course title\", example = \"Quarkus Basics\")",
      "@Parameter(required = true, description = \"Course title\")",
      "@Operation(summary = \"Course title\")",
      "@PropertyDoc(required = true)"
    ],
    correct: 0,
    explanation: "'@Schema' se utiliza tanto sobre la clase modelo como sobre cada uno de sus campos o getters para describir sus propiedades en el esquema JSON de OpenAPI.",
    kidTip: "Sobre un método REST va @Operation; sobre un parámetro URL va @Parameter; sobre una clase/campo de datos va @Schema."
  },
  {
    id: "oa-ann-13",
    module: "openapi",
    category: "when",
    question: "¿Cuándo debes usar '@Header' (de MicroProfile OpenAPI) y cuándo debes usar '@HeaderParam' (de Jakarta REST)?",
    code: `// Dos anotaciones que mencionan Header:
// 1. @Header(name = "id", description = "...", schema = @Schema(implementation = Integer.class))
// 2. @HeaderParam("X-Auth-Token") String token`,
    options: [
      "@Header se usa dentro de @APIResponse para DOCUMENTAR en OpenAPI una cabecera que tu servidor devuelve; @HeaderParam se usa en los argumentos de un método Java para LEER una cabecera enviada por el cliente",
      "@Header lee cabeceras en GET y @HeaderParam lee cabeceras en POST",
      "Ambas sirven para leer cabeceras entrantes en el método Java",
      "@HeaderParam es de OpenAPI y @Header es de Jakarta REST"
    ],
    correct: 0,
    explanation: "'@Header' es puramente documental (vive dentro de '@APIResponse(headers = { ... })'). '@HeaderParam' extrae el valor real en tiempo de ejecución.",
    kidTip: "@Header = documentar en el manual OpenAPI | @HeaderParam = capturar el valor en el parámetro del método."
  },
  {
    id: "oa-ann-14",
    module: "openapi",
    category: "annotation",
    question: "Si en vez de configurar el título y versión de OpenAPI en application.properties prefieres hacerlo con una anotación Java sobre una clase 'jakarta.ws.rs.core.Application', ¿qué anotación de MicroProfile OpenAPI usas?",
    code: `// ¿Qué anotación define globalmente el bloque info de OpenAPI en código Java?
public class CustomApiApplication extends Application {
}`,
    options: [
      "@OpenAPIDefinition(info = @Info(title = \"My API\", version = \"1.0.0\"))",
      "@SwaggerDefinition(title = \"My API\", version = \"1.0.0\")",
      "@Operation(summary = \"My API\", description = \"1.0.0\")",
      "@APIInfo(name = \"My API\", version = \"1.0.0\")"
    ],
    correct: 0,
    explanation: "'@OpenAPIDefinition(info = @Info(title = \"...\", version = \"...\", description = \"...\"))' define los metadatos globales cuando no se usan las propiedades 'quarkus.smallrye-openapi.info-*'.",
    kidTip: "En código Java es @OpenAPIDefinition(info = @Info(...)); en application.properties es quarkus.smallrye-openapi.info-title."
  },
  {
    id: "oa-ann-15",
    module: "openapi",
    category: "annotation",
    question: "Quieres agrupar todos los endpoints de 'SpeakerResource' bajo la sección 'Speakers Management' dentro de Swagger UI. ¿Qué anotación colocas sobre la clase 'SpeakerResource'?",
    code: `@Path("/speakers")
// ¿Qué anotación agrupa los endpoints bajo una sección en OpenAPI/Swagger?
public class SpeakerResource { ... }`,
    options: [
      "@Tag(name = \"Speakers Management\", description = \"Endpoints for speakers\")",
      "@OperationGroup(\"Speakers Management\")",
      "@Section(title = \"Speakers Management\")",
      "@Schema(name = \"Speakers Management\")"
    ],
    correct: 0,
    explanation: "'@Tag' (de org.eclipse.microprofile.openapi.annotations.tags.Tag) clasifica y agrupa las operaciones en el documento OpenAPI.",
    kidTip: "@Tag(name = \"...\") crea las carpetas/secciones desplegables en Swagger UI."
  },
  {
    id: "oa-ann-16",
    module: "openapi",
    category: "annotation",
    question: "En un método '@POST public Response create(Speaker speaker)', quieres documentar en OpenAPI que el cuerpo de la petición (RequestBody) es obligatorio y tiene la descripción 'Speaker to create'. ¿Qué anotación usas?",
    code: `@POST
public Response create(
    ___________________________________________________________
    Speaker speaker) { ... }`,
    options: [
      "@RequestBody(description = \"Speaker to create\", required = true)",
      "@Parameter(description = \"Speaker to create\", required = true)",
      "@Header(name = \"body\", description = \"Speaker to create\")",
      "@ConsumesBody(required = true)"
    ],
    correct: 0,
    explanation: "'@RequestBody' (de org.eclipse.microprofile.openapi.annotations.parameters.RequestBody) documenta el payload JSON/XML enviado en el cuerpo de un POST o PUT.",
    kidTip: "Variables en URL = @Parameter | Objeto JSON en el cuerpo de un POST/PUT = @RequestBody."
  },
  {
    id: "oa-ann-17",
    module: "openapi",
    category: "when",
    question: "El enunciado del examen te pide que el documento OpenAPI tenga 'info.title = Conference API' y 'info.version = 2.1'. ¿Cuál es la forma más rápida y menos propensa a errores de lograrlo en Quarkus?",
    code: `// ¿Escribir una clase Application con @OpenAPIDefinition o usar application.properties?`,
    options: [
      "Agregar en application.properties: quarkus.smallrye-openapi.info-title=Conference API y quarkus.smallrye-openapi.info-version=2.1",
      "Modificar el archivo pom.xml",
      "Poner @Operation(summary = \"Conference API\") en todos los métodos",
      "Crear un filtro HTTP manual para sobrescribir /q/openapi"
    ],
    correct: 0,
    explanation: "Las propiedades 'quarkus.smallrye-openapi.info-title', 'info-version', 'info-description', 'info-contact-name', etc. en 'application.properties' generan automáticamente el bloque 'info:' sin necesidad de crear clases extras.",
    kidTip: "Para título y versión global de OpenAPI, ve directo a application.properties con quarkus.smallrye-openapi.info-*."
  },
  {
    id: "oa-ann-18",
    module: "openapi",
    category: "annotation",
    question: "En '@APIResponse', ¿por qué el siguiente código NO compila en Java?\n`@APIResponse(responseCode = 201, description = \"Created\")`",
    code: `@APIResponse(responseCode = 201, description = "Created") // <-- Error de compilación`,
    options: [
      "Porque el atributo 'responseCode' es de tipo String y debe ir entre comillas dobles: responseCode = \"201\"",
      "Porque el atributo se llama 'code' y no 'responseCode'",
      "Porque 201 no es un código HTTP válido en OpenAPI",
      "Porque falta el atributo obligatorio 'headers'"
    ],
    correct: 0,
    explanation: "En la especificación OpenAPI las claves de respuestas pueden ser rangos como '\"2XX\"' o '\"default\"', por lo que 'responseCode' es siempre un 'String' ('\"200\"', '\"201\"', '\"404\"').",
    kidTip: "¡Siempre pon comillas en responseCode = \"201\"!"
  },
  {
    id: "oa-ann-19",
    module: "openapi",
    category: "annotation",
    question: "En un método '@POST', el examen te pide documentar DOS cabeceras en la respuesta 201: 'id' (Integer) y 'location' (String). ¿Cómo se escriben ambas dentro de '@APIResponse'?",
    code: `@APIResponse(
    responseCode = "201",
    headers = {
        ___________________________________________________________,
        ___________________________________________________________
    }
)`,
    options: [
      "@Header(name = \"id\", schema = @Schema(implementation = Integer.class)), @Header(name = \"location\", schema = @Schema(implementation = String.class))",
      "@Header(\"id\", Integer.class), @Header(\"location\", String.class)",
      "@HeaderParam(\"id\"), @HeaderParam(\"location\")",
      "\"id: Integer\", \"location: String\""
    ],
    correct: 0,
    explanation: "El atributo 'headers' de '@APIResponse' es un arreglo de anotaciones '@Header', donde cada una define su 'name', 'description' opcional y 'schema = @Schema(implementation = ...)'.",
    kidTip: "headers = { @Header(name = ..., schema = @Schema(implementation = ...)), @Header(...) }."
  },
  {
    id: "oa-ann-20",
    module: "openapi",
    category: "annotation",
    question: "¿Qué atributo de '@Operation' usarías si el test del examen verifica el campo 'operationId' de un endpoint en '/q/openapi'?",
    code: `@GET
@Operation(___________________ = "getAllCourses", summary = "List courses")
public List<Course> list() { ... }`,
    options: [
      "operationId",
      "id",
      "name",
      "methodId"
    ],
    correct: 0,
    explanation: "'@Operation' tiene los atributos 'summary', 'description', 'operationId' y 'hidden'.",
    kidTip: "Los 4 atributos de @Operation: summary, description, operationId, hidden."
  },
  {
    id: "oa-ann-21",
    module: "openapi",
    category: "annotation",
    question: "¿De qué paquete base provienen TODAS las anotaciones de OpenAPI usadas en Quarkus (@Operation, @APIResponse, @Header, @Schema, @Parameter, @Tag)?",
    code: `import ___________________________________________.Operation;`,
    options: [
      "org.eclipse.microprofile.openapi.annotations...",
      "io.swagger.v3.oas.annotations...",
      "io.smallrye.openapi.api...",
      "jakarta.ws.rs.openapi..."
    ],
    correct: 0,
    explanation: "Quarkus implementa la especificación estándar MicroProfile OpenAPI, cuyas anotaciones viven todas bajo 'org.eclipse.microprofile.openapi.annotations'.",
    kidTip: "Al autocompletar en el IDE, elige siempre org.eclipse.microprofile.openapi.annotations."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 4: PERSISTENCIA CON PANACHE (panache) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "pan-ann-9",
    module: "panache",
    category: "annotation",
    question: "Quieres que tu entidad 'Expense' se guarde en una tabla SQL llamada 'user_expenses' en lugar de 'Expense'. ¿Qué anotación colocas junto a '@Entity'?",
    code: `@Entity
// ¿Qué anotación cambia el nombre de la tabla en la base de datos?
public class Expense extends PanacheEntity { ... }`,
    options: [
      "@Table(name = \"user_expenses\") (de jakarta.persistence.Table)",
      "@EntityName(\"user_expenses\")",
      "@WithName(\"user_expenses\")",
      "@SqlTable(\"user_expenses\")"
    ],
    correct: 0,
    explanation: "'@Table(name = \"...\")' de Jakarta Persistence define el nombre físico de la tabla en la base de datos.",
    kidTip: "Para cambiar el nombre de la tabla SQL: @Table(name = \"...\")."
  },
  {
    id: "pan-ann-10",
    module: "panache",
    category: "annotation",
    question: "Dentro de una entidad Panache, quieres que el campo 'String fullName' se guarde en la columna 'full_name', sea obligatorio (NOT NULL) y tenga longitud máxima de 100. ¿Qué anotación colocas sobre el campo?",
    code: `@Entity
public class Customer extends PanacheEntity {
    // ¿Qué anotación personaliza la columna SQL?
    public String fullName;
}`,
    options: [
      "@Column(name = \"full_name\", nullable = false, length = 100)",
      "@Field(column = \"full_name\", required = true, size = 100)",
      "@Schema(name = \"full_name\", required = true)",
      "@WithName(\"full_name\")"
    ],
    correct: 0,
    explanation: "'@Column' (de jakarta.persistence.Column) configura el nombre de columna, 'nullable', 'unique' y 'length'.",
    kidTip: "Tabla = @Table(name = ...) | Columna = @Column(name = ..., nullable = ..., unique = ...)."
  },
  {
    id: "pan-ann-11",
    module: "panache",
    category: "annotation",
    question: "En una entidad que extiende de 'PanacheEntityBase' (porque no quieres el Long id por defecto), quieres definir tu propio campo 'Long customId' como llave primaria autogenerada. ¿Qué DOS anotaciones colocas sobre ese campo?",
    code: `@Entity
public class Invoice extends PanacheEntityBase {
    // ¿Qué DOS anotaciones definen la PK autogenerada?
    public Long customId;
}`,
    options: [
      "@Id y @GeneratedValue",
      "@PrimaryKey y @AutoIncrement",
      "@Key y @Sequence",
      "@Id y @WithDefault"
    ],
    correct: 0,
    explanation: "En JPA, toda llave primaria lleva '@Id' y, si la base de datos debe autogenerarla, se acompaña de '@GeneratedValue' (de jakarta.persistence).",
    kidTip: "Si usas PanacheEntityBase, tú mismo pones @Id y @GeneratedValue."
  },
  {
    id: "pan-ann-12",
    module: "panache",
    category: "when",
    question: "En un endpoint '@PUT @Path(\"/{id}\")' buscas un 'Speaker' con 'Speaker.findById(id)' y modificas 'speaker.name = nuevoNombre'. Si NO llamas a 'speaker.persist()', ¿se guarda el cambio en la base de datos?",
    code: `@PUT
@Path("/{id}")
@Transactional
public Speaker update(@PathParam("id") Long id, Speaker data) {
    Speaker s = Speaker.findById(id);
    s.name = data.name;
    return s;
}`,
    options: [
      "Sí, SIEMPRE Y CUANDO el método tenga la anotación @Transactional, porque Hibernate detecta los cambios en entidades gestionadas (Dirty Checking) y hace el UPDATE al cerrar la transacción",
      "No, en Panache es obligatorio llamar a s.update() después de cambiar un campo",
      "Sí, incluso si el método NO tiene @Transactional",
      "No, debes borrar la entidad y volverla a insertar"
    ],
    correct: 0,
    explanation: "Dentro de un método '@Transactional', cualquier entidad recuperada con 'findById' está gestionada por Hibernate: basta con modificar sus campos públicos y al terminar el método se ejecuta el UPDATE automáticamente.",
    kidTip: "Con @Transactional puesto, cambiar un campo de una entidad traída de la BD la actualiza sola al salir del método."
  },
  {
    id: "pan-ann-13",
    module: "panache",
    category: "annotation",
    question: "Tu entidad 'Expense' tiene un campo 'PaymentMethod method' que es un 'enum' (CASH, CREDIT_CARD). Quieres que en la base de datos se guarde el texto (\"CASH\") y NO el número (0, 1). ¿Qué anotación colocas sobre el campo?",
    code: `@Entity
public class Expense extends PanacheEntity {
    // ¿Qué anotación guarda el nombre del enum como texto en la BD?
    public PaymentMethod method;
}`,
    options: [
      "@Enumerated(EnumType.STRING)",
      "@EnumFormat(Format.TEXT)",
      "@Column(type = \"STRING\")",
      "@JsonValue"
    ],
    correct: 0,
    explanation: "Por defecto JPA guarda los enums por su posición numérica (ORDINAL). Con '@Enumerated(EnumType.STRING)' se almacena el nombre literal del enum.",
    kidTip: "Para guardar enums como texto en la BD: @Enumerated(EnumType.STRING)."
  },
  {
    id: "pan-ann-14",
    module: "panache",
    category: "when",
    question: "¿Qué diferencia hay entre usar '@JsonIgnore' (de Jackson) y '@JsonbTransient' (de JSON-B) en una entidad Panache?",
    code: `// ¿Cuándo usas @JsonIgnore y cuándo @JsonbTransient?`,
    options: [
      "Ambas ocultan el campo al serializar a JSON para evitar ciclos infinitos: usas @JsonIgnore si el proyecto tiene la extensión 'quarkus-resteasy-reactive-jackson' y @JsonbTransient si tiene 'quarkus-resteasy-reactive-jsonb'",
      "@JsonIgnore es para @OneToMany y @JsonbTransient es para @ManyToOne",
      "@JsonIgnore borra la columna de la BD y @JsonbTransient no",
      "@JsonbTransient solo funciona con Kafka"
    ],
    correct: 0,
    explanation: "En la mayoría de proyectos de DO378 se usa Jackson ('@JsonIgnore' de com.fasterxml.jackson.annotation.JsonIgnore), pero si el proyecto usa JSON-B, la anotación equivalente es '@JsonbTransient'.",
    kidTip: "Jackson = @JsonIgnore | JSON-B = @JsonbTransient."
  },
  {
    id: "pan-ann-15",
    module: "panache",
    category: "annotation",
    question: "En una relación '@OneToMany(mappedBy = \"speaker\", ...)', quieres que al guardar un 'Speaker' nuevo se guarden también todos los objetos de su lista 'talks' automáticamente, y si quitas un 'Talk' de la lista se borre de la BD. ¿Qué atributos pones en '@OneToMany'?",
    code: `@OneToMany(
    mappedBy = "speaker",
    _______________________________________________________
)
public List<Talk> talks = new ArrayList<>();`,
    options: [
      "cascade = CascadeType.ALL, orphanRemoval = true",
      "autoSave = true, autoDelete = true",
      "persistChildren = true, deleteOrphans = true",
      "fetch = FetchType.LAZY"
    ],
    correct: 0,
    explanation: "'cascade = CascadeType.ALL' propaga persist/remove del padre a los hijos, y 'orphanRemoval = true' elimina de la BD cualquier hijo que sea removido de la colección.",
    kidTip: "Para que el Padre controle la vida de la lista de Hijos: cascade = CascadeType.ALL, orphanRemoval = true."
  },
  {
    id: "pan-ann-16",
    module: "panache",
    category: "annotation",
    question: "Si al devolver un 'Speaker' fuera de un método '@Transactional' obtienes 'LazyInitializationException' al intentar serializar su lista de 'talks', ¿qué atributo en '@OneToMany' fuerza a que los 'talks' se carguen de inmediato junto con el 'Speaker'?",
    code: `@OneToMany(mappedBy = "speaker", _______________________________)
public List<Talk> talks;`,
    options: [
      "fetch = FetchType.EAGER",
      "fetch = FetchType.LAZY",
      "immediate = true",
      "preload = true"
    ],
    correct: 0,
    explanation: "Por defecto '@OneToMany' es 'LAZY' (carga perezosa). Poner 'fetch = FetchType.EAGER' carga la colección inmediatamente al consultar la entidad padre.",
    kidTip: "@OneToMany con fetch = FetchType.EAGER trae la lista de hijos de inmediato evitando LazyInitializationException."
  },
  {
    id: "pan-ann-17",
    module: "panache",
    category: "annotation",
    question: "En la entidad hija 'Talk', tienes '@ManyToOne public Speaker speaker;'. ¿Qué anotación usas para indicar explícitamente que la columna de llave foránea en la tabla 'Talk' se llama 'speaker_id'?",
    code: `@ManyToOne
// ¿Qué anotación define el nombre de la columna Foreign Key?
@JsonIgnore
public Speaker speaker;`,
    options: [
      "@JoinColumn(name = \"speaker_id\")",
      "@Column(name = \"speaker_id\")",
      "@ForeignKey(\"speaker_id\")",
      "@MappedBy(\"speaker_id\")"
    ],
    correct: 0,
    explanation: "En relaciones '@ManyToOne' o '@OneToOne', la columna de llave foránea se especifica con '@JoinColumn(name = \"...\")', NO con '@Column'.",
    kidTip: "Atributo normal = @Column | Relación (@ManyToOne) = @JoinColumn."
  },
  {
    id: "pan-ann-18",
    module: "panache",
    category: "when",
    question: "¿En cuáles de las siguientes operaciones de Panache es OBLIGATORIO tener la anotación '@Transactional' en el método?",
    code: `// A) Speaker.listAll()
// B) Speaker.findById(1L)
// C) speaker.persist()
// D) Speaker.deleteById(1L)`,
    options: [
      "En C (persist) y D (deleteById), además de cualquier método que actualice campos o ejecute update()/delete()",
      "Solo en A (listAll) y B (findById)",
      "Únicamente en deleteById, pero no en persist()",
      "En ninguna, Panache abre transacciones automáticamente en todos los métodos"
    ],
    correct: 0,
    explanation: "Las lecturas ('listAll', 'findById', 'find', 'list', 'count') no requieren '@Transactional', pero TODA escritura, actualización o borrado ('persist', 'delete', 'deleteById', 'update') exige '@Transactional'.",
    kidTip: "Leer = sin @Transactional | Escribir, Modificar o Borrar = SIEMPRE con @Transactional."
  },
  {
    id: "pan-ann-19",
    module: "panache",
    category: "annotation",
    question: "Quieres que un método de servicio SIEMPRE abra una transacción nueva e independiente, suspendiendo cualquier transacción que ya viniera abierta desde antes. ¿Cómo configuras '@Transactional'?",
    code: `// ¿Qué atributo de @Transactional fuerza una nueva transacción independiente?
public void writeAuditLog(AuditEntry entry) {
    entry.persist();
}`,
    options: [
      "@Transactional(Transactional.TxType.REQUIRES_NEW)",
      "@Transactional(newTransaction = true)",
      "@Transactional(propagation = \"NEW\")",
      "@NewTransaction"
    ],
    correct: 0,
    explanation: "'@Transactional(Transactional.TxType.REQUIRES_NEW)' suspende la transacción actual (si existe) y abre una transacción física nueva.",
    kidTip: "Por defecto es TxType.REQUIRED; para aislar en una transacción aparte es TxType.REQUIRES_NEW."
  },
  {
    id: "pan-ann-20",
    module: "panache",
    category: "annotation",
    question: "Tienes un campo calculado 'public double totalWithTax;' dentro de tu entidad '@Entity' que quieres incluir en el JSON de respuesta, pero NO quieres que Hibernate cree una columna para él en la tabla SQL. ¿Qué anotación de 'jakarta.persistence' usas?",
    code: `@Entity
public class Order extends PanacheEntity {
    public double subtotal;

    // ¿Qué anotación evita que este campo se guarde como columna en la BD?
    public double totalWithTax;
}`,
    options: [
      "@Transient (de jakarta.persistence.Transient)",
      "@JsonIgnore",
      "@IgnoreColumn",
      "@NotPersisted"
    ],
    correct: 0,
    explanation: "Cuando realmente NO quieres que un campo exista en la tabla de la base de datos, usas '@Transient' de JPA.",
    kidTip: "No guardar en BD (pero sí mostrar en JSON) = @Transient. Sí guardar en BD (pero ocultar en JSON) = @JsonIgnore."
  },
  {
    id: "pan-ann-21",
    module: "panache",
    category: "when",
    question: "¿Cuándo usas 'implements PanacheRepository<Entidad>' frente a 'implements PanacheRepositoryBase<Entidad, TipoId>'?",
    code: `// 1. public class BookRepo implements PanacheRepository<Book>
// 2. public class ItemRepo implements PanacheRepositoryBase<Item, UUID>`,
    options: [
      "Usas PanacheRepository<Entidad> cuando el ID de la entidad es de tipo Long; usas PanacheRepositoryBase<Entidad, TipoId> cuando el ID es de otro tipo (como String o UUID)",
      "PanacheRepositoryBase es para bases de datos NoSQL y PanacheRepository es para SQL",
      "PanacheRepository requiere @Entity y PanacheRepositoryBase requiere @ApplicationScoped",
      "No hay diferencia, PanacheRepositoryBase está obsoleto"
    ],
    correct: 0,
    explanation: "Al igual que 'PanacheEntity' fija el ID a 'Long', 'PanacheRepository<T>' asume que el ID es 'Long'. Si tu entidad usa otro tipo de '@Id' (ej. 'UUID' o 'String'), tu repositorio debe implementar 'PanacheRepositoryBase<Entidad, TipoId>'.",
    kidTip: "ID tipo Long = PanacheEntity / PanacheRepository. Otro tipo de ID = PanacheEntityBase / PanacheRepositoryBase."
  },
  {
    id: "pan-ann-22",
    module: "panache",
    category: "annotation",
    question: "Para validar automáticamente que el campo 'public String name;' de una entidad no sea vacío ni nulo cuando entra por un '@POST' usando Hibernate Validator, ¿qué anotaciones colocas en el campo y en el parámetro del método REST?",
    code: `// En la Entidad:
______________ public String name;

// En el método @POST:
public Response create(______________ Speaker speaker) { ... }`,
    options: [
      "@NotBlank (en el campo de la entidad) y @Valid (delante del parámetro en el método REST)",
      "@Required (en la entidad) y @Validate (en el método REST)",
      "@Column(nullable = false) y @Check",
      "@NotNull y @Transactional"
    ],
    correct: 0,
    explanation: "Las restricciones de Bean Validation ('@NotBlank', '@NotNull', '@Min', '@Email' de jakarta.validation.constraints) se activan en el endpoint REST colocando '@Valid' (de jakarta.validation.Valid) delante del parámetro.",
    kidTip: "Regla en el campo = @NotBlank / @NotNull. Activar revisión en el endpoint = @Valid."
  },
  {
    id: "pan-ann-23",
    module: "panache",
    category: "annotation",
    question: "En el patrón Repository, una vez que creaste '@ApplicationScoped public class SpeakerRepository implements PanacheRepository<Speaker>', ¿con qué anotación lo inyectas dentro de 'SpeakerResource'?",
    code: `@Path("/speakers")
public class SpeakerResource {
    // ¿Qué anotación inyecta tu PanacheRepository?
    SpeakerRepository repository;
}`,
    options: [
      "@Inject",
      "@RestClient",
      "@PersistenceContext",
      "@ConfigProperty"
    ],
    correct: 0,
    explanation: "Un 'PanacheRepository' anotado con '@ApplicationScoped' es un bean CDI normal y se inyecta únicamente con '@Inject'.",
    kidTip: "Repositorio Panache = bean CDI normal = se inyecta solo con @Inject."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 5: REST CLIENT REACTIVE (restclient) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "rc-ann-6",
    module: "restclient",
    category: "annotation",
    question: "Si en '@RegisterRestClient' NO quieres usar 'configKey' sino dejar una URL por defecto directamente en la anotación, ¿cómo se llama ese atributo de '@RegisterRestClient'?",
    code: `@Path("/countries")
@RegisterRestClient(_____________________ = "https://restcountries.com/v3.1")
public interface CountriesClient { ... }`,
    options: [
      "baseUri",
      "url",
      "defaultUrl",
      "endpoint"
    ],
    correct: 0,
    explanation: "'@RegisterRestClient' acepta dos atributos principales: 'configKey = \"...\"' (para configurar en application.properties) y 'baseUri = \"http://...\"' (URL base por defecto).",
    kidTip: "En la anotación @RegisterRestClient el atributo se llama baseUri; en application.properties termina en .url."
  },
  {
    id: "rc-ann-7",
    module: "restclient",
    category: "when",
    question: "En una interfaz '@RegisterRestClient', un método remoto está en la ruta 'GET /warnings/{city}?includeResolved=true'. ¿Qué anotaciones usas en los parámetros del método de la interfaz?",
    code: `@GET
@Path("/{city}")
List<Warning> getWarnings(
    _______________________ String city,
    _______________________ boolean includeResolved
);`,
    options: [
      "@PathParam(\"city\") y @QueryParam(\"includeResolved\") (o @RestPath y @RestQuery)",
      "@ClientPath(\"city\") y @ClientQuery(\"includeResolved\")",
      "@WithName(\"city\") y @WithName(\"includeResolved\")",
      "@Parameter(\"city\") y @Parameter(\"includeResolved\")"
    ],
    correct: 0,
    explanation: "Las interfaces de MicroProfile REST Client usan exactamente las mismas anotaciones de Jakarta REST ('@GET', '@POST', '@Path', '@PathParam', '@QueryParam', '@HeaderParam') que los Resources del servidor.",
    kidTip: "En la interfaz del REST Client usas las mismas anotaciones (@GET, @Path, @PathParam, @QueryParam) que en un Resource."
  },
  {
    id: "rc-ann-8",
    module: "restclient",
    category: "annotation",
    question: "En una interfaz '@RegisterRestClient', quieres que el método 'createExpense(Expense e)' envíe el objeto en formato JSON y reciba un JSON. ¿Qué anotaciones colocas?",
    code: `@POST
// ¿Qué anotaciones definen que envía y recibe JSON?
Expense createExpense(Expense e);`,
    options: [
      "@Produces(MediaType.APPLICATION_JSON) y @Consumes(MediaType.APPLICATION_JSON)",
      "@JsonRequest y @JsonResponse",
      "@Content(MediaType.APPLICATION_JSON)",
      "@Schema(implementation = Expense.class)"
    ],
    correct: 0,
    explanation: "Al igual que en el servidor, '@Produces' y '@Consumes' definen el formato esperado de respuesta y el formato enviado en la petición del cliente REST (con 'quarkus-rest-client-reactive-jackson' incluso se asume JSON por defecto para objetos).",
    kidTip: "@Produces y @Consumes también se usan en interfaces @RegisterRestClient."
  },
  {
    id: "rc-ann-9",
    module: "restclient",
    category: "annotation",
    question: "Usando '@ClientHeaderParam' en una interfaz '@RegisterRestClient', quieres que el valor de la cabecera 'Authorization' sea calculado dinámicamente llamando al método 'generateToken()' de la propia interfaz. ¿Cuál es la sintaxis de 'value'?",
    code: `@RegisterRestClient(configKey = "secure-api")
@ClientHeaderParam(name = "Authorization", value = "_____________________")
public interface SecureClient {
    default String generateToken() {
        return "Bearer " + MyTokenHelper.get();
    }
}`,
    options: [
      "{generateToken}",
      "generateToken()",
      "${generateToken}",
      "@Method(\"generateToken\")"
    ],
    correct: 0,
    explanation: "En '@ClientHeaderParam', cuando el 'value' va encerrado entre llaves '{nombreMetodo}', Quarkus invoca ese método para obtener el valor de la cabecera en cada petición.",
    kidTip: "En @ClientHeaderParam, llaves '{nombreMetodo}' llaman al método para calcular la cabecera."
  },
  {
    id: "rc-ann-10",
    module: "restclient",
    category: "annotation",
    question: "En REST Client Reactive, cuando el servicio remoto responde con un código HTTP de error (por ejemplo 404 o 500), quieres capturar esa respuesta dentro de la propia interfaz cliente y convertirla en una excepción específica. ¿Qué anotación colocas sobre un método static en la interfaz?",
    code: `@RegisterRestClient(configKey = "books-api")
public interface BooksClient {
    @GET @Path("/{id}")
    Book getBook(@PathParam("id") Long id);

    // ¿Qué anotación convierte un Response de error del cliente en una excepción?
    static RuntimeException toException(Response response) {
        if (response.getStatus() == 404) return new BookNotFoundException();
        return null;
    }
}`,
    options: [
      "@ClientExceptionMapper",
      "@ServerExceptionMapper",
      "@Fallback",
      "@Provider"
    ],
    correct: 0,
    explanation: "Mientras que en el servidor se usa '@ServerExceptionMapper', en una interfaz de REST Client Reactive se usa '@ClientExceptionMapper' (de io.quarkus.rest.client.reactive.ClientExceptionMapper).",
    kidTip: "En el servidor = @ServerExceptionMapper | En la interfaz del cliente REST = @ClientExceptionMapper."
  },
  {
    id: "rc-ann-11",
    module: "restclient",
    category: "when",
    question: "¿Qué ocurre si inyectas tu interfaz 'ExpenseServiceClient' escribiendo únicamente `@Inject ExpenseServiceClient client;` (olvidando poner `@RestClient`)?",
    code: `@Path("/client")
public class ClientResource {
    @Inject
    // ¡Falta @RestClient aquí!
    ExpenseServiceClient client;
}`,
    options: [
      "Falla al compilar/arrancar con UnsatisfiedResolutionException porque el bean generado por @RegisterRestClient tiene el calificador CDI @RestClient",
      "Funciona normalmente sin ningún problema",
      "Llama a la base de datos local en vez del servicio HTTP",
      "Devuelve null en tiempo de ejecución sin lanzar error al arrancar"
    ],
    correct: 0,
    explanation: "Todo cliente registrado con '@RegisterRestClient' requiere el calificador '@RestClient' en el punto de inyección ('@Inject @RestClient' o simplemente '@RestClient').",
    kidTip: "¡Nunca olvides @RestClient al inyectar un cliente HTTP!"
  },
  {
    id: "rc-ann-12",
    module: "restclient",
    category: "annotation",
    question: "Si quieres propagar automáticamente la cabecera 'Authorization' que llegó a tu Resource REST hacia las llamadas que haga tu '@RegisterRestClient' a otros microservicios, ¿qué anotación colocas sobre la interfaz del cliente REST?",
    code: `@Path("/orders")
@RegisterRestClient(configKey = "orders-api")
// ¿Qué anotación reenvía automáticamente el token/cabeceras entrantes?
public interface OrdersClient { ... }`,
    options: [
      "@RegisterClientHeaders",
      "@ForwardHeaders",
      "@PropagateAuth",
      "@RolesAllowed"
    ],
    correct: 0,
    explanation: "'@RegisterClientHeaders' (de org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders) activa la propagación de cabeceras configuradas en 'org.eclipse.microprofile.rest.client.ext.ClientHeadersFactory' o en 'mp.rest.client.propagateHeaders'.",
    kidTip: "Para propagar cabeceras recibidas hacia el cliente REST: @RegisterClientHeaders."
  },
  {
    id: "rc-ann-13",
    module: "restclient",
    category: "when",
    question: "¿Se pueden colocar anotaciones de Fault Tolerance (@Retry, @Timeout, @CircuitBreaker, @Fallback) directamente sobre los métodos de una interfaz '@RegisterRestClient'?",
    code: `@Path("/weather")
@RegisterRestClient(configKey = "weather-api")
public interface WeatherClient {
    @GET
    @Retry(maxRetries = 3)
    @Timeout(1000)
    Forecast getForecast();
}`,
    options: [
      "Sí, las anotaciones de MicroProfile Fault Tolerance pueden colocarse directamente en los métodos de la interfaz @RegisterRestClient o en el servicio que la invoca",
      "No, las interfaces Java no permiten anotaciones @Retry ni @Timeout",
      "Solo funciona @Timeout pero no @Retry",
      "Solo funcionan si quitas @RegisterRestClient"
    ],
    correct: 0,
    explanation: "Quarkus genera un proxy CDI alrededor de la interfaz '@RegisterRestClient', por lo que '@Retry', '@Timeout', '@CircuitBreaker' y '@Fallback' funcionan perfectamente sobre sus métodos.",
    kidTip: "Puedes poner @Retry, @Timeout y @CircuitBreaker directamente en los métodos de tu interfaz @RegisterRestClient."
  },
  {
    id: "rc-ann-14",
    module: "restclient",
    category: "annotation",
    question: "En REST Client Reactive, necesitas enviar un parámetro de consulta fijo (por ejemplo '?format=json') en todas las peticiones de un método sin pasarlo como argumento Java. ¿Qué anotación de 'io.quarkus.rest.client.reactive' puedes poner sobre el método o interfaz?",
    code: `@GET
@Path("/report")
// ¿Qué anotación agrega un query param fijo en el REST Client?
Report getReport();`,
    options: [
      "@ClientQueryParam(name = \"format\", value = \"json\")",
      "@QueryParam(name = \"format\", defaultValue = \"json\")",
      "@WithQuery(\"format=json\")",
      "@DefaultValue(\"format=json\")"
    ],
    correct: 0,
    explanation: "Así como '@ClientHeaderParam' agrega cabeceras fijas o calculadas, '@ClientQueryParam(name = \"...\", value = \"...\")' agrega parámetros query automáticamente en REST Client Reactive.",
    kidTip: "Cabecera fija en cliente = @ClientHeaderParam | Query param fijo en cliente = @ClientQueryParam."
  },
  {
    id: "rc-ann-15",
    module: "restclient",
    category: "annotation",
    question: "¿Qué paquete debes importar para usar '@RegisterRestClient' y '@RestClient' en Quarkus?",
    code: `import _________________________________________________.RegisterRestClient;
import _________________________________________________.RestClient;`,
    options: [
      "org.eclipse.microprofile.rest.client.inject",
      "jakarta.ws.rs.client",
      "io.quarkus.rest.client",
      "org.jboss.resteasy.reactive.client"
    ],
    correct: 0,
    explanation: "Tanto '@RegisterRestClient' como '@RestClient' viven en el paquete estándar 'org.eclipse.microprofile.rest.client.inject'.",
    kidTip: "Ambas (@RegisterRestClient y @RestClient) están juntas en org.eclipse.microprofile.rest.client.inject."
  },
  {
    id: "rc-ann-16",
    module: "restclient",
    category: "when",
    question: "Si en tu interfaz '@RegisterRestClient' declaras un método que retorna 'Uni<List<Expense>>' en lugar de 'List<Expense>', ¿cuándo debes usar esta firma con 'Uni<...>'?",
    code: `@GET
Uni<List<Expense>> getAllAsync();`,
    options: [
      "Cuando quieres que la llamada HTTP saliente sea 100% asíncrona y no bloqueante (ideal cuando la llamas desde un endpoint reactivo o combinando múltiples llamadas con Mutiny)",
      "Cuando el servicio remoto devuelve texto plano en vez de JSON",
      "Cuando quieres que la llamada falle si tarda más de 1 segundo",
      "Solo cuando usas Kafka"
    ],
    correct: 0,
    explanation: "En REST Client Reactive, retornar 'Uni<T>' ejecuta la petición HTTP en el Event Loop (I/O thread) sin bloquear ningún hilo mientras espera la respuesta del servidor remoto.",
    kidTip: "Llamada cliente bloqueante = retorna T | Llamada cliente no bloqueante (reactiva) = retorna Uni<T>."
  },
  {
    id: "rc-ann-17",
    module: "restclient",
    category: "code",
    question: "Si tienes `@RegisterRestClient` SIN el atributo `configKey` sobre la interfaz `com.example.client.PaymentClient`, ¿cómo debes escribir la propiedad en `application.properties` para configurar su URL?",
    code: `package com.example.client;

@RegisterRestClient // <-- Sin configKey
public interface PaymentClient { ... }`,
    options: [
      "quarkus.rest-client.\"com.example.client.PaymentClient\".url=http://localhost:8081 (o com.example.client.PaymentClient/mp-rest/url)",
      "quarkus.rest-client.url=http://localhost:8081",
      "payment.url=http://localhost:8081",
      "No se puede configurar en application.properties si no tiene configKey"
    ],
    correct: 0,
    explanation: "Si no defines 'configKey', tienes que escribir el nombre completo de la clase con paquete ('com.example.client.PaymentClient'). Por eso siempre conviene poner 'configKey = \"nombre-corto\"'.",
    kidTip: "Pon siempre configKey = \"mi-api\" en @RegisterRestClient para no tener que escribir todo el paquete en application.properties."
  },
  {
    id: "rc-ann-18",
    module: "restclient",
    category: "annotation",
    question: "En una interfaz '@RegisterRestClient', un método '@DELETE @Path(\"/{uuid}\")' envía el UUID en la ruta. ¿Qué anotación debe llevar el parámetro 'UUID uuid'?",
    code: `@DELETE
@Path("/{uuid}")
Response deleteByUuid(____________________ UUID uuid);`,
    options: [
      "@PathParam(\"uuid\") (o @RestPath)",
      "@QueryParam(\"uuid\")",
      "@HeaderParam(\"uuid\")",
      "@ConfigProperty(name = \"uuid\")"
    ],
    correct: 0,
    explanation: "Cualquier variable entre llaves '{uuid}' en el '@Path' de la interfaz del cliente REST debe enlazarse al parámetro con '@PathParam(\"uuid\")' o '@RestPath'.",
    kidTip: "Si en el @Path hay {uuid}, el argumento del método lleva @PathParam(\"uuid\")."
  },
  {
    id: "rc-ann-19",
    module: "restclient",
    category: "when",
    question: "¿Necesitas poner '@ApplicationScoped' sobre una interfaz anotada con '@RegisterRestClient'?",
    code: `@Path("/expenses")
@RegisterRestClient(configKey = "expense-service")
public interface ExpenseServiceClient { ... }`,
    options: [
      "No es obligatorio en Quarkus; @RegisterRestClient ya registra automáticamente el proxy del cliente en CDI (aunque si el ejercicio lo pide explícitamente, puedes agregarlo)",
      "Está prohibido poner @ApplicationScoped y el código no compila",
      "En lugar de @ApplicationScoped debes poner @Entity",
      "Debes poner @Transactional sobre la interfaz"
    ],
    correct: 0,
    explanation: "En Quarkus, '@RegisterRestClient' genera automáticamente el bean CDI para la interfaz. Algunos ejercicios antiguos también añaden '@ApplicationScoped' o '@Singleton' por convención.",
    kidTip: "@RegisterRestClient ya convierte la interfaz en un bean inyectable con @Inject @RestClient."
  },
  {
    id: "rc-ann-20",
    module: "restclient",
    category: "annotation",
    question: "Cuando el cliente REST envía un objeto 'Expense' en un método '@POST Response create(Expense expense);', ¿hace falta poner alguna anotación delante del parámetro 'Expense expense'?",
    code: `@POST
Response create(Expense expense);`,
    options: [
      "No; en Jakarta REST el parámetro que NO tiene @PathParam, @QueryParam ni @HeaderParam se envía automáticamente como el cuerpo (Entity Body) de la petición HTTP",
      "Sí, es obligatorio poner @BodyParam delante de Expense",
      "Sí, es obligatorio poner @FormParam delante de Expense",
      "Sí, es obligatorio poner @Context delante de Expense"
    ],
    correct: 0,
    explanation: "En Jakarta REST (tanto en servidor como en cliente), el parámetro sin anotación de ruta/cabecera representa el cuerpo JSON de la petición HTTP.",
    kidTip: "El objeto que va en el cuerpo JSON de un @POST o @PUT NO lleva @PathParam ni @QueryParam."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 6: MICROPROFILE FAULT TOLERANCE (faulttolerance) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "ft-ann-7",
    module: "faulttolerance",
    category: "annotation",
    question: "En '@Timeout', si quieres especificar que el valor es 2 SEGUNDOS en lugar de escribir 2000 milisegundos, ¿qué atributos usas?",
    code: `// ¿Cómo configuras un @Timeout de 2 segundos usando ChronoUnit?
public List<Warning> fetchWarnings() { ... }`,
    options: [
      "@Timeout(value = 2, unit = ChronoUnit.SECONDS)",
      "@Timeout(seconds = 2)",
      "@Timeout(duration = \"2s\")",
      "@Timeout(time = 2, type = TimeUnit.SECONDS)"
    ],
    correct: 0,
    explanation: "Por defecto 'value' en '@Timeout' está en 'ChronoUnit.MILLIS' (y su valor por defecto si pones '@Timeout' vacío es 1000 ms). Puedes cambiar la unidad con 'unit = ChronoUnit.SECONDS'.",
    kidTip: "@Timeout sin argumentos = 1000 ms. Con unidad = @Timeout(value = 2, unit = ChronoUnit.SECONDS)."
  },
  {
    id: "ft-ann-8",
    module: "faulttolerance",
    category: "annotation",
    question: "Si colocas `@Timeout` sin ningún parámetro (`@Timeout`) sobre un método, ¿cuál es el tiempo máximo por defecto antes de lanzar `TimeoutException`?",
    code: `@GET
@Timeout // <-- Sin argumentos
public String slowEndpoint() { ... }`,
    options: [
      "1000 milisegundos (1 segundo)",
      "5000 milisegundos (5 segundos)",
      "30000 milisegundos (30 segundos)",
      "0 milisegundos"
    ],
    correct: 0,
    explanation: "Según la especificación MicroProfile Fault Tolerance, el valor por defecto de '@Timeout' es '1000' milisegundos.",
    kidTip: "@Timeout solito = 1000 ms (1 segundo)."
  },
  {
    id: "ft-ann-9",
    module: "faulttolerance",
    category: "annotation",
    question: "Si colocas `@Retry` sin ningún atributo (`@Retry`) sobre un método, ¿cuántos reintentos hace por defecto?",
    code: `@GET
@Retry // <-- Sin argumentos
public String unstableEndpoint() { ... }`,
    options: [
      "3 reintentos (maxRetries = 3 por defecto)",
      "1 reintento",
      "5 reintentos",
      "Infinitos reintentos"
    ],
    correct: 0,
    explanation: "El valor por defecto de 'maxRetries' en '@Retry' es 3 (lo que significa hasta 1 ejecución inicial + 3 reintentos = 4 llamadas totales).",
    kidTip: "@Retry solito tiene maxRetries = 3 por defecto."
  },
  {
    id: "ft-ann-10",
    module: "faulttolerance",
    category: "annotation",
    question: "En '@Retry', quieres agregar una variación aleatoria (jitter) de +/- 100 ms al tiempo de espera ('delay = 500') para evitar que todos los clientes reintenten exactamente en el mismo milisegundo. ¿Cómo se llama ese atributo?",
    code: `@Retry(maxRetries = 4, delay = 500, ___________________ = 100)
public Response callRemote() { ... }`,
    options: [
      "jitter",
      "randomDelay",
      "variance",
      "spread"
    ],
    correct: 0,
    explanation: "El atributo 'jitter' en '@Retry' (por defecto 200 ms) añade una variación aleatoria entre '-jitter' y '+jitter' al 'delay' configurado.",
    kidTip: "jitter = variación aleatoria en el delay de @Retry para que no choquen todos a la vez."
  },
  {
    id: "ft-ann-11",
    module: "faulttolerance",
    category: "annotation",
    question: "En '@Fallback', además de 'fallbackMethod = \"...\"', ¿qué atributo usarías si el método de respaldo está implementado en una CLASE separada que implementa 'FallbackHandler<T>'?",
    code: `// ¿Qué atributo de @Fallback recibe una clase FallbackHandler<T>?
public List<Park> getParks() { ... }`,
    options: [
      "@Fallback(value = MyParkFallbackHandler.class) (o @Fallback(MyParkFallbackHandler.class))",
      "@Fallback(handlerClass = MyParkFallbackHandler.class)",
      "@Fallback(fallbackClass = MyParkFallbackHandler.class)",
      "@FallbackHandler(MyParkFallbackHandler.class)"
    ],
    correct: 0,
    explanation: "'@Fallback' permite usar 'fallbackMethod = \"nombreMetodoEnLaMismaClase\"' o bien 'value = MiClaseHandler.class' (que implemente 'org.eclipse.microprofile.faulttolerance.FallbackHandler<T>').",
    kidTip: "Misma clase = @Fallback(fallbackMethod = \"...\") | Clase aparte = @Fallback(MiHandler.class)."
  },
  {
    id: "ft-ann-12",
    module: "faulttolerance",
    category: "when",
    question: "En '@Fallback', quieres que el método de respaldo NO se active si el método lanza 'NotFoundException' (para que el 404 llegue directo al cliente), pero SÍ se active con cualquier otra excepción. ¿Qué atributo de '@Fallback' usas?",
    code: `@Fallback(
    fallbackMethod = "defaultSpeaker",
    _________________________ = NotFoundException.class
)
public Speaker getSpeaker(Long id) { ... }`,
    options: [
      "skipOn = NotFoundException.class",
      "abortOn = NotFoundException.class",
      "ignore = NotFoundException.class",
      "exclude = NotFoundException.class"
    ],
    correct: 0,
    explanation: "¡Atención a la diferencia de nombres!: En '@Fallback' los atributos son 'applyOn' y 'skipOn'. En '@Retry' y '@CircuitBreaker' son 'retryOn'/'failOn' y 'abortOn'/'skipOn'.",
    kidTip: "En @Fallback para saltar una excepción se usa skipOn = Excepcion.class."
  },
  {
    id: "ft-ann-13",
    module: "faulttolerance",
    category: "when",
    question: "Un método tiene al mismo tiempo `@Timeout(500)`, `@Retry(maxRetries = 2)` y `@Fallback(fallbackMethod = \"planB\")`. Si el servicio remoto tarda 2000 ms en cada llamada, ¿qué ocurre exactamente cuando alguien invoca el método?",
    code: `@Timeout(500)
@Retry(maxRetries = 2)
@Fallback(fallbackMethod = "planB")
public String fetchData() { ... }`,
    options: [
      "Intenta la llamada original (corta a los 500 ms con TimeoutException), hace 2 reintentos más (cortando cada uno a los 500 ms) y, al fallar los 3 intentos totales, ejecuta el método 'planB'",
      "Ejecuta 'planB' a los 500 ms sin hacer ningún reintento",
      "El @Timeout(500) aplica a la suma de todos los reintentos",
      "Lanza TimeoutException al cliente sin ejecutar 'planB'"
    ],
    correct: 0,
    explanation: "En MicroProfile Fault Tolerance, '@Timeout' envuelve cada intento individual; '@Retry' reintenta cuando '@Timeout' lanza 'TimeoutException'; y '@Fallback' se ejecuta al final cuando todos los reintentos han fallado.",
    kidTip: "Orden de ejecución: cada intento tiene su @Timeout -> si falla, @Retry vuelve a intentar -> si se acaban los intentos, entra @Fallback."
  },
  {
    id: "ft-ann-14",
    module: "faulttolerance",
    category: "annotation",
    question: "En '@CircuitBreaker', ¿qué significan exactamente 'requestVolumeThreshold = 10' y 'failureRatio = 0.4'?",
    code: `@CircuitBreaker(requestVolumeThreshold = 10, failureRatio = 0.4, delay = 3000)`,
    options: [
      "Evalúa una ventana móvil de 10 peticiones consecutivas y abre el circuito si al menos 4 de ellas (40%) fallan",
      "Permite máximo 10 usuarios al mismo tiempo y falla el 40% de las veces",
      "Reintenta 10 veces con una pausa de 0.4 segundos",
      "Abre el circuito después de 10 fallos seguidos sin importar cuántas tuvieron éxito"
    ],
    correct: 0,
    explanation: "'requestVolumeThreshold' es el tamaño de la ventana rodante de llamadas (10), y 'failureRatio' es la proporción de fallos dentro de esa ventana (10 * 0.4 = 4 fallos) que dispara la apertura del circuito.",
    kidTip: "Multiplica requestVolumeThreshold × failureRatio para saber cuántos fallos abren el circuito (10 × 0.4 = 4 fallos)."
  },
  {
    id: "ft-ann-15",
    module: "faulttolerance",
    category: "annotation",
    question: "Cuando un '@CircuitBreaker' está ABIERTO (OPEN) porque se superó el umbral de fallos, ¿qué excepción lanza inmediatamente sin ejecutar el método?",
    code: `// Excepción lanzada mientras el circuito está en estado OPEN:`,
    options: [
      "CircuitBreakerOpenException",
      "TimeoutException",
      "BulkheadException",
      "ServiceUnavailableException"
    ],
    correct: 0,
    explanation: "Mientras el circuito está abierto (durante el tiempo 'delay'), cualquier llamada falla instantáneamente con 'org.eclipse.microprofile.faulttolerance.exceptions.CircuitBreakerOpenException' (lo cual también activa '@Fallback' si está presente).",
    kidTip: "Circuito abierto = lanza CircuitBreakerOpenException al instante sin tocar el método."
  },
  {
    id: "ft-ann-16",
    module: "faulttolerance",
    category: "annotation",
    question: "En '@CircuitBreaker', una vez que transcurre el tiempo de 'delay' y el circuito pasa a estado SEMI-ABIERTO (HALF-OPEN), ¿qué atributo define cuántas llamadas de prueba consecutivas deben tener éxito para que el circuito vuelva a CERRARSE por completo?",
    code: `@CircuitBreaker(
    requestVolumeThreshold = 4,
    failureRatio = 0.5,
    delay = 5000,
    _________________________ = 3
)`,
    options: [
      "successThreshold",
      "recoveryCount",
      "closeThreshold",
      "halfOpenSuccesses"
    ],
    correct: 0,
    explanation: "'successThreshold' (por defecto 1) indica cuántos éxitos seguidos en estado 'half-open' se requieren para cerrar nuevamente el circuito.",
    kidTip: "successThreshold = éxitos seguidos necesarios para declarar sano el servicio y cerrar el circuito."
  },
  {
    id: "ft-ann-17",
    module: "faulttolerance",
    category: "annotation",
    question: "¿Qué anotación de MicroProfile Fault Tolerance limita el número máximo de llamadas simultáneas (concurrentes) a un método para evitar que una operación pesada agote todos los hilos?",
    code: `// ¿Qué anotación permite máximo 5 ejecuciones en paralelo?
public List<Report> heavyCalculation() { ... }`,
    options: [
      "@Bulkhead(5)",
      "@CircuitBreaker(requestVolumeThreshold = 5)",
      "@MaxThreads(5)",
      "@Throttle(5)"
    ],
    correct: 0,
    explanation: "'@Bulkhead(5)' (compartimento estanco) restringe la concurrencia máxima a 5 llamadas simultáneas; la sexta llamada concurrente lanza 'BulkheadException'.",
    kidTip: "Limitar llamadas al mismo tiempo (concurrencia) = @Bulkhead."
  },
  {
    id: "ft-ann-18",
    module: "faulttolerance",
    category: "when",
    question: "¿Cómo puedes cambiar en 'application.properties' el parámetro 'maxRetries' de un método anotado con '@Retry' en la clase 'com.example.WeatherService' y método 'getForecast' sin recompilar el código?",
    code: `# Sobrescribir atributo de anotación Fault Tolerance en application.properties:`,
    options: [
      "com.example.WeatherService/getForecast/Retry/maxRetries=5 (o globalmente Retry/maxRetries=5)",
      "quarkus.fault-tolerance.retry.max=5",
      "@Retry.maxRetries=5",
      "No se pueden cambiar por configuración, solo en código Java"
    ],
    correct: 0,
    explanation: "MicroProfile Fault Tolerance permite sobrescribir cualquier parámetro de cualquier anotación en 'application.properties' usando el formato '<Clase>/<metodo>/<Anotacion>/<atributo>=valor' o '<Anotacion>/<atributo>=valor'.",
    kidTip: "Puedes ajustar cualquier anotación Fault Tolerance en properties con: Clase/metodo/Anotacion/atributo=valor."
  },
  {
    id: "ft-ann-19",
    module: "faulttolerance",
    category: "annotation",
    question: "Si quieres desactivar temporalmente todas las anotaciones de Fault Tolerance (@Retry, @CircuitBreaker, @Timeout) durante una prueba rápida (dejando solo activo @Fallback), ¿qué propiedad pones en application.properties?",
    code: `# application.properties`,
    options: [
      "MP_Fault_Tolerance_NonFallback_Enabled=false",
      "quarkus.fault-tolerance.disabled=true",
      "mp.retry.enabled=false",
      "smallrye.faulttolerance.off=true"
    ],
    correct: 0,
    explanation: "La propiedad estándar 'MP_Fault_Tolerance_NonFallback_Enabled=false' desactiva todas las políticas excepto '@Fallback'.",
    kidTip: "MP_Fault_Tolerance_NonFallback_Enabled=false apaga todo menos @Fallback."
  },
  {
    id: "ft-ann-20",
    module: "faulttolerance",
    category: "annotation",
    question: "En '@CircuitBreaker', ¿cómo se llama el atributo que indica qué excepciones cuentan como un fallo para abrir el circuito (su equivalente a 'retryOn' de @Retry)?",
    code: `@CircuitBreaker(
    requestVolumeThreshold = 4,
    _____________________ = { IOException.class, TimeoutException.class }
)`,
    options: [
      "failOn",
      "retryOn",
      "applyOn",
      "openOn"
    ],
    correct: 0,
    explanation: "En '@CircuitBreaker' los atributos de filtrado de excepciones son 'failOn' y 'skipOn'.",
    kidTip: "En @Retry = retryOn/abortOn | En @CircuitBreaker = failOn/skipOn | En @Fallback = applyOn/skipOn."
  },
  {
    id: "ft-ann-21",
    module: "faulttolerance",
    category: "annotation",
    question: "¿De qué paquete debes importar '@Retry', '@Timeout', '@CircuitBreaker', '@Fallback' y '@Bulkhead'?",
    code: `import ___________________________________________.Retry;
import ___________________________________________.Fallback;`,
    options: [
      "org.eclipse.microprofile.faulttolerance",
      "io.smallrye.faulttolerance.api",
      "jakarta.enterprise.concurrent",
      "io.quarkus.faulttolerance"
    ],
    correct: 0,
    explanation: "Todas las anotaciones estándar de tolerancia a fallos pertenecen a 'org.eclipse.microprofile.faulttolerance'.",
    kidTip: "Todas vienen de org.eclipse.microprofile.faulttolerance."
  }
);

// ============================================================================
// BLOQUE ADICIONAL 2: +15 PREGUNTAS DE ANOTACIONES POR SECCIÓN (Secciones 7 a 11)
// ============================================================================
window.QUESTION_BANK.push(
  // -------------------------------------------------------------------------
  // SECCIÓN 7: MICROPROFILE HEALTH CHECK (health) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "hc-ann-4",
    module: "health",
    category: "annotation",
    question: "Quieres crear una sonda que compruebe si la aplicación ya terminó su fase inicial de calentamiento y se exponga en '/q/health/started'. ¿Qué anotaciones colocas sobre la clase?",
    code: `// ¿Qué dos anotaciones registran la sonda en /q/health/started?
public class CacheWarmupCheck implements HealthCheck {
    @Override
    public HealthCheckResponse call() {
        return HealthCheckResponse.up("Warmup complete");
    }
}`,
    options: [
      "@Startup y @ApplicationScoped",
      "@Started y @Singleton",
      "@Liveness y @PostConstruct",
      "@Readiness y @StartupProbe"
    ],
    correct: 0,
    explanation: "'@Startup' (de org.eclipse.microprofile.health.Startup) junto con '@ApplicationScoped' registra una sonda de inicio en '/q/health/started'.",
    kidTip: "@Startup = /q/health/started | @Liveness = /q/health/live | @Readiness = /q/health/ready."
  },
  {
    id: "hc-ann-5",
    module: "health",
    category: "when",
    question: "Si creas una clase que implementa 'HealthCheck' y le pones '@ApplicationScoped', pero OLVIDAS ponerle '@Liveness', '@Readiness' o '@Startup', ¿aparecerá en '/q/health'?",
    code: `@ApplicationScoped
// ¡Falta @Liveness, @Readiness o @Startup!
public class OrphanCheck implements HealthCheck { ... }`,
    options: [
      "No; en MicroProfile Health los calificadores @Liveness, @Readiness o @Startup son obligatorios para que Quarkus descubra y ejecute el HealthCheck",
      "Sí, se registra como @Liveness por defecto",
      "Sí, se registra como @Readiness por defecto",
      "Lanza error de compilación en Java"
    ],
    correct: 0,
    explanation: "Sin uno de los calificadores CDI ('@Liveness', '@Readiness' o '@Startup'), Quarkus no sabe a qué grupo de sondas pertenece la clase y la ignora.",
    kidTip: "Todo HealthCheck necesita el trío: (@Liveness o @Readiness o @Startup) + @ApplicationScoped + implements HealthCheck."
  },
  {
    id: "hc-ann-6",
    module: "health",
    category: "when",
    question: "¿Se puede colocar '@Liveness' y '@Readiness' AL MISMO TIEMPO sobre la misma clase que implementa 'HealthCheck'?",
    code: `@Liveness
@Readiness
@ApplicationScoped
public class CombinedHealthCheck implements HealthCheck { ... }`,
    options: [
      "Sí; si colocas ambas anotaciones sobre la misma clase, esa sonda se ejecutará tanto en /q/health/live como en /q/health/ready",
      "No, son mutuamente excluyentes y Quarkus falla al arrancar",
      "Solo toma en cuenta la primera anotación e ignora la segunda",
      "Solo se permite si también agregas @Startup"
    ],
    correct: 0,
    explanation: "Una misma clase 'HealthCheck' puede anotarse con '@Liveness' y '@Readiness' simultáneamente si quieres que la misma verificación aplique a ambos endpoints.",
    kidTip: "Puedes combinar @Liveness y @Readiness en la misma clase si el chequeo aplica para ambos."
  },
  {
    id: "hc-ann-7",
    module: "health",
    category: "code",
    question: "Cuando el examen NO te pide incluir datos adicionales ('withData') sino solo devolver estado UP con el nombre 'Simple health check', ¿cuál es el método estático más corto de 'HealthCheckResponse'?",
    code: `@Override
public HealthCheckResponse call() {
    return _____________________________________________________;
}`,
    options: [
      "HealthCheckResponse.up(\"Simple health check\")",
      "HealthCheckResponse.ok(\"Simple health check\")",
      "new HealthCheckResponse(\"Simple health check\", true)",
      "HealthCheckResponse.named(\"Simple health check\")"
    ],
    correct: 0,
    explanation: "'HealthCheckResponse.up(\"nombre\")' y 'HealthCheckResponse.down(\"nombre\")' construyen y devuelven directamente el 'HealthCheckResponse' sin necesidad de llamar a '.build()'.",
    kidTip: "Sin withData: HealthCheckResponse.up(\"nombre\"). Con withData: HealthCheckResponse.named(\"nombre\").withData(...).up().build()."
  },
  {
    id: "hc-ann-8",
    module: "health",
    category: "code",
    question: "En el método 'call()' de una sonda '@Readiness', tienes una variable 'boolean isReady'. ¿Cómo usas el método '.status(boolean)' de 'HealthCheckResponseBuilder' para evitar escribir un 'if/else'?",
    code: `boolean isReady = checkExternalService();
return HealthCheckResponse.named("External API")
        .___________________________________
        .build();`,
    options: [
      "status(isReady)",
      "up(isReady)",
      "setHealthy(isReady)",
      "state(isReady)"
    ],
    correct: 0,
    explanation: "'HealthCheckResponseBuilder.status(boolean up)' establece UP si recibe 'true' y DOWN si recibe 'false'.",
    kidTip: ".status(booleano).build() elige automáticamente entre UP (true) y DOWN (false)."
  },
  {
    id: "hc-ann-9",
    module: "health",
    category: "code",
    question: "¿Qué código de estado HTTP devuelve '/q/health/ready' cuando al menos UNA de las sondas anotadas con '@Readiness' responde 'DOWN'?",
    code: `# Respuesta HTTP de /q/health/ready cuando un chequeo falla (DOWN):`,
    options: [
      "503 Service Unavailable",
      "200 OK",
      "500 Internal Server Error",
      "404 Not Found"
    ],
    correct: 0,
    explanation: "Cuando todas las sondas están UP devuelve '200 OK'. Si cualquiera está DOWN, el estado global pasa a DOWN y devuelve '503 Service Unavailable'.",
    kidTip: "Health UP = HTTP 200 OK | Health DOWN = HTTP 503 Service Unavailable."
  },
  {
    id: "hc-ann-10",
    module: "health",
    category: "annotation",
    question: "¿De qué paquete debes importar '@Liveness', '@Readiness', '@Startup', 'HealthCheck' y 'HealthCheckResponse'?",
    code: `import ____________________________________.Liveness;
import ____________________________________.Readiness;
import ____________________________________.HealthCheck;`,
    options: [
      "org.eclipse.microprofile.health",
      "io.smallrye.health",
      "io.quarkus.health",
      "jakarta.Diagnostics.health"
    ],
    correct: 0,
    explanation: "Todas las interfaces y anotaciones estándar de sondas de salud viven en 'org.eclipse.microprofile.health'.",
    kidTip: "Todo lo de Health Check vive en org.eclipse.microprofile.health."
  },
  {
    id: "hc-ann-11",
    module: "health",
    category: "when",
    question: "Agregas 'quarkus-smallrye-health' y 'quarkus-hibernate-orm-panache' con PostgreSQL a tu proyecto. Sin que tú escribas ninguna clase '@Readiness', ¿qué aparece automáticamente en '/q/health/ready'?",
    code: `# Sondas automáticas de extensiones de Quarkus:`,
    options: [
      "Quarkus registra automáticamente una sonda de @Readiness para validar la conexión al DataSource (base de datos) y a Kafka si están presentes",
      "No aparece nada hasta que escribas manualmente un HealthCheck para PostgreSQL",
      "Desactiva la base de datos",
      "Solo registra una sonda @Liveness pero ninguna @Readiness"
    ],
    correct: 0,
    explanation: "Las extensiones de Quarkus (Agroal DataSource, Kafka, Mongo, etc.) incluyen sus propias sondas '@Readiness' automáticas en cuanto detectan 'quarkus-smallrye-health'.",
    kidTip: "Con quarkus-smallrye-health, la base de datos y Kafka ya traen su propio @Readiness de regalo."
  },
  {
    id: "hc-ann-12",
    module: "health",
    category: "code",
    question: "Quieres que la interfaz gráfica web de Health UI ('/q/health-ui') se incluya siempre, incluso en modo producción. ¿Qué propiedad agregas en 'application.properties'?",
    code: `# application.properties
________________________________________ = true`,
    options: [
      "quarkus.smallrye-health.ui.always-include",
      "quarkus.health-ui.enabled",
      "mp.health.ui.always",
      "quarkus.swagger-ui.always-include"
    ],
    correct: 0,
    explanation: "'quarkus.smallrye-health.ui.always-include=true' mantiene habilitada la interfaz visual de salud en producción.",
    kidTip: "Para Swagger es quarkus.swagger-ui.always-include; para Health es quarkus.smallrye-health.ui.always-include."
  },
  {
    id: "hc-ann-13",
    module: "health",
    category: "annotation",
    question: "Si dentro de tu clase `@Readiness public class WeatherHealthCheck implements HealthCheck` necesitas verificar si el servicio remoto `WeatherClient` responde, ¿con qué anotaciones inyectas `WeatherClient` dentro del HealthCheck?",
    code: `@Readiness
@ApplicationScoped
public class WeatherHealthCheck implements HealthCheck {
    // ¿Cómo inyectas el REST Client dentro de tu sonda de salud?
    WeatherClient weatherClient;
}`,
    options: [
      "@Inject @RestClient",
      "@ConfigProperty",
      "@ReadinessClient",
      "@Context"
    ],
    correct: 0,
    explanation: "Como tu clase 'HealthCheck' es un bean '@ApplicationScoped', puedes inyectar en ella cualquier '@ConfigProperty', otro bean con '@Inject', o un cliente HTTP con '@Inject @RestClient'.",
    kidTip: "En los laboratorios de DO378 es muy común inyectar @Inject @RestClient o @ConfigProperty dentro de un @Readiness HealthCheck."
  },
  {
    id: "hc-ann-14",
    module: "health",
    category: "when",
    question: "En el ejercicio del Capítulo 7 (DO378), una sonda '@Readiness' necesita leer la propiedad 'weather.host' desde 'application.properties' y agregarla como dato extra en la respuesta ('withData(\"host\", host)'). ¿Qué anotación usas para leer 'weather.host' dentro de la clase HealthCheck?",
    code: `@Readiness
@ApplicationScoped
public class ReadinessHealthResource implements HealthCheck {
    // ¿Qué anotación lee weather.host desde application.properties?
    String host;
}`,
    options: [
      "@ConfigProperty(name = \"weather.host\")",
      "@WithName(\"weather.host\")",
      "@HeaderParam(\"weather.host\")",
      "@HealthData(\"weather.host\")"
    ],
    correct: 0,
    explanation: "Se inyecta con '@ConfigProperty(name = \"weather.host\")' y luego dentro de 'call()' se pasa a '.withData(\"host\", host)'.",
    kidTip: "@ConfigProperty + .withData(\"clave\", valor) es el combo clásico de los ejercicios de Health Check en el examen."
  },
  {
    id: "hc-ann-15",
    module: "health",
    category: "code",
    question: "¿Qué tipos de valores acepta el segundo argumento del método `.withData(String key, ...)` en `HealthCheckResponseBuilder`?",
    code: `HealthCheckResponse.named("check")
    .withData("key", valor)`,
    options: [
      "String, long o boolean",
      "Cualquier objeto Java arbitrario o List<Object>",
      "Solo String",
      "Solo números enteros"
    ],
    correct: 0,
    explanation: "'withData' está sobrecargado para aceptar únicamente valores 'String', 'long' o 'boolean'.",
    kidTip: "withData acepta String, long o boolean."
  },
  {
    id: "hc-ann-16",
    module: "health",
    category: "when",
    question: "Si quieres consultar en una sola llamada HTTP TODAS las sondas de la aplicación (@Startup + @Liveness + @Readiness juntas), ¿a qué ruta haces GET?",
    code: `# Ruta que agrupa todas las sondas de salud:`,
    options: [
      "/q/health",
      "/q/health/all",
      "/q/health/summary",
      "/health/complete"
    ],
    correct: 0,
    explanation: "'/q/health' devuelve el estado combinado de todas las sondas registradas en la aplicación.",
    kidTip: "/q/health = todas juntas | /q/health/live = @Liveness | /q/health/ready = @Readiness | /q/health/started = @Startup."
  },
  {
    id: "hc-ann-17",
    module: "health",
    category: "annotation",
    question: "Si en una clase CDI quieres producir varias sondas '@Liveness' usando métodos productores en vez de crear una clase por cada sonda, ¿qué anotación colocas junto a '@Liveness' sobre el método que retorna 'HealthCheck'?",
    code: `@ApplicationScoped
public class HealthProducers {
    @Liveness
    // ¿Qué anotación de CDI convierte un método en productor de un bean HealthCheck?
    HealthCheck memoryCheck() {
        return () -> HealthCheckResponse.up("memory-ok");
    }
}`,
    options: [
      "@Produces (de jakarta.enterprise.inject.Produces)",
      "@Provides",
      "@Bean",
      "@RegisterHealth"
    ],
    correct: 0,
    explanation: "Como 'HealthCheck' es una interfaz funcional ('() -> HealthCheckResponse'), también puedes exponer sondas mediante métodos anotados con '@Produces @Liveness' (de jakarta.enterprise.inject.Produces).",
    kidTip: "Como HealthCheck tiene un solo método call(), puedes incluso producirlo con una lambda () -> HealthCheckResponse.up(\"...\")."
  },
  {
    id: "hc-ann-18",
    module: "health",
    category: "code",
    question: "Quieres deshabilitar las sondas de salud automáticas que agregan las extensiones (como la del DataSource) dejando únicamente las clases HealthCheck que tú programaste. ¿Qué propiedad usas en application.properties?",
    code: `# application.properties
_______________________________________________ = false`,
    options: [
      "mp.health.default-procedures.enabled (o quarkus.DataSource.health.enabled=false para solo BD)",
      "quarkus.health.auto=false",
      "smallrye.health.extensions=false",
      "mp.health.disable-all=true"
    ],
    correct: 0,
    explanation: "Puedes desactivar una sonda de extensión con 'quarkus.datasource.health.enabled=false' o las globales por defecto con 'mp.health.default-procedures.enabled=false'.",
    kidTip: "Si en un test sin BD la sonda automática de DataSource da DOWN, puedes apagarla con quarkus.datasource.health.enabled=false."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 8: MICROMETER METRICS (metrics) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "met-ann-5",
    module: "metrics",
    category: "annotation",
    question: "Quieres que un método con '@Counted' solo incremente el contador cuando el método LANCE UNA EXCEPCIÓN (para contar únicamente los errores). ¿Qué atributo de '@Counted' configuras?",
    code: `@Counted(value = "parks.errors.counter", _____________________________ = true)
public void processPark(Park p) { ... }`,
    options: [
      "recordFailuresOnly",
      "onlyOnError",
      "exceptionsOnly",
      "countErrors"
    ],
    correct: 0,
    explanation: "El atributo 'recordFailuresOnly = true' en '@Counted' (de io.micrometer.core.annotation.Counted) hace que el contador solo se incremente si la llamada falla con excepción.",
    kidTip: "En @Counted, recordFailuresOnly = true cuenta solo cuando el método explota con error."
  },
  {
    id: "met-ann-6",
    module: "metrics",
    category: "annotation",
    question: "En las anotaciones '@Counted' o '@Timed' de Micrometer, ¿cómo agregas etiquetas adicionales (por ejemplo 'region=latam' y 'type=public') directamente en la anotación?",
    code: `@Timed(
    value = "parks.check.timer",
    ________________________________________________
)
public void check() { ... }`,
    options: [
      "extraTags = { \"region\", \"latam\", \"type\", \"public\" }",
      "tags = Map.of(\"region\", \"latam\")",
      "labels = \"region=latam,type=public\"",
      "withTags = { @Tag(\"region\", \"latam\") }"
    ],
    correct: 0,
    explanation: "Tanto '@Counted' como '@Timed' tienen el atributo 'extraTags', que recibe un arreglo de Strings con pares clave, valor ('{\"clave1\", \"valor1\", \"clave2\", \"valor2\"}').",
    kidTip: "En @Counted y @Timed el atributo de etiquetas se llama extraTags = {\"clave\", \"valor\"}."
  },
  {
    id: "met-ann-7",
    module: "metrics",
    category: "when",
    question: "¡Cuidado con los paquetes! En Quarkus 3.8 se usa Micrometer en lugar del antiguo MicroProfile Metrics. ¿De qué paquete debes importar '@Counted' y '@Timed'?",
    code: `import ____________________________________.Counted;
import ____________________________________.Timed;`,
    options: [
      "io.micrometer.core.annotation",
      "org.eclipse.microprofile.metrics.annotation",
      "io.smallrye.metrics",
      "jakarta.metrics"
    ],
    correct: 0,
    explanation: "En Quarkus 3.8 y el examen EX378, las métricas usan la extensión 'quarkus-micrometer-registry-prometheus', cuyas anotaciones vienen de 'io.micrometer.core.annotation'.",
    kidTip: "En métricas elige siempre el paquete io.micrometer.core... (NO org.eclipse.microprofile.metrics)."
  },
  {
    id: "met-ann-8",
    module: "metrics",
    category: "annotation",
    question: "¿De qué paquete debes importar `MeterRegistry` y `Tags` cuando programas métricas con `@Inject MeterRegistry registry`?",
    code: `import ____________________________________.MeterRegistry;
import ____________________________________.Tags;`,
    options: [
      "io.micrometer.core.instrument",
      "io.micrometer.core.annotation",
      "org.eclipse.microprofile.metrics",
      "io.prometheus.client"
    ],
    correct: 0,
    explanation: "'MeterRegistry', 'Counter', 'Timer' y 'Tags' pertenecen al paquete 'io.micrometer.core.instrument'.",
    kidTip: "Anotaciones (@Counted, @Timed) = io.micrometer.core.annotation | Clases (MeterRegistry, Tags) = io.micrometer.core.instrument."
  },
  {
    id: "met-ann-9",
    module: "metrics",
    category: "when",
    question: "¿Por qué el registro de un `registry.gauge(...)` suele colocarse dentro de un método anotado con `@PostConstruct` (o en el constructor del bean) en lugar de llamarse dentro del método `@GET` en cada petición?",
    code: `@PostConstruct
void initMeters() {
    registry.gauge("weather.level.gauge", Tags.empty(), this, ParkGuard::getLastWarningLevel);
}`,
    options: [
      "Porque un Gauge solo necesita registrarse UNA vez al crearse el bean; a partir de ahí Micrometer llamará automáticamente al método referenciado (ParkGuard::getLastWarningLevel) cada vez que alguien consulte /q/metrics",
      "Porque registry.gauge lanza excepción si se llama dentro de un método @GET",
      "Porque @PostConstruct se ejecuta en cada petición HTTP",
      "Porque Gauge requiere una transacción de base de datos"
    ],
    correct: 0,
    explanation: "A diferencia de un Counter (que incrementas en cada evento), el Gauge conecta un cable observador hacia tu objeto ('this') al iniciar el bean en '@PostConstruct'.",
    kidTip: "Gauge se conecta una sola vez en @PostConstruct; Counter y Timer se usan dentro de los métodos de negocio."
  },
  {
    id: "met-ann-10",
    module: "metrics",
    category: "code",
    question: "Si el método que quieres cronometrar con `registry.timer(\"mi.timer\")` retorna `void` (no devuelve ningún valor), ¿cómo lo envuelves o ejecutas con el Timer?",
    code: `// El método doMaintenance() retorna void:
registry.timer("maintenance.timer").______________________________;`,
    options: [
      "record(() -> doMaintenance()) (o .wrap((Runnable) () -> doMaintenance()).run())",
      "wrap(() -> doMaintenance()).get()",
      "increment(() -> doMaintenance())",
      "gauge(() -> doMaintenance())"
    ],
    correct: 0,
    explanation: "Cuando la acción retorna un valor usas '.wrap((Supplier<T>) () -> ...).get()' o '.recordCallable(...)'. Cuando retorna 'void' usas '.record(() -> ...)' o '.wrap((Runnable) () -> ...).run()'.",
    kidTip: "Con retorno = .wrap((Supplier<T>) () -> ...).get() | Con void = .record(() -> ...) o .wrap((Runnable) ...).run()."
  },
  {
    id: "met-ann-11",
    module: "metrics",
    category: "code",
    question: "Quieres agregar una etiqueta (Tag) `\"city\" = \"Madrid\"` al incrementar un contador con `MeterRegistry`. ¿Cuál es la sintaxis correcta?",
    code: `registry.counter("warnings.counter", ___________________________).increment();`,
    options: [
      "Tags.of(\"city\", \"Madrid\") (o pasando los Strings directos \"city\", \"Madrid\")",
      "Map.of(\"city\", \"Madrid\")",
      "new Tag(\"city=Madrid\")",
      "@Tag(name = \"city\", value = \"Madrid\")"
    ],
    correct: 0,
    explanation: "'registry.counter(nombre, Tags.of(\"k\", \"v\"))' o 'registry.counter(nombre, \"k\", \"v\")' registra el contador con esas etiquetas en Prometheus.",
    kidTip: "Para poner etiquetas en MeterRegistry usa Tags.of(\"clave\", \"valor\") o Tags.empty() si no lleva etiquetas."
  },
  {
    id: "met-ann-12",
    module: "metrics",
    category: "when",
    question: "En tu código Java creaste `registry.counter(\"parks.weathercheck.counter\").increment()`. Cuando el script del examen hace `GET /q/metrics` (formato Prometheus), ¿con qué nombre aparece esa métrica en el texto de salida?",
    code: `# Salida de /q/metrics en formato Prometheus:`,
    options: [
      "parks_weathercheck_counter_total",
      "parks.weathercheck.counter",
      "counter_parks_weathercheck",
      "quarkus_parks_weathercheck"
    ],
    correct: 0,
    explanation: "El exportador de Prometheus en Micrometer convierte automáticamente los puntos '.' en guiones bajos '_' y añade el sufijo '_total' a todos los contadores.",
    kidTip: "En tu código Java pon puntos ('a.b.counter'); en /q/metrics de Prometheus lo verás con guiones bajos y _total ('a_b_counter_total')."
  },
  {
    id: "met-ann-13",
    module: "metrics",
    category: "code",
    question: "Quieres incrementar un contador en 5 unidades de golpe (por ejemplo porque llegaron 5 alertas en un lote) en vez de sumar solo 1. ¿Qué método de `Counter` usas?",
    code: `registry.counter("batch.alerts.counter").________________;`,
    options: [
      "increment(5.0) (o increment(5))",
      "add(5)",
      "plus(5)",
      "set(5)"
    ],
    correct: 0,
    explanation: "El método 'increment()' sin argumentos suma 1.0, y 'increment(double amount)' suma la cantidad positiva indicada.",
    kidTip: ".increment() suma 1; .increment(5) suma 5."
  },
  {
    id: "met-ann-14",
    module: "metrics",
    category: "when",
    question: "¿Se pueden usar las anotaciones `@Counted` y `@Timed` sobre métodos privados (`private void helper()`) dentro de una clase CDI?",
    code: `@ApplicationScoped
public class MyService {
    @Timed("private.timer")
    private void internalHelper() { ... } // <-- Método private
}`,
    options: [
      "No; como funcionan mediante interceptores de proxy CDI en Quarkus, los métodos anotados con @Counted o @Timed NO deben ser private (deben ser package-private, protected o public)",
      "Sí, funcionan solo en métodos private",
      "Sí, siempre que sean static",
      "Solo funcionan en interfaces"
    ],
    correct: 0,
    explanation: "En CDI (ArC), las anotaciones interceptoras ('@Timed', '@Counted', '@Transactional', '@WithSpan', '@Retry') solo interceptan métodos no privados invocados a través del proxy del bean.",
    kidTip: "¡Regla de oro CDI en Quarkus!: NUNCA pongas private a un método que lleve @Timed, @Counted, @WithSpan, @Transactional o @Retry."
  },
  {
    id: "met-ann-15",
    module: "metrics",
    category: "code",
    question: "Si quieres observar en un Gauge el tamaño actual de una lista en memoria `List<String> activeUsers = new ArrayList<>();`, ¿qué método atajo de `MeterRegistry` puedes usar en `@PostConstruct`?",
    code: `@PostConstruct
void init() {
    registry.___________________________("users.active.gauge", activeUsers);
}`,
    options: [
      "gaugeCollectionSize(\"users.active.gauge\", Tags.empty(), activeUsers)",
      "counterCollection(\"users.active.gauge\", activeUsers)",
      "timerSize(\"users.active.gauge\", activeUsers)",
      "measureList(\"users.active.gauge\", activeUsers)"
    ],
    correct: 0,
    explanation: "Micrometer ofrece 'registry.gaugeCollectionSize(nombre, tags, coleccion)' o bien 'registry.gauge(nombre, tags, activeUsers, List::size)'.",
    kidTip: "Para medir una lista con Gauge: registry.gauge(\"nombre\", Tags.empty(), lista, List::size) o gaugeCollectionSize."
  },
  {
    id: "met-ann-16",
    module: "metrics",
    category: "code",
    question: "¿Qué extensión de Quarkus debes tener en `pom.xml` para que Micrometer exponga las métricas en `/q/metrics` en formato Prometheus?",
    code: `<!-- Dependencia en pom.xml -->`,
    options: [
      "quarkus-micrometer-registry-prometheus",
      "quarkus-smallrye-metrics",
      "quarkus-opentelemetry",
      "quarkus-smallrye-health"
    ],
    correct: 0,
    explanation: "'quarkus-micrometer-registry-prometheus' incluye tanto el núcleo de 'quarkus-micrometer' como el registro exportador de Prometheus en '/q/metrics'.",
    kidTip: "Extensión de métricas en Quarkus 3.8 = quarkus-micrometer-registry-prometheus."
  },
  {
    id: "met-ann-17",
    module: "metrics",
    category: "annotation",
    question: "En un método anotado con `@Timed(value = \"http.call.timer\", histogram = true)`, ¿para qué sirve el atributo `histogram = true`?",
    code: `@Timed(value = "http.call.timer", histogram = true)`,
    options: [
      "Publica buckets de histograma acumulativos para poder calcular percentiles (como p95 o p99) en Prometheus",
      "Dibuja una gráfica en la consola de logs",
      "Convierte el Timer en un Gauge",
      "Desactiva el conteo de llamadas"
    ],
    correct: 0,
    explanation: "'histogram = true' o 'percentiles = {0.5, 0.95}' en '@Timed' genera las series adicionales necesarias para consultar percentiles de latencia.",
    kidTip: "En @Timed puedes usar value, description, extraTags, percentiles y histogram."
  },
  {
    id: "met-ann-18",
    module: "metrics",
    category: "when",
    question: "El enunciado del examen te dice: *'Registra una métrica tipo Counter llamada `parks.guard.counter` dentro del método `checkWeather` solo cuando `park.status` sea igual a `CLOSED`'*. ¿Debes usar la anotación `@Counted` o `registry.counter(...).increment()`?",
    code: `public void checkWeather(Park park) {
    if ("CLOSED".equals(park.status)) {
        // Solo contar si entra a este if
    }
}`,
    options: [
      "Debes usar @Inject MeterRegistry registry y llamar a registry.counter(\"parks.guard.counter\").increment() dentro del bloque 'if', porque @Counted contaría todas las llamadas al método sin importar la condición",
      "Debes poner @Counted encima del bloque if",
      "Debes usar @Timed en la clase",
      "No es posible contar dentro de un if en Micrometer"
    ],
    correct: 0,
    explanation: "'@Counted' cuenta cada invocación completa del método. Si necesitas incrementar un contador bajo una condición ('if') a mitad del método, inyectas 'MeterRegistry' y llamas a 'registry.counter(\"...\").increment()'.",
    kidTip: "Contar todo el método = @Counted. Contar dentro de un if o bucle = registry.counter(\"...\").increment()."
  },
  {
    id: "met-ann-19",
    module: "metrics",
    category: "code",
    question: "Cuando consultas `/q/metrics` después de que un Timer llamado `weather.timer` se ejecutó al menos una vez, ¿qué dos métricas principales genera ese Timer en la salida de Prometheus?",
    code: `# Series generadas por registry.timer("weather.timer"):`,
    options: [
      "weather_timer_seconds_count y weather_timer_seconds_sum (además de weather_timer_seconds_max)",
      "weather_timer_total y weather_timer_average",
      "weather_timer_ms",
      "Solo weather_timer"
    ],
    correct: 0,
    explanation: "En Prometheus, un Timer de Micrometer expone '_seconds_count' (cuántas veces se ejecutó), '_seconds_sum' (tiempo total acumulado en segundos) y '_seconds_max' (la ejecución más lenta).",
    kidTip: "Un Timer te da 2×1 en Prometheus: cuenta cuántas veces corrió (_seconds_count) y cuánto sumó en segundos (_seconds_sum)."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 9: OPENTELEMETRY TRACING (otel) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "otel-ann-5",
    module: "otel",
    category: "when",
    question: "Con la extensión `quarkus-opentelemetry` instalada, ¿en qué clases o métodos ES NECESARIO agregar `@WithSpan` y en cuáles NO es necesario?",
    code: `// ¿Dónde hace falta @WithSpan y dónde ya es automático?`,
    options: [
      "NO es necesario en endpoints REST (@GET, @POST) ni en llamadas REST Client porque Quarkus ya los traza automáticamente; SÍ es necesario en métodos internos de tus beans CDI (@ApplicationScoped) si quieres que aparezcan como un Span propio dentro de la traza",
      "Es obligatorio poner @WithSpan en todos los endpoints @GET y @POST",
      "No se debe usar nunca @WithSpan en beans CDI",
      "@WithSpan solo sirve en clases de prueba @QuarkusTest"
    ],
    correct: 0,
    explanation: "Quarkus instrumenta automáticamente el servidor HTTP (RESTEasy Reactive), el cliente HTTP (REST Client), JDBC reactivo y Kafka. '@WithSpan' se usa para añadir spans adicionales en métodos de negocio de tus propios beans CDI.",
    kidTip: "Endpoints REST y REST Client = trazados automáticos. Métodos internos de tus servicios CDI = ponles @WithSpan."
  },
  {
    id: "otel-ann-6",
    module: "otel",
    category: "annotation",
    question: "Si anotas un método `public void validateOrder(Order o)` en la clase `OrderService` con `@WithSpan` (sin pasarle ningún nombre entre paréntesis), ¿qué nombre tendrá el Span generado en Jaeger?",
    code: `@ApplicationScoped
public class OrderService {
    @WithSpan // <-- Sin valor entre paréntesis
    public void validateOrder(Order o) { ... }
}`,
    options: [
      "OrderService.validateOrder (NombreDeLaClase.nombreDelMetodo)",
      "default-span",
      "anonymous",
      "No genera ningún Span si no le pasas un nombre"
    ],
    correct: 0,
    explanation: "Cuando '@WithSpan' no recibe argumento 'value', OpenTelemetry nombra el Span automáticamente como 'NombreClase.nombreMetodo'. Si el examen pide un nombre específico (ej. 'validate-order'), lo pasas como '@WithSpan(\"validate-order\")'.",
    kidTip: "@WithSpan vacío usa Clase.metodo; @WithSpan(\"mi-nombre\") usa el nombre exacto que le pases."
  },
  {
    id: "otel-ann-7",
    module: "otel",
    category: "annotation",
    question: "En un método anotado con `@WithSpan`, colocas `@SpanAttribute` (sin texto entre paréntesis) sobre el parámetro `String customerId`. ¿Con qué nombre se guarda ese atributo en el Span?",
    code: `@WithSpan
public void process(@SpanAttribute String customerId) { ... }`,
    options: [
      "Con el nombre del parámetro Java: 'customerId' (o con el nombre personalizado si escribes @SpanAttribute(\"customer.id\"))",
      "Se ignora porque el nombre es obligatorio",
      "Se guarda como 'arg0' siempre",
      "Lanza excepción en tiempo de compilación"
    ],
    correct: 0,
    explanation: "Como Quarkus compila con '-parameters', '@SpanAttribute' usa el nombre del parámetro ('customerId') por defecto, o bien el nombre explícito que indiques en '@SpanAttribute(\"customer.id\")'.",
    kidTip: "Si el examen pide un nombre específico de etiqueta para el parámetro en la traza, usa @SpanAttribute(\"nombre-pedido\")."
  },
  {
    id: "otel-ann-8",
    module: "otel",
    category: "annotation",
    question: "En `@WithSpan`, quieres especificar explícitamente el tipo de Span (`SpanKind`), por ejemplo indicar que representa una operación interna (`SpanKind.INTERNAL`) o de cliente (`SpanKind.CLIENT`). ¿Cómo se llama ese atributo de `@WithSpan`?",
    code: `@WithSpan(value = "custom-op", _______________ = SpanKind.INTERNAL)
public void execute() { ... }`,
    options: [
      "kind",
      "type",
      "spanType",
      "mode"
    ],
    correct: 0,
    explanation: "'@WithSpan' tiene dos atributos: 'value' (el nombre del Span, por defecto \"\") y 'kind' (de tipo 'io.opentelemetry.api.trace.SpanKind', por defecto 'SpanKind.INTERNAL').",
    kidTip: "Los 2 únicos atributos de @WithSpan son: value (nombre) y kind (SpanKind)."
  },
  {
    id: "otel-ann-9",
    module: "otel",
    category: "annotation",
    question: "¿De qué paquete debes importar `@WithSpan` y `@SpanAttribute` en Quarkus 3.8?",
    code: `import ________________________________________________________.WithSpan;
import ________________________________________________________.SpanAttribute;`,
    options: [
      "io.opentelemetry.instrumentation.annotations",
      "org.eclipse.microprofile.opentracing",
      "io.quarkus.opentelemetry.annotations",
      "jakarta.tracing"
    ],
    correct: 0,
    explanation: "Ambas anotaciones ('@WithSpan' y '@SpanAttribute') provienen del paquete oficial 'io.opentelemetry.instrumentation.annotations'.",
    kidTip: "Paquete de @WithSpan y @SpanAttribute: io.opentelemetry.instrumentation.annotations."
  },
  {
    id: "otel-ann-10",
    module: "otel",
    category: "code",
    question: "En `application.properties`, ¿qué propiedad define el nombre del servicio (por ejemplo `parks-service`) con el que aparecerán identificadas tus trazas en Jaeger?",
    code: `# application.properties
_____________________________________ = parks-service`,
    options: [
      "quarkus.otel.service.name (o quarkus.application.name)",
      "quarkus.jaeger.service-name",
      "mp.opentracing.service.name",
      "otel.tracer.title"
    ],
    correct: 0,
    explanation: "'quarkus.otel.service.name' fija el atributo 'service.name' de OpenTelemetry (si no se define, toma por defecto 'quarkus.application.name').",
    kidTip: "Nombre del microservicio en Jaeger = quarkus.otel.service.name."
  },
  {
    id: "otel-ann-11",
    module: "otel",
    category: "when",
    question: "Si dentro de la misma clase `ParkService` el método `A()` llama directamente a `this.B()`, y `B()` está anotado con `@WithSpan`, ¿por qué NO se crea el Span de `B()` al llamarlo con `this.B()`?",
    code: `@ApplicationScoped
public class ParkService {
    public void metodoA() {
        this.metodoB(); // <-- Llamada interna directa sin pasar por el proxy CDI
    }

    @WithSpan
    public void metodoB() { ... }
}`,
    options: [
      "Porque @WithSpan funciona mediante un interceptor de proxy CDI: las auto-invocaciones internas (this.metodoB()) no pasan por el proxy; debe invocarse desde otro bean inyectado con @Inject",
      "Porque metodoA también tiene que ser private",
      "Porque @WithSpan solo funciona en métodos static",
      "Porque solo puede haber un método por clase en Quarkus"
    ],
    correct: 0,
    explanation: "En CDI, cuando un método llama a otro método de la misma clase ('this.metodoB()'), no pasa por el proxy interceptor. En los laboratorios de DO378 (ej. 'ParkGuard'), el método con '@WithSpan' está en un bean separado inyectado con '@Inject' en el Resource.",
    kidTip: "Llama siempre al método @WithSpan a través de un bean inyectado con @Inject para que el proxy CDI cree el Span."
  },
  {
    id: "otel-ann-12",
    module: "otel",
    category: "code",
    question: "Además de `%X{traceId}` y `%X{spanId}`, ¿qué otras DOS claves inyecta automáticamente OpenTelemetry en el MDC de los logs de Quarkus y suelen pedirse en `quarkus.log.console.format`?",
    code: `quarkus.log.console.format=%d{HH:mm:ss} %-5p traceId=%X{traceId}, parentId=__________, spanId=%X{spanId}, sampled=__________ [%c{2.}] (%t) %s%e%n`,
    options: [
      "%X{parentId} y %X{sampled}",
      "%X{rootId} y %X{active}",
      "%X{callerId} y %X{traced}",
      "%X{service} y %X{host}"
    ],
    correct: 0,
    explanation: "Las 4 variables MDC de OpenTelemetry en Quarkus son: '%X{traceId}', '%X{parentId}', '%X{spanId}' y '%X{sampled}'.",
    kidTip: "Memoriza los 4 rayos %X del log: %X{traceId}, %X{parentId}, %X{spanId}, %X{sampled}."
  },
  {
    id: "otel-ann-13",
    module: "otel",
    category: "code",
    question: "Si necesitas agregar un evento o un atributo dinámicamente por código al Span activo actual (sin usar `@SpanAttribute`), ¿cómo obtienes el Span actual con la API de OpenTelemetry?",
    code: `import io.opentelemetry.api.trace.Span;

public void process() {
    Span current = ______________________;
    current.setAttribute("custom.key", "val");
}`,
    options: [
      "Span.current()",
      "OpenTelemetry.getActiveSpan()",
      "Tracer.currentSpan()",
      "SpanContext.get()"
    ],
    correct: 0,
    explanation: "'Span.current()' (de io.opentelemetry.api.trace.Span) devuelve el Span activo en el contexto actual, permitiendo llamar a '.setAttribute(\"k\", \"v\")' o '.addEvent(\"...\")'.",
    kidTip: "Para tocar el Span actual por código: Span.current().setAttribute(\"clave\", \"valor\")."
  },
  {
    id: "otel-ann-14",
    module: "otel",
    category: "annotation",
    question: "Si el examen te pide inyectar el objeto `Tracer` de OpenTelemetry para construir spans manualmente en una clase CDI, ¿con qué anotación lo inyectas?",
    code: `@ApplicationScoped
public class ManualTracingService {
    // ¿Qué anotación inyecta el Tracer de OpenTelemetry?
    io.opentelemetry.api.trace.Tracer tracer;
}`,
    options: [
      "@Inject",
      "@WithSpan",
      "@ConfigProperty",
      "@Context"
    ],
    correct: 0,
    explanation: "La extensión 'quarkus-opentelemetry' expone 'Tracer' y 'OpenTelemetry' como beans CDI que se inyectan directamente con '@Inject'.",
    kidTip: "El objeto Tracer se inyecta con @Inject estándar."
  },
  {
    id: "otel-ann-15",
    module: "otel",
    category: "when",
    question: "Cuando tu microservicio A llama a tu microservicio B usando un cliente anotado con `@RegisterRestClient`, ¿qué tienes que hacer para que el `traceId` se propague en las cabeceras HTTP de A hacia B?",
    code: `// Propagación de contexto W3C TraceContext entre microservicios A -> B:`,
    options: [
      "Nada adicional en el código; si ambos microservicios tienen la extensión 'quarkus-opentelemetry', el REST Client inyecta automáticamente la cabecera 'traceparent' y el servidor B continúa la misma traza",
      "Debes pasar el traceId manualmente con @HeaderParam en todos los métodos",
      "Debes anotar la interfaz del REST Client con @WithSpan",
      "Debes usar @RolesAllowed en ambos servicios"
    ],
    correct: 0,
    explanation: "La extensión 'quarkus-opentelemetry' propaga automáticamente los encabezados estándar W3C ('traceparent') en todas las llamadas de 'quarkus-rest-client-reactive'.",
    kidTip: "Entre REST y REST Client, quarkus-opentelemetry propaga el traceId solito sin código extra."
  },
  {
    id: "otel-ann-16",
    module: "otel",
    category: "code",
    question: "Quieres desactivar temporalmente el envío de trazas de OpenTelemetry en el perfil `%test` dentro de `application.properties`. ¿Qué propiedad usas?",
    code: `# application.properties
%test.________________________________ = false`,
    options: [
      "quarkus.otel.sdk.disabled=true (o quarkus.otel.enabled=false)",
      "quarkus.jaeger.active=false",
      "mp.tracing.enabled=false",
      "quarkus.log.trace=false"
    ],
    correct: 0,
    explanation: "'quarkus.otel.sdk.disabled=true' (o 'quarkus.otel.enabled=false') desactiva el SDK de OpenTelemetry en ese perfil.",
    kidTip: "Para apagar OpenTelemetry en pruebas: %test.quarkus.otel.sdk.disabled=true."
  },
  {
    id: "otel-ann-17",
    module: "otel",
    category: "when",
    question: "¿Por qué en un proyecto de Quarkus 3.8 NUNCA debes usar la anotación `@Traced` de `org.eclipse.microprofile.opentracing`?",
    code: `// @Traced vs @WithSpan`,
    options: [
      "Porque OpenTracing fue reemplazado en Quarkus 3 por OpenTelemetry, donde la anotación oficial para trazar métodos es @WithSpan",
      "Porque @Traced solo sirve para bases de datos",
      "Porque @Traced borra los logs de consola",
      "Porque @Traced es una anotación de seguridad JWT"
    ],
    correct: 0,
    explanation: "OpenTracing quedó obsoleto y fue sustituido por OpenTelemetry ('quarkus-opentelemetry'). En Quarkus 3.8 siempre debes usar '@WithSpan'.",
    kidTip: "@Traced = viejo (Quarkus 2). @WithSpan = actual (Quarkus 3.8 / EX378)."
  },
  {
    id: "otel-ann-18",
    module: "otel",
    category: "code",
    question: "¿Funcionan `@WithSpan` y `@SpanAttribute` en métodos reactivos que retornan `Uni<T>` o `Multi<T>` de Mutiny?",
    code: `@WithSpan("async-weather-check")
public Uni<Weather> checkAsync(@SpanAttribute("city") String city) { ... }`,
    options: [
      "Sí; Quarkus integra @WithSpan con Mutiny para que el Span permanezca abierto hasta que el Uni se resuelva o falle",
      "No, @WithSpan solo funciona en métodos que retornan void",
      "No, con Uni<T> lanza excepción al compilar",
      "Solo funciona si conviertes el Uni en String antes"
    ],
    correct: 0,
    explanation: "En Quarkus (como en el laboratorio 'monitor-trace' donde 'checkWeatherForPark' retorna 'Uni<Void>'), '@WithSpan' mide correctamente toda la ejecución asíncrona del 'Uni'.",
    kidTip: "@WithSpan funciona tanto en métodos síncronos como en métodos que devuelven Uni<T>."
  },
  {
    id: "otel-ann-19",
    module: "otel",
    category: "code",
    question: "¿Qué extensión de Quarkus debes agregar a tu proyecto para habilitar `@WithSpan`, `@SpanAttribute` y la exportación OTLP hacia Jaeger?",
    code: `mvn quarkus:add-extension -Dextensions="________________________"`,
    options: [
      "quarkus-opentelemetry",
      "quarkus-smallrye-opentracing",
      "quarkus-micrometer-tracing",
      "quarkus-jaeger-client"
    ],
    correct: 0,
    explanation: "La única extensión necesaria en Quarkus 3.8 para trazas distribuidas y '@WithSpan' es 'quarkus-opentelemetry'.",
    kidTip: "Extensión de trazas en Quarkus 3.8 = quarkus-opentelemetry."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 10: SEGURIDAD JWT RBAC (jwt) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "jwt-ann-6",
    module: "jwt",
    category: "annotation",
    question: "Quieres permitir que al método `getParkDetails()` puedan entrar TANTO los usuarios con rol `Admin` COMO los usuarios con rol `Subscriber`. ¿Cómo escribes la anotación `@RolesAllowed`?",
    code: `@GET
@Path("/{id}")
// ¿Cómo permites cualquiera de los dos roles Admin o Subscriber?
public Park getParkDetails(@PathParam("id") Long id) { ... }`,
    options: [
      "@RolesAllowed({ \"Admin\", \"Subscriber\" })",
      "@RolesAllowed(\"Admin\" && \"Subscriber\")",
      "@RolesAllowed(all = {\"Admin\", \"Subscriber\"})",
      "@RolesAllowed(\"Admin\") @RolesAllowed(\"Subscriber\")"
    ],
    correct: 0,
    explanation: "'@RolesAllowed({ \"Admin\", \"Subscriber\" })' actúa con lógica OR: basta con que el token JWT del usuario tenga AL MENOS UNO de los roles listados en su claim 'groups'.",
    kidTip: "Un arreglo en @RolesAllowed({\"RolA\", \"RolB\"}) deja pasar si tienes RolA O RolB."
  },
  {
    id: "jwt-ann-7",
    module: "jwt",
    category: "when",
    question: "Colocas `@RolesAllowed(\"Admin\")` arriba de toda la clase `ParksResource`, pero quieres que el método `@GET public List<Park> listAll()` sea completamente público (incluso para visitantes sin token JWT). ¿Qué anotación colocas sobre `listAll()`?",
    code: `@Path("/parks")
@RolesAllowed("Admin")
public class ParksResource {

    @GET
    // ¿Qué anotación abre este método al público general sin pedir token?
    public List<Park> listAll() { ... }
}`,
    options: [
      "@PermitAll",
      "@Authenticated",
      "@DenyAll",
      "@RolesAllowed(\"\")"
    ],
    correct: 0,
    explanation: "'@PermitAll' sobre un método anula la restricción '@RolesAllowed' o '@DenyAll' de la clase, dejando ese endpoint abierto a cualquier petición (con o sin token).",
    kidTip: "Clase protegida con @RolesAllowed + un método abierto a todos = pon @PermitAll en ese método."
  },
  {
    id: "jwt-ann-8",
    module: "jwt",
    category: "when",
    question: "¿Qué diferencia de código de respuesta HTTP hay cuando un usuario llama a un endpoint con `@RolesAllowed(\"Admin\")` en estos dos casos:\nCaso 1: No envía cabecera `Authorization: Bearer ...` (o el token está expirado/firma inválida).\nCaso 2: Envía un token válido pero su grupo es `Subscriber` (no tiene `Admin`).",
    code: `// Caso 1: Sin token o firma inválida -> ¿Código HTTP?
// Caso 2: Token válido pero rol insuficiente -> ¿Código HTTP?`,
    options: [
      "Caso 1 devuelve 401 Unauthorized (no autenticado); Caso 2 devuelve 403 Forbidden (autenticado pero sin permisos para ese rol)",
      "Ambos casos devuelven 404 Not Found",
      "Caso 1 devuelve 403 Forbidden y Caso 2 devuelve 401 Unauthorized",
      "Ambos casos devuelven 500 Internal Server Error"
    ],
    correct: 0,
    explanation: "401 Unauthorized significa 'no sé quién eres o tu token es inválido'. 403 Forbidden significa 'sé quién eres (token válido), pero tu rol no tiene permiso para entrar aquí'.",
    kidTip: "Sin token o token falso = 401 Unauthorized | Token válido pero sin el rol = 403 Forbidden."
  },
  {
    id: "jwt-ann-9",
    module: "jwt",
    category: "annotation",
    question: "Quieres inyectar un claim personalizado llamado `\"department\"` que viene dentro del payload del token JWT (`\"department\": \"Engineering\"`). ¿Cómo usas la anotación `@Claim`?",
    code: `@RequestScoped
public class UserAudit {
    @Inject
    // ¿Cómo inyectas el claim personalizado "department"?
    String department;
}`,
    options: [
      "@Claim(\"department\") (o @Claim(value = \"department\"))",
      "@Claim(standard = \"department\")",
      "@ConfigProperty(name = \"department\")",
      "@HeaderParam(\"department\")"
    ],
    correct: 0,
    explanation: "Para claims personalizados usas '@Claim(\"nombreDelClaim\")'. El atributo 'standard = Claims.xyz' se usa para los claims estándar predefinidos en la enumeración 'Claims' (como 'upn', 'sub', 'iss', 'groups').",
    kidTip: "Claim estándar = @Claim(standard = Claims.upn) | Claim propio = @Claim(\"miClaim\")."
  },
  {
    id: "jwt-ann-10",
    module: "jwt",
    category: "when",
    question: "Si tu clase Resource está anotada con `@ApplicationScoped` (una sola instancia para todos los usuarios) e intentas inyectar directamente `@Inject @Claim(\"department\") String dept;`, ¿por qué falla al arrancar y cómo lo solucionas?",
    code: `@ApplicationScoped
@Path("/info")
public class InfoResource {
    @Inject
    @Claim("department")
    String dept; // <-- ¡Problema en @ApplicationScoped!
}`,
    options: [
      "Porque un String directo con @Claim tiene ámbito de petición (@RequestScoped) y no puede fijarse en un bean @ApplicationScoped; se soluciona cambiando la clase a @RequestScoped, o inyectando JsonWebToken (que sí tiene proxy), o usando ClaimValue<String> / Provider<String>",
      "Porque @Claim solo acepta números enteros",
      "Porque falta @Transactional en el campo",
      "Porque @Claim solo funciona en interfaces"
    ],
    correct: 0,
    explanation: "En MicroProfile JWT, inyectar un 'String' crudo con '@Claim' exige que el bean contenedor sea '@RequestScoped'. En cambio, '@Inject JsonWebToken jwt' o 'ClaimValue<String>' funcionan en '@ApplicationScoped'.",
    kidTip: "Si inyectas @Claim directo en un String, pon @RequestScoped en la clase (o usa @Inject JsonWebToken jwt)."
  },
  {
    id: "jwt-ann-11",
    module: "jwt",
    category: "annotation",
    question: "Además de `@Inject JsonWebToken jwt`, ¿qué interfaz de Quarkus Security puedes inyectar con `@Inject` para consultar el usuario actual, sus roles (`hasRole(\"Admin\")`) y sus atributos de seguridad?",
    code: `@Path("/profile")
public class ProfileResource {
    @Inject
    // ¿Qué interfaz de io.quarkus.security.identity representa la identidad actual?
    _______________________ identity;
}`,
    options: [
      "SecurityIdentity (de io.quarkus.security.identity.SecurityIdentity)",
      "UserSession",
      "JwtContext",
      "AuthenticationManager"
    ],
    correct: 0,
    explanation: "'@Inject SecurityIdentity identity;' es la interfaz unificada de Quarkus para obtener 'identity.getPrincipal().getName()', 'identity.getRoles()' o 'identity.hasRole(\"Admin\")'.",
    kidTip: "En Quarkus puedes inyectar @Inject JsonWebToken jwt o @Inject SecurityIdentity identity."
  },
  {
    id: "jwt-ann-12",
    module: "jwt",
    category: "annotation",
    question: "En Jakarta REST estándar, si quieres recibir el `SecurityContext` directamente como parámetro de un método `@GET` (sin usar `@Inject` en un campo), ¿qué anotación pones delante de `SecurityContext ctx`?",
    code: `@GET
public String whoAmI(_____________ SecurityContext ctx) {
    return ctx.getUserPrincipal().getName();
}`,
    options: [
      "@Context (de jakarta.ws.rs.core.Context)",
      "@PathParam",
      "@Claim",
      "@ConfigProperty"
    ],
    correct: 0,
    explanation: "Al igual que 'UriInfo', el 'jakarta.ws.rs.core.SecurityContext' se inyecta en parámetros de métodos REST con la anotación '@Context'.",
    kidTip: "UriInfo y SecurityContext en parámetros REST siempre llevan @Context."
  },
  {
    id: "jwt-ann-13",
    module: "jwt",
    category: "annotation",
    question: "En una clase de pruebas `@QuarkusTest`, quieres probar que el endpoint `DELETE /parks/1` (protegido con `@RolesAllowed(\"Admin\")`) funciona para un administrador sin tener que fabricar una llave RSA ni un token JWT real. ¿Qué anotación colocas sobre el método `@Test`?",
    code: `@Test
// ¿Qué anotación simula un usuario autenticado con el rol Admin en el test?
public void testAdminCanDelete() {
    given().when().delete("/parks/1").then().statusCode(204);
}`,
    options: [
      "@TestSecurity(user = \"adminUser\", roles = { \"Admin\" })",
      "@RolesAllowed(\"Admin\")",
      "@MockJwt(role = \"Admin\")",
      "@PermitAll"
    ],
    correct: 0,
    explanation: "'@TestSecurity' (de io.quarkus.test.security.TestSecurity) simula la identidad y roles para ese método '@Test'.",
    kidTip: "En @QuarkusTest, @TestSecurity(user = \"...\", roles = {\"Admin\"}) simula el login y los roles al instante."
  },
  {
    id: "jwt-ann-14",
    module: "jwt",
    category: "annotation",
    question: "Si en un `@Test` con `@TestSecurity` quieres además simular claims específicos del token JWT (por ejemplo `upn = \"carlos@redhat.com\"`), ¿qué anotación de `io.quarkus.test.security.jwt` agregas junto a `@TestSecurity`?",
    code: `@Test
@TestSecurity(user = "carlos", roles = "Admin")
// ¿Qué anotación simula los claims del JWT en el test?
public void testJwtClaims() { ... }`,
    options: [
      "@JwtSecurity(claims = { @Claim(key = \"upn\", value = \"carlos@redhat.com\") })",
      "@WithClaims(upn = \"carlos@redhat.com\")",
      "@MockToken(upn = \"carlos@redhat.com\")",
      "@Claim(standard = Claims.upn)"
    ],
    correct: 0,
    explanation: "'@JwtSecurity' (de la dependencia 'quarkus-test-security-jwt') se combina con '@TestSecurity' para inyectar claims personalizados en las pruebas.",
    kidTip: "@TestSecurity simula usuario y roles; @JwtSecurity simula claims específicos del JWT en los tests."
  },
  {
    id: "jwt-ann-15",
    module: "jwt",
    category: "annotation",
    question: "¿De qué paquete provienen las anotaciones estándar `@RolesAllowed`, `@PermitAll` y `@DenyAll` en Quarkus 3.8?",
    code: `import ____________________________________.RolesAllowed;
import ____________________________________.PermitAll;
import ____________________________________.DenyAll;`,
    options: [
      "jakarta.annotation.security",
      "io.quarkus.security",
      "org.eclipse.microprofile.jwt",
      "javax.annotation.security"
    ],
    correct: 0,
    explanation: "En Quarkus 3 (Jakarta EE 10), '@RolesAllowed', '@PermitAll' y '@DenyAll' pertenecen a 'jakarta.annotation.security' (mientras que '@Authenticated' pertenece a 'io.quarkus.security.Authenticated').",
    kidTip: "@RolesAllowed, @PermitAll y @DenyAll = jakarta.annotation.security | @Authenticated = io.quarkus.security."
  },
  {
    id: "jwt-ann-16",
    module: "jwt",
    category: "code",
    question: "Al generar un token con `Jwt.issuer(\"...\")`, ¿qué método usas para añadir un claim personalizado clave-valor (por ejemplo `\"customId\"`, `123`) antes de llamar a `.sign()`?",
    code: `String token = Jwt.issuer("https://example.com")
        .upn("user@example.com")
        .groups(Set.of("User"))
        ._____________________________
        .sign();`,
    options: [
      "claim(\"customId\", 123)",
      "withData(\"customId\", 123)",
      "header(\"customId\", 123)",
      "attribute(\"customId\", 123)"
    ],
    correct: 0,
    explanation: "El builder 'Jwt' de SmallRye JWT Build tiene el método '.claim(\"nombre\", valor)' para agregar cualquier claim extra al token.",
    kidTip: "En HealthCheckResponse es .withData(k, v); en Jwt builder es .claim(k, v)."
  },
  {
    id: "jwt-ann-17",
    module: "jwt",
    category: "code",
    question: "¿Qué propiedad en `application.properties` es OBLIGATORIA junto con `mp.jwt.verify.publickey.location=publicKey.pem` para que MicroProfile JWT acepte como válido el emisor (`iss`) de los tokens entrantes?",
    code: `mp.jwt.verify.publickey.location=publicKey.pem
________________________________________=https://example.com/issuer`,
    options: [
      "mp.jwt.verify.issuer",
      "mp.jwt.issuer.url",
      "smallrye.jwt.verify.issuer",
      "quarkus.jwt.issuer"
    ],
    correct: 0,
    explanation: "El par obligatorio para verificar tokens en MicroProfile JWT es 'mp.jwt.verify.publickey.location' y 'mp.jwt.verify.issuer' (que debe coincidir exactamente con el '.issuer(...)' usado al firmar el token).",
    kidTip: "Las dos propiedades hermanas de verificación: mp.jwt.verify.publickey.location y mp.jwt.verify.issuer."
  },
  {
    id: "jwt-ann-18",
    module: "jwt",
    category: "code",
    question: "Si en lugar de escribir `.issuer(\"https://example.com/issuer\")` por código Java cada vez que llamas a `Jwt.upn(...).sign()`, quieres configurar el issuer por defecto para todos los tokens firmados en `application.properties`, ¿qué propiedad usas?",
    code: `# application.properties (para firmar nuevos tokens):
smallrye.jwt.sign.key.location=privateKey.pem
____________________________________=https://example.com/issuer`,
    options: [
      "smallrye.jwt.new-token.issuer",
      "mp.jwt.verify.issuer",
      "quarkus.jwt.sign.issuer",
      "smallrye.jwt.issuer"
    ],
    correct: 0,
    explanation: "'smallrye.jwt.new-token.issuer' establece automáticamente el claim 'iss' al firmar tokens nuevos con 'Jwt.sign()'.",
    kidTip: "Para verificar entrantes = mp.jwt.verify.issuer | Para firmar nuevos = smallrye.jwt.new-token.issuer (o Jwt.issuer(...) en Java)."
  },
  {
    id: "jwt-ann-19",
    module: "jwt",
    category: "when",
    question: "¿Qué extensión debes agregar en `pom.xml` si tu microservicio necesita GENERAR y FIRMAR tokens nuevos con `io.smallrye.jwt.build.Jwt`?",
    code: `<!-- Extensión para usar Jwt.issuer(...).upn(...).sign() -->`,
    options: [
      "quarkus-smallrye-jwt-build",
      "Solo quarkus-smallrye-jwt",
      "quarkus-oidc",
      "quarkus-security-jpa"
    ],
    correct: 0,
    explanation: "'quarkus-smallrye-jwt' sirve para verificar tokens y proteger endpoints con '@RolesAllowed'. Para usar la clase 'Jwt' y firmar tokens nuevos necesitas 'quarkus-smallrye-jwt-build'.",
    kidTip: "Verificar (@RolesAllowed) = quarkus-smallrye-jwt | Crear/Firmar (Jwt.sign()) = quarkus-smallrye-jwt-build."
  },
  {
    id: "jwt-ann-20",
    module: "jwt",
    category: "code",
    question: "Tu frontend web en `http://localhost:3000` envía peticiones con cabecera `Authorization` a tu API Quarkus en `http://localhost:8080`, pero el navegador las bloquea por política CORS. ¿Qué dos propiedades en `application.properties` habilitan CORS para ese origen?",
    code: `# application.properties`,
    options: [
      "quarkus.http.cors=true y quarkus.http.cors.origins=http://localhost:3000",
      "mp.cors.enabled=true y mp.cors.allow=http://localhost:3000",
      "quarkus.security.cors.origins=http://localhost:3000",
      "smallrye.jwt.cors=true"
    ],
    correct: 0,
    explanation: "En el Capítulo 5 de DO378 (Seguridad), CORS se activa en 'application.properties' con 'quarkus.http.cors=true' y 'quarkus.http.cors.origins=http://...'.",
    kidTip: "CORS en Quarkus siempre empieza por quarkus.http.cors=true y quarkus.http.cors.origins=..."
  },

  // -------------------------------------------------------------------------
  // SECCIÓN 11: REACTIVE MESSAGING CON KAFKA (messaging) — +15 Preguntas de Anotaciones
  // -------------------------------------------------------------------------
  {
    id: "msg-ann-6",
    module: "messaging",
    category: "when",
    question: "Un método tiene `@Incoming(\"orders-in\")` y llama a `Order.persist()` de Panache clásico. Le pusiste `@Transactional`, pero OLVIDASTE ponerle `@Blocking`. ¿Qué excepción lanza Quarkus cuando llega un mensaje de Kafka?",
    code: `@Incoming("orders-in")
@Transactional // <-- ¡Falta @Blocking!
public void saveOrder(Order o) {
    o.persist();
}`,
    options: [
      "BlockingNotAllowedException (o IllegalStateException indicando que no se puede bloquear el hilo I/O Event Loop)",
      "TransactionRequiredException",
      "NullPointerException",
      "NotFoundException"
    ],
    correct: 0,
    explanation: "Los consumidores '@Incoming' se ejecutan en el Event Loop (hilo I/O). Incluso si pones '@Transactional', JDBC es bloqueante y Quarkus prohíbe bloquear el hilo I/O a menos que agregues '@Blocking'.",
    kidTip: "Si falta @Blocking = BlockingNotAllowedException. Si falta @Transactional = TransactionRequiredException. ¡Pon siempre AMBAS!"
  },
  {
    id: "msg-ann-7",
    module: "messaging",
    category: "annotation",
    question: "Además de inyectar `Emitter<T>` con `@Inject @Channel(\"nombre-canal\")`, ¿qué otro tipo reactivo de Mutiny puedes inyectar con `@Inject @Channel(\"nombre-canal\")` si quieres exponer un stream de los mensajes en un endpoint Server-Sent Events (`@GET @Produces(MediaType.SERVER_SENT_EVENTS)`)?",
    code: `@Path("/warnings")
public class WarningStreamResource {
    @Inject
    @Channel("warnings-stream")
    // ¿Qué tipo de Mutiny puedes inyectar directamente con @Channel para hacer streaming?
    ___________________________ warnings;

    @GET
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<WeatherWarning> stream() {
        return warnings;
    }
}`,
    options: [
      "Multi<WeatherWarning>",
      "Uni<WeatherWarning>",
      "List<WeatherWarning>",
      "KafkaConsumer<WeatherWarning>"
    ],
    correct: 0,
    explanation: "'@Channel' sirve para dos cosas en campos: inyectar un 'Emitter<T>' (para enviar mensajes hacia un canal de salida) o inyectar un 'Multi<T>' (para suscribirse al flujo de un canal de entrada y retransmitirlo por SSE).",
    kidTip: "@Inject @Channel(\"...\") sirve tanto para Emitter<T> (enviar) como para Multi<T> (leer flujo en un endpoint SSE)."
  },
  {
    id: "msg-ann-8",
    module: "messaging",
    category: "annotation",
    question: "Cuando varios métodos o recursos internos escuchan el mismo canal en memoria (por ejemplo un método `@Outgoing(\"alerts\")` que alimenta tanto a un consumidor interno como a un `@Channel(\"alerts\") Multi<Alert>`), ¿qué anotación debes poner junto a `@Outgoing(\"alerts\")` para que el mensaje llegue a TODOS los suscriptores?",
    code: `@Outgoing("alerts")
// ¿Qué anotación reparte cada mensaje a todos los suscriptores del canal?
public Multi<Alert> generateAlerts() { ... }`,
    options: [
      "@Broadcast (de io.smallrye.reactive.messaging.annotations.Broadcast)",
      "@Multicast",
      "@FanOut",
      "@PermitAll"
    ],
    correct: 0,
    explanation: "Por defecto un canal interno entrega cada mensaje a un solo consumidor (round-robin). '@Broadcast' hace que cada mensaje emitido sea recibido por todos los consumidores conectados al canal.",
    kidTip: "Varios lectores en el mismo canal interno = pon @Broadcast sobre el productor."
  },
  {
    id: "msg-ann-9",
    module: "messaging",
    category: "annotation",
    question: "Cuando usas `@Inject @Channel(\"orders-out\") Emitter<Order> emitter;`, quieres configurar mediante una anotación qué ocurre si el consumidor es más lento que el productor (estrategia de Backpressure / desbordamiento, ej. `BUFFER` de tamaño 1000). ¿Qué anotación colocas junto a `@Channel`?",
    code: `@Inject
@Channel("orders-out")
// ¿Qué anotación configura la estrategia de buffer/backpressure del Emitter?
Emitter<Order> emitter;`,
    options: [
      "@OnOverflow(value = OnOverflow.Strategy.BUFFER, bufferSize = 1000)",
      "@Backpressure(size = 1000)",
      "@Bulkhead(1000)",
      "@Buffer(1000)"
    ],
    correct: 0,
    explanation: "'@OnOverflow' (de org.eclipse.microprofile.reactive.messaging.OnOverflow) define la estrategia ('BUFFER', 'DROP', 'FAIL', 'LATEST', 'NONE') cuando el 'Emitter' envía más rápido de lo que el canal procesa.",
    kidTip: "Controlar llenado del Emitter = @OnOverflow(value = OnOverflow.Strategy.BUFFER, bufferSize = ...)."
  },
  {
    id: "msg-ann-10",
    module: "messaging",
    category: "annotation",
    question: "Quieres controlar manualmente cuándo se confirma (ack) un mensaje en un método `@Incoming`, o cambiar la estrategia de confirmación del método a `PRE_PROCESSING` o `MANUAL`. ¿Qué anotación de MicroProfile Reactive Messaging colocas sobre el método `@Incoming`?",
    code: `@Incoming("payments-in")
// ¿Qué anotación define la estrategia de confirmación (ACK) del mensaje?
public CompletionStage<Void> handle(Message<Payment> msg) {
    return msg.ack();
}`,
    options: [
      "@Acknowledgment(Acknowledgment.Strategy.MANUAL)",
      "@Commit(Commit.Strategy.MANUAL)",
      "@Confirm(Confirm.Mode.MANUAL)",
      "@KafkaAck"
    ],
    correct: 0,
    explanation: "'@Acknowledgment' (de org.eclipse.microprofile.reactive.messaging.Acknowledgment) permite elegir entre 'POST_PROCESSING' (por defecto), 'PRE_PROCESSING', 'MANUAL' o 'NONE'.",
    kidTip: "Estrategia de confirmación de mensajes en @Incoming = @Acknowledgment."
  },
  {
    id: "msg-ann-11",
    module: "messaging",
    category: "when",
    question: "En un método `@Incoming(\"warnings-in\")`, ¿cuál es la diferencia entre recibir el payload directo (`public void consume(WeatherWarning w)`) y recibirlo envuelto en `Message<WeatherWarning>` (`public CompletionStage<Void> consume(Message<WeatherWarning> msg)`)?",
    code: `// Opción A: public void consume(WeatherWarning w)
// Opción B: public CompletionStage<Void> consume(Message<WeatherWarning> msg)`,
    options: [
      "Con WeatherWarning directo Quarkus extrae el objeto y hace ACK automático al terminar el método; con Message<WeatherWarning> puedes leer metadatos de Kafka (headers, topic, partition) y debes llamar a msg.ack() o msg.nack(ex)",
      "Con WeatherWarning directo no se puede usar Jackson",
      "Message<WeatherWarning> solo sirve para enviar mensajes con @Outgoing",
      "No existe la interfaz Message<T> en Reactive Messaging"
    ],
    correct: 0,
    explanation: "En casi todos los ejercicios del examen basta con recibir el objeto Java directamente ('WeatherWarning w'). Solo usas 'Message<WeatherWarning>' si te piden leer metadatos o hacer 'msg.ack()' manual.",
    kidTip: "Si solo necesitas los datos del JSON, recibe directo tu clase (WeatherWarning w) y Quarkus hace el ack() por ti."
  },
  {
    id: "msg-ann-12",
    module: "messaging",
    category: "annotation",
    question: "Si varios métodos en tu misma aplicación necesitan procesar mensajes del mismo canal entrante `@Incoming(\"events\")` al mismo tiempo (o si el método `@Incoming` se fusiona de varias fuentes), ¿qué anotación de SmallRye colocas sobre el método `@Incoming`?",
    code: `@Incoming("events")
// ¿Qué anotación permite que múltiples productores alimenten este @Incoming?
public void monitor(Event e) { ... }`,
    options: [
      "@Merge",
      "@Broadcast",
      "@Join",
      "@Combine"
    ],
    correct: 0,
    explanation: "Mientras que '@Broadcast' permite que 1 productor envíe a N consumidores, '@Merge' (de io.smallrye.reactive.messaging.annotations.Merge) permite que N productores envíen hacia 1 mismo consumidor '@Incoming'.",
    kidTip: "1 salida hacia muchos @Incoming = @Broadcast | Muchas salidas hacia 1 @Incoming = @Merge."
  },
  {
    id: "msg-ann-13",
    module: "messaging",
    category: "annotation",
    question: "¿De qué paquete debes importar `@Incoming`, `@Outgoing`, `@Channel` y `Emitter`?",
    code: `import ________________________________________________________.Incoming;
import ________________________________________________________.Outgoing;
import ________________________________________________________.Channel;
import ________________________________________________________.Emitter;`,
    options: [
      "org.eclipse.microprofile.reactive.messaging",
      "io.smallrye.reactive.messaging.kafka",
      "jakarta.messaging",
      "org.apache.kafka.clients"
    ],
    correct: 0,
    explanation: "Las 4 piezas principales ('@Incoming', '@Outgoing', '@Channel' y 'Emitter') pertenecen al paquete estándar 'org.eclipse.microprofile.reactive.messaging'.",
    kidTip: "@Incoming, @Outgoing, @Channel y Emitter viven todos juntos en org.eclipse.microprofile.reactive.messaging."
  },
  {
    id: "msg-ann-14",
    module: "messaging",
    category: "code",
    question: "En `application.properties`, ¿qué clase de Quarkus debes configurar en `mp.messaging.outgoing.<canal>.value.serializer` para serializar automáticamente cualquier objeto Java a JSON con Jackson al enviarlo a Kafka?",
    code: `mp.messaging.outgoing.warnings-out.connector=smallrye-kafka
mp.messaging.outgoing.warnings-out.value.serializer=____________________________________________________`,
    options: [
      "io.quarkus.kafka.client.serialization.ObjectMapperSerializer",
      "org.apache.kafka.common.serialization.StringSerializer",
      "io.quarkus.kafka.client.serialization.ObjectMapperDeserializer",
      "com.fasterxml.jackson.databind.ObjectMapper"
    ],
    correct: 0,
    explanation: "Para ENVIAR (outgoing) no necesitas crear ninguna clase nueva: usas directamente 'io.quarkus.kafka.client.serialization.ObjectMapperSerializer'. Para RECIBIR (incoming) sí creas una subclase de 'ObjectMapperDeserializer<TuClase>'.",
    kidTip: "Al enviar (outgoing) usas directo ObjectMapperSerializer de Quarkus; al recibir (incoming) creas tu clase que extiende ObjectMapperDeserializer<T>."
  },
  {
    id: "msg-ann-15",
    module: "messaging",
    category: "when",
    question: "¿Por qué para el serializador de salida (`value.serializer`) puedes usar directamente `ObjectMapperSerializer`, pero para el deserializador de entrada (`value.deserializer`) TIENES que crear una clase hija como `public class MyDeserializer extends ObjectMapperDeserializer<MyClass>`?",
    code: `public class MyDeserializer extends ObjectMapperDeserializer<MyClass> {
    public MyDeserializer() {
        super(MyClass.class);
    }
}`,
    options: [
      "Porque al convertir de JSON (bytes) a Java, Jackson necesita saber a qué clase concreta (MyClass.class) debe instanciar el objeto, y debido al borrado de tipos genéricos en Java debes pasar 'super(MyClass.class)' en el constructor vacío",
      "Porque Kafka prohíbe usar clases de io.quarkus en canales incoming",
      "Porque ObjectMapperDeserializer es una interfaz",
      "Solo por estilo de código, no es necesario"
    ],
    correct: 0,
    explanation: "Al serializar (Java -> JSON), Jackson ya tiene la instancia del objeto y conoce su clase. Pero al deserializar (bytes -> Java), Kafka instancia el Deserializer por reflexión con un constructor sin argumentos, por lo que tu subclase debe pasar 'super(TuClase.class)'.",
    kidTip: "Entender el porqué te ayuda a no olvidarlo nunca: super(TuClase.class) le dice a Jackson qué clase fabricar a partir de los bytes de Kafka."
  },
  {
    id: "msg-ann-16",
    module: "messaging",
    category: "code",
    question: "En `application.properties`, quieres que tu consumidor de Kafka `@Incoming(\"warnings-in\")` lea todos los mensajes desde el principio del topic si aún no existe un offset guardado. ¿Qué propiedad configuras?",
    code: `mp.messaging.incoming.warnings-in.connector=smallrye-kafka
mp.messaging.incoming.warnings-in.________________________________ = earliest`,
    options: [
      "auto.offset.reset",
      "start.from",
      "offset.policy",
      "read.mode"
    ],
    correct: 0,
    explanation: "'mp.messaging.incoming.<canal>.auto.offset.reset=earliest' (por defecto en Kafka es 'latest') asegura que en los tests y al arrancar no se pierdan mensajes enviados justo antes de que el consumidor se conectara.",
    kidTip: "auto.offset.reset=earliest lee desde el primer mensaje del topic."
  },
  {
    id: "msg-ann-17",
    module: "messaging",
    category: "annotation",
    question: "Si la clase que contiene tu método `@Incoming(\"warnings-in\")` NO tiene ninguna anotación a nivel de clase, ¿qué anotación de ámbito CDI debes ponerle a la clase para que Quarkus registre y active el consumidor de Kafka?",
    code: `// ¿Qué anotación va sobre la clase que contiene métodos @Incoming / @Outgoing?
public class WarningConsumer {
    @Incoming("warnings-in")
    public void consume(WeatherWarning w) { ... }
}`,
    options: [
      "@ApplicationScoped",
      "@RequestScoped",
      "@Entity",
      "@RegisterRestClient"
    ],
    correct: 0,
    explanation: "Toda clase que contenga métodos '@Incoming' o '@Outgoing' debe tener ámbito '@ApplicationScoped' (o '@Singleton'), ya que el consumidor vive durante toda la ejecución de la aplicación (NO puede ser '@RequestScoped').",
    kidTip: "Las clases con @Incoming / @Outgoing siempre llevan @ApplicationScoped arriba."
  },
  {
    id: "msg-ann-18",
    module: "messaging",
    category: "when",
    question: "Si en `application.properties` configuras `mp.messaging.incoming.warnings-in.connector=smallrye-kafka` pero NO escribes la línea `mp.messaging.incoming.warnings-in.topic=...`, ¿de qué topic de Kafka intentará leer Quarkus por defecto?",
    code: `mp.messaging.incoming.warnings-in.connector=smallrye-kafka
# No se especificó .topic`,
    options: [
      "Usará el mismo nombre del canal como nombre del topic en Kafka: 'warnings-in'",
      "Lanzará una excepción al arrancar exigiendo la propiedad .topic",
      "Leerá del topic 'default'",
      "Leerá de todos los topics de Kafka al mismo tiempo"
    ],
    correct: 0,
    explanation: "Si no especificas '.topic', SmallRye Kafka asume que el topic de Kafka se llama exactamente igual que el canal ('warnings-in'). Si el examen te pide un nombre de canal distinto al nombre del topic, debes especificar '.topic=nombre-topic'.",
    kidTip: "Si el canal y el topic se llaman distinto, no olvides poner mp.messaging.incoming.<canal>.topic=<nombre-topic>."
  },
  {
    id: "msg-ann-19",
    module: "messaging",
    category: "code",
    question: "¿Qué propiedad global en `application.properties` define la dirección de los servidores (brokers) de Kafka (por ejemplo `localhost:9092`) para todos los canales de la aplicación?",
    code: `# Dirección del clúster Kafka en application.properties:
____________________________________ = localhost:9092`,
    options: [
      "kafka.bootstrap.servers",
      "quarkus.kafka.url",
      "mp.messaging.kafka.host",
      "smallrye.kafka.brokers"
    ],
    correct: 0,
    explanation: "'kafka.bootstrap.servers=localhost:9092' configura globalmente la dirección de los brokers de Kafka para todos los canales 'smallrye-kafka'.",
    kidTip: "En Quarkus, el servidor de Kafka se configura con kafka.bootstrap.servers=localhost:9092 (y en modo dev/test DevServices lo levanta solo si no lo pones)."
  },
  {
    id: "msg-ann-20",
    module: "messaging",
    category: "annotation",
    question: "En un método productor reactivo `@Outgoing(\"ticks\")` que genera un evento cada segundo usando `Multi.createFrom().ticks().every(Duration.ofSeconds(1))`, ¿debe ese método recibir algún parámetro o llevar `@Incoming`?",
    code: `@ApplicationScoped
public class TickerGenerator {
    @Outgoing("ticks")
    public Multi<Long> generateTicks() {
        return Multi.createFrom().ticks().every(Duration.ofSeconds(1));
    }
}`,
    options: [
      "No; un método que actúa como fuente (Source) solo lleva @Outgoing(\"canal\"), no recibe parámetros y retorna un Multi<T> (o Publisher<T>)",
      "Sí, siempre es obligatorio poner @Incoming junto a @Outgoing",
      "Debe llevar @PathParam en el parámetro",
      "Debe llevar @Blocking obligatoriamente"
    ],
    correct: 0,
    explanation: "Existen 3 firmas en Reactive Messaging: 1) Fuente (solo '@Outgoing', sin parámetros), 2) Consumidor/Sink (solo '@Incoming', retorna 'void' o 'CompletionStage<Void>'), y 3) Procesador ('@Incoming' + '@Outgoing' en el mismo método).",
    kidTip: "Solo @Outgoing = Fuente | Solo @Incoming = Consumidor | @Incoming + @Outgoing juntos = Procesador transformador."
  }
);

// ============================================================================
// PREGUNTAS PRÁCTICAS ORIENTADAS A OBJETIVOS EX378 (Búsquedas, Filtros, Código)
// ============================================================================
window.QUESTION_BANK.push(
  // --- PANACHE: BÚSQUEDAS, FILTROS, PAGINACIÓN, UPDATES (12) ---
  {
    id: "pan-prac-1",
    module: "panache",
    category: "code",
    question: "En Panache Active Record (`Order extends PanacheEntity`), ¿cómo buscas todos los pedidos cuyo campo `status` sea exactamente `\"PAID\"`?",
    code: `public List<Order> findPaidOrders() {
    // TODO: retornar pedidos con status = "PAID"
}`,
    options: [
      "return Order.find(\"status\", \"PAID\").list();",
      "return Order.findBy(\"status\", \"PAID\");",
      "return Order.where(\"status = 'PAID'\").all();",
      "return Order.list(\"status\", \"PAID\");"
    ],
    correct: 0,
    explanation: "Con Panache, `find(\"campo\", valor)` devuelve un `PanacheQuery<T>`. Encadenando `.list()` obtienes `List<Order>`. También existe el atajo `Order.list(\"status\", \"PAID\")`? Ojo: `Order.list(\"status\", \"PAID\")` SÍ existe en Panache, pero en `find(\"status\", \"PAID\").list()` es la forma estándar sobre `PanacheQuery` (que además permite `.page()`, `.firstResult()`, etc.).",
    kidTip: "Si solo pasas un campo y un valor a `find(\"campo\", valor).list()`, Panache genera automáticamente `WHERE campo = ?1`."
  },
  {
    id: "pan-prac-2",
    module: "panache",
    category: "code",
    question: "Necesitas filtrar productos en Panache donde `category` sea igual a un parámetro Y `price` sea menor o igual al máximo indicado. ¿Cuál es la sintaxis correcta con parámetros posicionales?",
    code: `public List<Product> search(String category, double maxPrice) {
    // TODO: filtrar por category = ?1 y price <= ?2
}`,
    options: [
      "return Product.find(\"category = ?1 and price <= ?2\", category, maxPrice).list();",
      "return Product.find(\"category = :1 and price <= :2\", category, maxPrice).list();",
      "return Product.find(\"category = ? and price <= ?\", category, maxPrice).list();",
      "return Product.filter(\"category = ?1 && price <= ?2\", category, maxPrice).list();"
    ],
    correct: 0,
    explanation: "Panache usa HQL/JPQL simplificado: los parámetros posicionales se escriben `?1`, `?2`, etc. (base 1, nunca `?` ni `:1`) y el operador lógico es `and` (no `&&`).",
    kidTip: "En Panache los huecos posicionales SIEMPRE empiezan en `?1`, `?2`, `?3` y las palabras lógicas son `and` / `or`."
  },
  {
    id: "pan-prac-3",
    module: "panache",
    category: "code",
    question: "Quieres usar parámetros nombrados (`:min` y `:cat`) en una consulta Panache para que sea más legible. ¿Qué clase auxiliar de Panache se usa para pasar los valores?",
    code: `List<Product> items = Product.find(
    "category = :cat and price >= :min",
    /* TODO: pasar parámetros nombrados */
).list();`,
    options: [
      "Parameters.with(\"cat\", cat).and(\"min\", min)",
      "Params.of(\"cat\", cat, \"min\", min)",
      "QueryParams.add(\"cat\", cat).add(\"min\", min)",
      "Map.entry(\"cat\", cat)"
    ],
    correct: 0,
    explanation: "`io.quarkus.panache.common.Parameters` permite construir parámetros nombrados de forma fluida: `Parameters.with(\"cat\", cat).and(\"min\", min)` (también acepta un `Map<String, Object>`).",
    kidTip: "Para `:nombre` en Panache, recuerda `Parameters.with(\"nombre\", valor).and(\"otro\", valor2)`."
  },
  {
    id: "pan-prac-4",
    module: "panache",
    category: "code",
    question: "Debes implementar una búsqueda de texto parcial (contiene `term`, sin importar mayúsculas/minúsculas) sobre el campo `name` en Panache. ¿Cuál es la forma correcta?",
    code: `public List<Speaker> searchByName(String term) {
    // TODO: búsqueda LIKE case-insensitive
}`,
    options: [
      "return Speaker.find(\"lower(name) like ?1\", \"%\" + term.toLowerCase() + \"%\").list();",
      "return Speaker.find(\"name contains ?1\", term).list();",
      "return Speaker.find(\"name ilike '%?1%'\", term).list();",
      "return Speaker.find(\"name like %?1%\", term).list();"
    ],
    correct: 0,
    explanation: "En JPQL/Panache, los comodines `%` se concatenan en el argumento Java (`\"%\" + term.toLowerCase() + \"%\"`), nunca dentro de la cadena HQL alrededor de `?1`, y `lower(name)` asegura case-insensitivity estándar.",
    kidTip: "Los `%` del LIKE van en el valor del parámetro en Java, NO escritos alrededor de `?1` en la consulta."
  },
  {
    id: "pan-prac-5",
    module: "panache",
    category: "code",
    question: "En un endpoint `GET /books/{id}`, quieres buscar por ID usando Panache y lanzar automáticamente un HTTP 404 (`NotFoundException`) si no existe. ¿Cuál es el patrón más limpio?",
    code: `@GET
@Path("/{id}")
public Book getById(@PathParam("id") Long id) {
    // TODO: buscar por id o lanzar 404
}`,
    options: [
      "return (Book) Book.findByIdOptional(id).orElseThrow(NotFoundException::new);",
      "return Book.findById(id).orElseThrow();",
      "return Book.getOr404(id);",
      "return Book.find(\"id\", id).singleResult();"
    ],
    correct: 0,
    explanation: "`findByIdOptional(id)` devuelve `Optional<PanacheEntityBase>` (en Active Record suele hacerse cast `(Book)` o usar `Book.<Book>findByIdOptional(id)`), permitiendo encadenar `.orElseThrow(NotFoundException::new)`, que Jakarta REST convierte en 404.",
    kidTip: "`findByIdOptional(id).orElseThrow(NotFoundException::new)` es el combo rey para `GET /{id}` en el examen."
  },
  {
    id: "pan-prac-6",
    module: "panache",
    category: "code",
    question: "Quieres obtener todos los empleados ordenados primero por `salary` descendente y luego por `lastName` ascendente usando Panache. ¿Cómo construyes el `Sort`?",
    code: `List<Employee> list = Employee.findAll(
    /* TODO: ordenar por salary DESC y lastName ASC */
).list();`,
    options: [
      "Sort.by(\"salary\").descending().and(\"lastName\").ascending()",
      "Sort.desc(\"salary\").asc(\"lastName\")",
      "OrderBy.of(\"salary DESC, lastName ASC\")",
      "Sort.by(\"salary\", Direction.DESC).then(\"lastName\")"
    ],
    correct: 0,
    explanation: "`io.quarkus.panache.common.Sort` usa el patrón fluido `Sort.by(\"campo1\").descending().and(\"campo2\").ascending()` (por defecto `.by(...)` es ascendente).",
    kidTip: "`Sort.by(\"campo\").descending().and(\"otro\").ascending()` — fácil de recordar leyendo en inglés."
  },
  {
    id: "pan-prac-7",
    module: "panache",
    category: "code",
    question: "Tienes una búsqueda paginada en Panache y necesitas tanto los elementos de la página `pageIndex` (tamaño `pageSize`) como saber cuántas páginas totales hay. ¿Qué métodos de `PanacheQuery` usas?",
    code: `PanacheQuery<Book> query = Book.find("active", true)
    .page(Page.of(pageIndex, pageSize));
List<Book> items = query.list();
int totalPages = /* TODO */;`,
    options: [
      "query.pageCount()",
      "query.totalPages()",
      "query.pages()",
      "Page.count(query)"
    ],
    correct: 0,
    explanation: "Sobre `PanacheQuery`, `.page(Page.of(index, size))` (con índice base 0) configura la paginación, `.list()` trae los registros de esa página, `.pageCount()` devuelve el total de páginas y `.count()` el total de filas.",
    kidTip: "Índice de página en `Page.of(0, 10)` empieza en 0; `query.pageCount()` te da el total de páginas y `query.count()` el total de registros."
  },
  {
    id: "pan-prac-8",
    module: "panache",
    category: "code",
    question: "Necesitas actualizar masivamente en base de datos el `status` a `\"EXPIRED\"` de todas las suscripciones donde `active = false`, dentro de un método `@Transactional`. ¿Qué método de Panache lo hace en una sola sentencia?",
    code: `@Transactional
public long expireInactive() {
    // TODO: actualizar status = 'EXPIRED' donde active = false
}`,
    options: [
      "return Subscription.update(\"status = ?1 where active = ?2\", \"EXPIRED\", false);",
      "return Subscription.find(\"active\", false).update(\"status\", \"EXPIRED\");",
      "return Subscription.bulkUpdate(\"status\", \"EXPIRED\", \"active = false\");",
      "return Subscription.set(\"status = 'EXPIRED'\").where(\"active = false\");"
    ],
    correct: 0,
    explanation: "`PanacheEntity.update(\"campo = ?1 where condicion = ?2\", val1, val2)` ejecuta un `UPDATE` masivo en JPQL y devuelve el número de filas afectadas (`long`).",
    kidTip: "Para UPDATE masivo usa `Entidad.update(\"setCampo = ?1 where condicion\", ...)` dentro de `@Transactional`."
  },
  {
    id: "pan-prac-9",
    module: "panache",
    category: "code",
    question: "¿Cómo eliminas todas las tareas con `status = \"DONE\"` usando Panache dentro de un método `@Transactional`?",
    code: `@Transactional
public long cleanDoneTasks() {
    // TODO: eliminar tareas con status = "DONE"
}`,
    options: [
      "return Task.delete(\"status\", \"DONE\");",
      "return Task.remove(\"status = 'DONE'\");",
      "return Task.find(\"status\", \"DONE\").delete();",
      "return Task.deleteAll(\"status = ?1\", \"DONE\");"
    ],
    correct: 0,
    explanation: "`Task.delete(\"status\", \"DONE\")` (o `Task.delete(\"status = ?1\", \"DONE\")`) ejecuta un `DELETE` directo y retorna la cantidad de registros eliminados (`long`).",
    kidTip: "`Entidad.delete(\"campo\", valor)` borra y devuelve cuántas filas eliminó."
  },
  {
    id: "pan-prac-10",
    module: "panache",
    category: "code",
    question: "En un método `@PUT` anotado con `@Transactional`, buscas una entidad existente con `findById(id)` y modificas sus campos (`entity.name = dto.name;`). ¿Es necesario llamar a `entity.persist()`?",
    code: `@PUT
@Path("/{id}")
@Transactional
public Book update(@PathParam("id") Long id, Book input) {
    Book entity = Book.findById(id);
    if (entity == null) throw new NotFoundException();
    entity.title = input.title;
    // ¿Hace falta entity.persist()?
    return entity;
}`,
    options: [
      "No hace falta; al estar dentro de @Transactional, la entidad está gestionada (managed) y Hibernate guarda los cambios al hacer commit (dirty checking)",
      "Sí, obligatorio llamar a entity.persist() o no se guarda nada",
      "Hay que llamar a Book.merge(entity)",
      "Solo se guarda si llamas a entity.flush()"
    ],
    correct: 0,
    explanation: "En JPA/Hibernate dentro de `@Transactional`, cualquier entidad recuperada de la BD está en estado *managed*. Al terminar la transacción, Hibernate detecta los cambios (dirty checking) y ejecuta el `UPDATE` automáticamente.",
    kidTip: "Modificar una entidad buscada dentro de `@Transactional` la actualiza sola al salir del método; `persist()` es solo para entidades nuevas."
  },
  {
    id: "pan-prac-11",
    module: "panache",
    category: "code",
    question: "Quieres que una consulta Panache devuelva directamente un DTO (`BookSummary`) sin cargar todas las columnas de la entidad `Book`. ¿Qué método de `PanacheQuery` usas?",
    code: `public List<BookSummary> getSummaries() {
    return Book.findAll()
        /* TODO: proyectar al DTO BookSummary */
        .list();
}`,
    options: [
      ".project(BookSummary.class)",
      ".as(BookSummary.class)",
      ".mapTo(BookSummary.class)",
      ".select(BookSummary.class)"
    ],
    correct: 0,
    explanation: "`.project(BookSummary.class)` le indica a Panache que proyecte solo los campos que coinciden con el constructor del DTO `BookSummary` (que debe tener un constructor con esos parámetros y es buena práctica anotarlo con `@RegisterForReflection`).",
    kidTip: "Para devolver DTOs directo desde Panache: `.project(MiDto.class).list()`."
  },
  {
    id: "pan-prac-12",
    module: "panache",
    category: "code",
    question: "Tu entidad `Invoice` tiene clave primaria de tipo `UUID` (no `Long`). Si usas el patrón Repository, ¿qué interfaz debe implementar `InvoiceRepository`?",
    code: `@ApplicationScoped
public class InvoiceRepository implements /* TODO */ {
}`,
    options: [
      "PanacheRepositoryBase<Invoice, UUID>",
      "PanacheRepository<Invoice, UUID>",
      "PanacheEntityBase<Invoice, UUID>",
      "CrudRepository<Invoice, UUID>"
    ],
    correct: 0,
    explanation: "`PanacheRepository<T>` asume ID de tipo `Long`. Cuando el ID es otro tipo (`UUID`, `String`, etc.), debes implementar `PanacheRepositoryBase<Entidad, TipoId>`.",
    kidTip: "`PanacheRepository<T>` = ID `Long`. `PanacheRepositoryBase<T, ID>` = cualquier tipo de ID (como `UUID` o `String`)."
  },

  // --- RESTEASY REACTIVE & JAKARTA REST (8) ---
  {
    id: "rest-prac-1",
    module: "rest",
    category: "code",
    question: "En un endpoint `@POST`, quieres crear un recurso `Book`, guardar en BD y retornar código HTTP `201 Created` con el header `Location` apuntando al nuevo recurso y el objeto creado en el body. ¿Cuál es la forma correcta?",
    code: `@POST
@Transactional
public Response create(Book book, @Context UriInfo uriInfo) {
    book.persist();
    // TODO: retornar 201 Created con Location y body
}`,
    options: [
      "URI uri = uriInfo.getAbsolutePathBuilder().path(book.id.toString()).build();\nreturn Response.created(uri).entity(book).build();",
      "return Response.ok(book).status(201).build();",
      "return Response.status(201).location(book.id.toString()).build();",
      "return Response.created(book).build();"
    ],
    correct: 0,
    explanation: "`Response.created(URI)` establece el status `201` y el header `Location`. Con `uriInfo.getAbsolutePathBuilder().path(...).build()` construyes la URI absoluta del nuevo recurso y `.entity(book)` añade el JSON al cuerpo.",
    kidTip: "`Response.created(uri).entity(obj).build()` = 201 + header Location + body JSON."
  },
  {
    id: "rest-prac-2",
    module: "rest",
    category: "code",
    question: "Quieres implementar `GET /items?page=0&size=20` donde `page` y `size` sean opcionales con valores por defecto `0` y `20`. ¿Cómo declaras los parámetros?",
    code: `@GET
public List<Item> list(
    /* TODO: query params con default */
) { ... }`,
    options: [
      "@QueryParam(\"page\") @DefaultValue(\"0\") int page, @QueryParam(\"size\") @DefaultValue(\"20\") int size",
      "@RequestParam(defaultValue = \"0\") int page, @RequestParam(defaultValue = \"20\") int size",
      "@QueryParam(value = \"page\", defaultValue = \"0\") int page",
      "@PathParam(\"page\") @WithDefault(\"0\") int page"
    ],
    correct: 0,
    explanation: "En Jakarta REST se combina `@QueryParam(\"nombre\")` con `@DefaultValue(\"valor\")` (siempre String). `@RequestParam` es de Spring y `@WithDefault` es de `@ConfigMapping`.",
    kidTip: "En endpoints REST: `@QueryParam` + `@DefaultValue(\"...\")`."
  },
  {
    id: "rest-prac-3",
    module: "rest",
    category: "code",
    question: "Tienes un DTO `CreateUserDto` con `@NotBlank String email;`. ¿Qué anotación debes poner en el parámetro del método `@POST` para que Quarkus valide automáticamente el JSON y devuelva `400 Bad Request` si es inválido?",
    code: `@POST
public Response create(/* TODO */ CreateUserDto dto) {
    ...
}`,
    options: [
      "@Valid",
      "@Validated",
      "@Check",
      "@NotNull"
    ],
    correct: 0,
    explanation: "La anotación estándar de Jakarta Bean Validation en el parámetro del recurso REST es `@Valid` (de `jakarta.validation.Valid`), junto con la extensión `quarkus-hibernate-validator`.",
    kidTip: "`@Valid` en el parámetro del método REST activa las validaciones `@NotBlank`, `@NotNull`, `@Min`, etc. del DTO."
  },
  {
    id: "rest-prac-4",
    module: "rest",
    category: "code",
    question: "En RESTEasy Reactive (Quarkus REST), ¿qué anotación simplificada permite convertir un método dentro de una clase (sin implementar `ExceptionMapper<T>`) en un manejador global de excepciones HTTP?",
    code: `public class GlobalExceptionMapper {
    /* TODO */
    public RestResponse<String> mapNotFound(InsufficientFundsException ex) {
        return RestResponse.status(Response.Status.CONFLICT, ex.getMessage());
    }
}`,
    options: [
      "@ServerExceptionMapper",
      "@ExceptionHandler",
      "@RestExceptionMapper",
      "@CatchException"
    ],
    correct: 0,
    explanation: "RESTEasy Reactive ofrece `@ServerExceptionMapper` (`org.jboss.resteasy.reactive.server.ServerExceptionMapper`), que evita tener que registrar `@Provider` e implementar `ExceptionMapper<T>`.",
    kidTip: "`@ServerExceptionMapper` es el atajo moderno de Quarkus REST para mapear excepciones a códigos HTTP."
  },
  {
    id: "rest-prac-5",
    module: "rest",
    category: "code",
    question: "En un endpoint `@DELETE @Path(\"/{id}\")` usando `RestResponse<Void>` (de RESTEasy Reactive), ¿cómo devuelves `204 No Content` si se borró correctamente y `404 Not Found` si no existía?",
    code: `@DELETE
@Path("/{id}")
@Transactional
public RestResponse<Void> delete(@PathParam("id") Long id) {
    boolean deleted = Book.deleteById(id);
    // TODO: 204 si true, 404 si false
}`,
    options: [
      "return deleted ? RestResponse.noContent() : RestResponse.notFound();",
      "return deleted ? RestResponse.ok() : RestResponse.status(404);",
      "return deleted ? Response.noContent().build() : Response.status(404).build();",
      "return RestResponse.deleted(deleted);"
    ],
    correct: 0,
    explanation: "`RestResponse<T>` tiene métodos estáticos tipados muy limpios: `RestResponse.noContent()` (204), `RestResponse.notFound()` (404), `RestResponse.ok(entity)` (200), `RestResponse.created(uri)` (201).",
    kidTip: "`RestResponse.noContent()` (204) y `RestResponse.notFound()` (404) no necesitan `.build()` al final."
  },
  {
    id: "rest-prac-6",
    module: "rest",
    category: "code",
    question: "Tienes un método REST que retorna `Uni<List<Book>>` pero dentro realiza una llamada bloqueante a JDBC/JPA clásico. ¿Qué anotación debes añadir al método para que Quarkus lo ejecute en un worker thread y no bloquee el event loop?",
    code: `@GET
/* TODO: evitar bloquear el event loop */
public Uni<List<Book>> getBooks() {
    return Uni.createFrom().item(() -> Book.listAll());
}`,
    options: [
      "@Blocking",
      "@Transactional",
      "@Async",
      "@WorkerThread"
    ],
    correct: 0,
    explanation: "En RESTEasy Reactive, los métodos que retornan `Uni` o `Multi` se ejecutan por defecto en el event loop (no bloqueante). Si hacen I/O bloqueante dentro, debes anotarlos con `@Blocking` (`io.smallrye.common.annotation.Blocking`).",
    kidTip: "Si ves `Uni<...>` o `@Incoming` haciendo llamadas bloqueantes (JPA/JDBC/sleep), pon `@Blocking`."
  },
  {
    id: "rest-prac-7",
    module: "rest",
    category: "code",
    question: "Quieres leer el header HTTP `X-Correlation-Id` en un método `@GET` de Jakarta REST. ¿Qué anotación usas en el parámetro?",
    code: `@GET
public Response check(/* TODO */ String correlationId) { ... }`,
    options: [
      "@HeaderParam(\"X-Correlation-Id\")",
      "@RequestHeader(\"X-Correlation-Id\")",
      "@HttpHeader(\"X-Correlation-Id\")",
      "@ClientHeaderParam(name = \"X-Correlation-Id\")"
    ],
    correct: 0,
    explanation: "En el servidor Jakarta REST se usa `@HeaderParam(\"Nombre-Header\")`. `@ClientHeaderParam` es solo para enviar headers en el REST Client.",
    kidTip: "Servidor REST = `@HeaderParam`. Cliente REST = `@ClientHeaderParam` (o `@HeaderParam` en la interfaz cliente)."
  },
  {
    id: "rest-prac-8",
    module: "rest",
    category: "code",
    question: "Un recurso REST tiene `@Path(\"/api/orders\")` a nivel de clase y un método `@GET @Path(\"/{id}/items\")`. ¿Cuál es la ruta completa final?",
    code: `@Path("/api/orders")
public class OrderResource {
    @GET
    @Path("/{id}/items")
    public List<Item> items(@PathParam("id") Long id) { ... }
}`,
    options: [
      "/api/orders/{id}/items",
      "/{id}/items",
      "/api/orders/items/{id}",
      "/orders/{id}/items"
    ],
    correct: 0,
    explanation: "Jakarta REST concatena el `@Path` de la clase con el `@Path` del método.",
    kidTip: "Las rutas de clase + método siempre se concatenan en orden."
  },

  // --- REST CLIENT REACTIVE (6) ---
  {
    id: "rc-prac-1",
    module: "restclient",
    category: "code",
    question: "Defines una interfaz REST Client para consumir un microservicio externo. ¿Qué par de anotaciones necesitas en la interfaz y en el punto de inyección?",
    code: `/* 1. En la interfaz */
@Path("/payments")
public interface PaymentClient {
    @POST
    PaymentResponse pay(PaymentRequest req);
}

/* 2. En tu servicio */
@ApplicationScoped
public class OrderService {
    /* 2. Inyección */
    PaymentClient client;
}`,
    options: [
      "1) @RegisterRestClient(configKey = \"payment-api\")   2) @Inject @RestClient",
      "1) @RestClient   2) @Inject",
      "1) @RegisterRestClient   2) @Autowired",
      "1) @PathClient   2) @Inject @Client"
    ],
    correct: 0,
    explanation: "La interfaz lleva `@RegisterRestClient(configKey = \"...\")` (o `baseUri`) y en la clase consumidora se inyecta con `@Inject` + `@RestClient` (`org.eclipse.microprofile.rest.client.inject.RestClient`).",
    kidTip: "Interfaz = `@RegisterRestClient(...)`. Campo inyectado = `@Inject @RestClient`."
  },
  {
    id: "rc-prac-2",
    module: "restclient",
    category: "code",
    question: "Tu interfaz cliente tiene `@RegisterRestClient(configKey = \"inventory-api\")`. ¿Cómo configuras su URL base en `application.properties` (en Quarkus REST Client Reactive)?",
    code: `@RegisterRestClient(configKey = "inventory-api")
public interface InventoryClient { ... }`,
    options: [
      "quarkus.rest-client.inventory-api.url=http://localhost:8081",
      "quarkus.rest-client.inventory-api.endpoint=http://localhost:8081",
      "mp.rest.client.inventory-api.host=http://localhost:8081",
      "rest.client.url.inventory-api=http://localhost:8081"
    ],
    correct: 0,
    explanation: "En Quarkus REST Client se usa `quarkus.rest-client.<configKey>.url=...` (o entre comillas `quarkus.rest-client.\"inventory-api\".url=...` si tiene guiones/puntos, aunque sin comillas también funciona para kebab-case).",
    kidTip: "Propiedad estándar: `quarkus.rest-client.<configKey>.url=http://...`."
  },
  {
    id: "rc-prac-3",
    module: "restclient",
    category: "code",
    question: "Necesitas que todas las llamadas de tu `InventoryClient` envíen automáticamente el header `X-Api-Key` leyendo una propiedad o valor fijo. ¿Qué anotación usas en la interfaz o método?",
    code: `@RegisterRestClient(configKey = "inventory-api")
/* TODO: enviar header X-Api-Key = my-secret */
public interface InventoryClient {
    @GET @Path("/stock")
    int getStock();
}`,
    options: [
      "@ClientHeaderParam(name = \"X-Api-Key\", value = \"my-secret\")",
      "@HeaderParam(\"X-Api-Key\")",
      "@DefaultHeader(name = \"X-Api-Key\", value = \"my-secret\")",
      "@AddHeader(\"X-Api-Key: my-secret\")"
    ],
    correct: 0,
    explanation: "`@ClientHeaderParam(name = \"...\", value = \"...\")` añade headers salientes en el REST Client. Incluso acepta expresiones `${propiedad}` o `{metodoCalculo}`.",
    kidTip: "`@ClientHeaderParam(name = \"...\", value = \"...\")` sirve para inyectar headers fijos, de propiedades o calculados en el cliente REST."
  },
  {
    id: "rc-prac-4",
    module: "restclient",
    category: "code",
    question: "Quieres llamar de forma reactiva y no bloqueante al servicio externo usando REST Client Reactive. ¿Qué tipo de retorno debe tener el método en la interfaz?",
    code: `@RegisterRestClient(configKey = "catalog-api")
@Path("/products")
public interface CatalogClient {
    @GET @Path("/{id}")
    /* TODO: retorno reactivo */ getProduct(@PathParam("id") Long id);
}`,
    options: [
      "Uni<Product>",
      "Optional<Product>",
      "Mono<Product>",
      "Stream<Product>"
    ],
    correct: 0,
    explanation: "Quarkus REST Client Reactive usa Mutiny: retorna `Uni<T>` para una respuesta única asíncrona (o `CompletionStage<T>`).",
    kidTip: "En Quarkus reactivo: 1 elemento = `Uni<T>`, flujo de muchos = `Multi<T>`."
  },
  {
    id: "rc-prac-5",
    module: "restclient",
    category: "code",
    question: "El servicio remoto devuelve `404 Not Found` y quieres que el REST Client lo transforme en tu excepción personalizada `RemoteNotFoundException` sin escribir un `ResponseExceptionMapper` completo. ¿Qué anotación usas en la interfaz cliente?",
    code: `@RegisterRestClient(configKey = "catalog-api")
public interface CatalogClient {
    /* TODO */
    static RuntimeException toException(Response response) {
        if (response.getStatus() == 404) return new RemoteNotFoundException();
        return null;
    }
}`,
    options: [
      "@ClientExceptionMapper",
      "@ServerExceptionMapper",
      "@ResponseErrorHandler",
      "@ExceptionMapper"
    ],
    correct: 0,
    explanation: "`@ClientExceptionMapper` (`io.quarkus.rest.client.reactive.ClientExceptionMapper`) permite definir un método `static` en la propia interfaz cliente que recibe `Response` y devuelve la excepción (o `null` si no aplica).",
    kidTip: "Servidor = `@ServerExceptionMapper`. Cliente = `@ClientExceptionMapper`."
  },
  {
    id: "rc-prac-6",
    module: "restclient",
    category: "code",
    question: "¿Qué propiedad en `application.properties` permite propagar headers entrantes (como `Authorization`) desde tu endpoint REST hacia el REST Client saliente?",
    code: `# En application.properties:
# TODO: propagar el header Authorization`,
    options: [
      "quarkus.rest-client.propagate-headers=Authorization",
      "quarkus.rest-client.forward-auth=true",
      "mp.jwt.propagate.headers=Authorization",
      "quarkus.http.propagate-headers=Authorization"
    ],
    correct: 0,
    explanation: "En Quarkus, `quarkus.rest-client.propagate-headers=Authorization,X-Custom` (o `org.eclipse.microprofile.rest.client.propagateHeaders`) propaga headers de la petición entrante a las llamadas salientes del REST Client (usando `DefaultClientHeadersFactoryImpl` o `@RegisterClientHeaders`).",
    kidTip: "`quarkus.rest-client.propagate-headers=Authorization` + `@RegisterClientHeaders` en la interfaz cliente."
  },

  // --- MICROPROFILE FAULT TOLERANCE (6) ---
  {
    id: "ft-prac-1",
    module: "faulttolerance",
    category: "code",
    question: "Quieres reintentar una llamada hasta 3 veces esperando 200ms entre intentos, PERO sin reintentar si lanza `IllegalArgumentException`. ¿Cómo configuras `@Retry`?",
    code: `/* TODO */
public String callRemote(String id) { ... }`,
    options: [
      "@Retry(maxRetries = 3, delay = 200, abortOn = IllegalArgumentException.class)",
      "@Retry(attempts = 3, wait = 200, ignore = IllegalArgumentException.class)",
      "@Retry(maxRetries = 3, delay = 200, skipOn = IllegalArgumentException.class)",
      "@Retry(count = 3, delayMs = 200, unless = IllegalArgumentException.class)"
    ],
    correct: 0,
    explanation: "Los atributos exactos de `@Retry` en MicroProfile Fault Tolerance son `maxRetries`, `delay` (por defecto en milisegundos, configurable con `delayUnit`), `retryOn` y `abortOn`.",
    kidTip: "En `@Retry`: `abortOn = MiExcepcion.class` detiene los reintentos inmediatamente; `retryOn` indica en cuáles sí reintentar."
  },
  {
    id: "ft-prac-2",
    module: "faulttolerance",
    category: "code",
    question: "Configuras `@Timeout(500)` y `@Fallback(fallbackMethod = \"fallbackPrice\")` en un método. ¿Qué requisito OBLIGATORIO debe cumplir `fallbackPrice`?",
    code: `@Timeout(500)
@Fallback(fallbackMethod = "fallbackPrice")
public BigDecimal getPrice(String sku, int qty) {
    ...
}`,
    options: [
      "Debe tener exactamente los mismos parámetros (String sku, int qty) y el mismo tipo de retorno (BigDecimal)",
      "No debe recibir ningún parámetro",
      "Debe recibir un parámetro extra Throwable al final",
      "Debe ser static y devolver Response"
    ],
    correct: 0,
    explanation: "En MicroProfile Fault Tolerance, el `fallbackMethod` debe estar en la misma clase y tener EXACTAMENTE la misma firma (mismos tipos de parámetros en el mismo orden y mismo tipo de retorno). Si falla, Quarkus lanza `FaultToleranceDefinitionException` al arrancar!",
    kidTip: "Trampa clásica de examen: `fallbackMethod` = MISMA lista de parámetros y MISMO tipo de retorno (nunca le agregues `Throwable`!)."
  },
  {
    id: "ft-prac-3",
    module: "faulttolerance",
    category: "code",
    question: "Tienes `@CircuitBreaker(requestVolumeThreshold = 4, failureRatio = 0.5, delay = 5000, successThreshold = 2)`. ¿Qué ocurre después de 4 llamadas consecutivas donde 2 fallaron?",
    code: `@CircuitBreaker(
    requestVolumeThreshold = 4,
    failureRatio = 0.5,
    delay = 5000,
    successThreshold = 2
)
public String fetch() { ... }`,
    options: [
      "El circuito se ABRE por 5000 ms y las nuevas llamadas fallan rápido con CircuitBreakerOpenException",
      "El circuito se mantiene cerrado porque 2/4 es exactamente 0.5 y necesita > 0.5",
      "Se reintenta automáticamente 2 veces",
      "Se espera a que lleguen 5000 llamadas más"
    ],
    correct: 0,
    explanation: "`failureRatio = 0.5` significa que si el ratio de fallos es **>= 0.5** (2 de 4 = 0.5) dentro de la ventana de `requestVolumeThreshold = 4`, el circuito se **ABRE** durante `delay = 5000 ms`. Luego pasa a half-open y necesita `successThreshold = 2` éxitos seguidos para cerrarse.",
    kidTip: "Alcanzado `requestVolumeThreshold` con fallos >= `failureRatio`, el circuito ABRE y lanza `CircuitBreakerOpenException`."
  },
  {
    id: "ft-prac-4",
    module: "faulttolerance",
    category: "code",
    question: "Quieres limitar a un máximo de 5 ejecuciones concurrentes de un método costoso, rechazando las demás con `BulkheadException`. ¿Qué anotación usas?",
    code: `/* TODO: máximo 5 llamadas concurrentes */
public Report generateReport() { ... }`,
    options: [
      "@Bulkhead(5)",
      "@RateLimit(5)",
      "@ConcurrencyLimit(5)",
      "@Semaphore(5)"
    ],
    correct: 0,
    explanation: "`@Bulkhead(5)` (atributo `value = 5`) limita las llamadas concurrentes simultáneas a 5. (En métodos `@Asynchronous` también acepta `waitingTaskQueue`).",
    kidTip: "`@Bulkhead(N)` = máximo N ejecuciones al mismo tiempo."
  },
  {
    id: "ft-prac-5",
    module: "faulttolerance",
    category: "code",
    question: "Si combinas `@Fallback`, `@Retry`, `@Timeout` y `@CircuitBreaker` en un mismo método, ¿cuál es el orden de ejecución (de afuera hacia adentro)?",
    code: `@Fallback(fallbackMethod = "fb")
@Retry(maxRetries = 2)
@CircuitBreaker
@Timeout(500)
public String call() { ... }`,
    options: [
      "Fallback -> Retry -> CircuitBreaker -> Timeout -> método (el Fallback envuelve todo al final)",
      "Timeout -> Retry -> Fallback -> CircuitBreaker",
      "Depende del orden en que escribas las anotaciones arriba del método",
      "CircuitBreaker -> Fallback -> Timeout -> Retry"
    ],
    correct: 0,
    explanation: "El orden en MicroProfile Fault Tolerance es fijo (no importa el orden de escritura): `Fallback` es el más externo (captura si todo falla), luego `Retry` reintenta cada intento que pasa por `CircuitBreaker`, `Bulkhead` y `Timeout`.",
    kidTip: "Orden fijo: `Fallback` afuera del todo (salvavidas final), `Retry` reintenta al `CircuitBreaker` / `Timeout`."
  },
  {
    id: "ft-prac-6",
    module: "faulttolerance",
    category: "code",
    question: "¿Cómo puedes sobrescribir en `application.properties` el `maxRetries` de `@Retry` del método `getWeather` de `com.acme.WeatherService` sin recompilar?",
    code: `package com.acme;
public class WeatherService {
    @Retry(maxRetries = 2)
    public String getWeather() { ... }
}`,
    options: [
      "com.acme.WeatherService/getWeather/Retry/maxRetries=5",
      "quarkus.fault-tolerance.WeatherService.getWeather.maxRetries=5",
      "mp.fault.tolerance.Retry.maxRetries=5",
      "com.acme.WeatherService.getWeather.Retry.maxRetries=5"
    ],
    correct: 0,
    explanation: "MicroProfile Fault Tolerance usa barras `/` con la forma `<ClaseCompleta>/<metodo>/<Anotacion>/<atributo>=<valor>` (o `<ClaseCompleta>/<Anotacion>/<atributo>` para nivel clase).",
    kidTip: "Configurar Fault Tolerance por properties usa barras `/`: `paquete.Clase/metodo/Retry/maxRetries=5`."
  },

  // --- MICROPROFILE HEALTH CHECK (5) ---
  {
    id: "hlth-prac-1",
    module: "health",
    category: "code",
    question: "Debes crear un check de Liveness llamado `\"service-alive\"` que devuelva UP con un dato extra `\"version\": \"1.0\"`. ¿Cómo se implementa la clase?",
    code: `/* TODO: anotación de scope y tipo de health */
public class AppLivenessCheck implements HealthCheck {
    @Override
    public HealthCheckResponse call() {
        // TODO: retornar UP con nombre "service-alive" y data version=1.0
    }
}`,
    options: [
      "@Liveness @ApplicationScoped + return HealthCheckResponse.named(\"service-alive\").up().withData(\"version\", \"1.0\").build();",
      "@HealthCheck(type = LIVENESS) + return HealthCheckResponse.up(\"service-alive\");",
      "@Liveness @Path(\"/q/health/live\") + return Response.ok().build();",
      "@Readiness + return HealthCheckResponse.ok(\"service-alive\").build();"
    ],
    correct: 0,
    explanation: "Un Health Check implementa `org.eclipse.microprofile.health.HealthCheck`, se anota con `@Liveness` (o `@Readiness` / `@Startup`) y `@ApplicationScoped`, y construye la respuesta con `HealthCheckResponse.named(\"...\").up().withData(...).build()`.",
    kidTip: "`HealthCheckResponse.named(\"...\").up().withData(\"k\", \"v\").build()` (o `.down()`)."
  },
  {
    id: "hlth-prac-2",
    module: "health",
    category: "code",
    question: "Tienes un check `@Readiness` que verifica si la API externa está disponible. Si `isExternalUp()` es `false`, ¿qué debe retornar para que `/q/health/ready` responda HTTP `503 Service Unavailable`?",
    code: `@Readiness
@ApplicationScoped
public class ExternalApiHealthCheck implements HealthCheck {
    @Override
    public HealthCheckResponse call() {
        if (!isExternalUp()) {
            // TODO
        }
        return HealthCheckResponse.up("external-api");
    }
}`,
    options: [
      "return HealthCheckResponse.down(\"external-api\");",
      "throw new ServiceUnavailableException();",
      "return null;",
      "return HealthCheckResponse.named(\"external-api\").status(503).build();"
    ],
    correct: 0,
    explanation: "Cuando cualquier `HealthCheck` retorna un `HealthCheckResponse` con estado `DOWN` (`HealthCheckResponse.down(\"nombre\")` o `.down().build()`), SmallRye Health automáticamente cambia el HTTP status del endpoint `/q/health/ready` a `503`.",
    kidTip: "Nunca lances excepción HTTP manual en `HealthCheck`: simplemente retorna `.down()` y Quarkus devuelve 503."
  },
  {
    id: "hlth-prac-3",
    module: "health",
    category: "code",
    question: "¿Qué diferencia práctica existe entre `@Liveness`, `@Readiness` y `@Startup` en MicroProfile Health?",
    code: `// Endpoints generados por quarkus-smallrye-health:
// /q/health/live
// /q/health/ready
// /q/health/started`,
    options: [
      "@Liveness indica si la app está viva (si falla, Kubernetes reinicia el pod); @Readiness si está lista para recibir tráfico; @Startup si terminó de arrancar",
      "@Liveness es solo para base de datos y @Readiness solo para CPU",
      "Los tres hacen exactamente lo mismo y solo cambia el nombre",
      "@Startup se ejecuta en cada petición HTTP"
    ],
    correct: 0,
    explanation: "En Kubernetes/OpenShift: Liveness DOWN -> reinicio del contenedor; Readiness DOWN -> saca al pod del Service/LoadBalancer temporalmente; Startup DOWN -> retrasa las sondas liveness/readiness hasta que arranque.",
    kidTip: "Liveness = ¿sigo vivo? | Readiness = ¿puedo recibir tráfico ya? | Startup = ¿terminé de arrancar?"
  },
  {
    id: "hlth-prac-4",
    module: "health",
    category: "code",
    question: "Tu Health Check necesita consultar un servicio reactivo que devuelve `Uni<Boolean>` sin bloquear el event loop. ¿Qué interfaz debes implementar en lugar de `HealthCheck`?",
    code: `@Readiness
@ApplicationScoped
public class ReactiveDbCheck implements /* TODO */ {
    @Override
    public Uni<HealthCheckResponse> call() {
        return checkDb().map(ok -> ok
            ? HealthCheckResponse.up("db")
            : HealthCheckResponse.down("db"));
    }
}`,
    options: [
      "AsyncHealthCheck",
      "ReactiveHealthCheck",
      "UniHealthCheck",
      "NonBlockingHealthCheck"
    ],
    correct: 0,
    explanation: "SmallRye Health provee `io.smallrye.health.api.AsyncHealthCheck`, cuyo método `call()` retorna `Uni<HealthCheckResponse>`.",
    kidTip: "HealthCheck síncrono = `HealthCheck`. HealthCheck reactivo (`Uni`) = `AsyncHealthCheck`."
  },
  {
    id: "hlth-prac-5",
    module: "health",
    category: "code",
    question: "¿Qué extensión de Quarkus debes añadir al `pom.xml` para habilitar los endpoints `/q/health`, `/q/health/live` y `/q/health/ready`?",
    code: `<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId><!-- TODO --></artifactId>
</dependency>`,
    options: [
      "quarkus-smallrye-health",
      "quarkus-micrometer-health",
      "quarkus-microprofile-health",
      "quarkus-actuator"
    ],
    correct: 0,
    explanation: "La extensión oficial en Quarkus es `quarkus-smallrye-health`.",
    kidTip: "Health en Quarkus siempre es `quarkus-smallrye-health` y vive bajo `/q/health`."
  },

  // --- MICROMETER METRICS (5) ---
  {
    id: "met-prac-1",
    module: "metrics",
    category: "code",
    question: "Quieres contar cuántas veces se llama al método `createOrder()` y medir su tiempo de ejecución usando anotaciones de Micrometer. ¿Qué anotaciones (y paquete) usas?",
    code: `/* TODO: anotar para contar y medir duración */
public Order createOrder(OrderReq req) { ... }`,
    options: [
      "@Counted(\"orders.created\") y @Timed(\"orders.duration\") de io.micrometer.core.annotation",
      "@Counted y @Timed de org.eclipse.microprofile.metrics.annotation",
      "@MetricCount y @MetricTimer de io.quarkus.micrometer",
      "@Counter y @Timer de jakarta.metrics"
    ],
    correct: 0,
    explanation: "EX378 usa **Micrometer** (`io.micrometer.core.annotation.Counted` y `Timed`), NO la especificación legada de MicroProfile Metrics (`org.eclipse.microprofile.metrics`).",
    kidTip: "¡Ojo con los imports! En el examen usa `io.micrometer.core.annotation.Counted` y `Timed`, nunca `org.eclipse.microprofile.metrics`."
  },
  {
    id: "met-prac-2",
    module: "metrics",
    category: "code",
    question: "Inyectas `MeterRegistry` de Micrometer en un servicio y quieres incrementar un contador llamado `\"payments.processed\"` con el tag `status=\"success\"`. ¿Cuál es la sintaxis correcta?",
    code: `@Inject
MeterRegistry registry;

public void onSuccess() {
    // TODO: incrementar contador con tag status=success
}`,
    options: [
      "registry.counter(\"payments.processed\", \"status\", \"success\").increment();",
      "registry.getCounter(\"payments.processed\").inc(\"status\", \"success\");",
      "registry.addMetric(\"payments.processed\", 1);",
      "Counter.increment(\"payments.processed\", \"status=success\");"
    ],
    correct: 0,
    explanation: "En `MeterRegistry`, los tags se pasan como pares clave-valor alternos: `registry.counter(\"nombre\", \"clave1\", \"valor1\", ...).increment()`.",
    kidTip: "`registry.counter(\"nombre\", \"tagKey\", \"tagVal\").increment()`."
  },
  {
    id: "met-prac-3",
    module: "metrics",
    category: "code",
    question: "Quieres exponer un `Gauge` en Micrometer que reporte en tiempo real el tamaño de una lista/cola `pendingJobs`. ¿Cómo lo registras en el constructor o `@PostConstruct`?",
    code: `private final Queue<Job> pendingJobs = new ConcurrentLinkedQueue<>();

public JobService(MeterRegistry registry) {
    // TODO: registrar gauge "jobs.pending"
}`,
    options: [
      "registry.gauge(\"jobs.pending\", pendingJobs, Collection::size);",
      "registry.counter(\"jobs.pending\", pendingJobs.size());",
      "@Gauge(\"jobs.pending\") int size() { return pendingJobs.size(); }",
      "registry.setGauge(\"jobs.pending\", pendingJobs.size());"
    ],
    correct: 0,
    explanation: "`registry.gauge(\"nombre\", objetoObservado, objeto -> objeto.size())` mantiene una referencia débil al objeto y evalúa la función cada vez que Prometheus raspa `/q/metrics`.",
    kidTip: "Para valores que suben y bajan (como el tamaño de una cola), usa `registry.gauge(\"nombre\", coleccion, Collection::size)`."
  },
  {
    id: "met-prac-4",
    module: "metrics",
    category: "code",
    question: "¿Qué extensión debes añadir para que Micrometer exponga las métricas en formato Prometheus en `/q/metrics`?",
    code: `<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId><!-- TODO --></artifactId>
</dependency>`,
    options: [
      "quarkus-micrometer-registry-prometheus",
      "quarkus-smallrye-metrics",
      "quarkus-prometheus-exporter",
      "quarkus-micrometer-core"
    ],
    correct: 0,
    explanation: "`quarkus-micrometer-registry-prometheus` incluye Micrometer y expone automáticamente el endpoint `/q/metrics` para Prometheus (además de métricas JVM y HTTP automáticas).",
    kidTip: "Extensión de métricas en EX378: `quarkus-micrometer-registry-prometheus` -> ruta `/q/metrics`."
  },
  {
    id: "met-prac-5",
    module: "metrics",
    category: "code",
    question: "Si usas `@Timed(\"checkout.time\")` de Micrometer, ¿qué métrica de tiempo adicional te permite obtener percentiles como p50 y p95?",
    code: `@Timed(value = "checkout.time", /* TODO: percentiles 0.5 y 0.95 */)
public void checkout() { ... }`,
    options: [
      "percentiles = {0.5, 0.95}",
      "quantiles = {50, 95}",
      "histogram = true",
      "sla = {0.5, 0.95}"
    ],
    correct: 0,
    explanation: "La anotación `@Timed` de Micrometer acepta `percentiles = {0.5, 0.95}` (valores entre 0.0 y 1.0) y `histogram = true`.",
    kidTip: "En `@Timed`: `percentiles = {0.5, 0.95}`."
  },

  // --- CONFIGURACIÓN (4) ---
  {
    id: "cfg-prac-1",
    module: "config",
    category: "code",
    question: "Tienes `app.greeting=Hola` en `application.properties`, la variable de entorno `APP_GREETING=Buenas`, y ejecutas el JAR con `-Dapp.greeting=QueTal`. ¿Qué valor inyectará `@ConfigProperty(name = \"app.greeting\")`?",
    code: `@ConfigProperty(name = "app.greeting", defaultValue = "Hi")
String greeting;`,
    options: [
      "QueTal (System property -D tiene prioridad 400 > Env var 300 > application.properties 250 > defaultValue)",
      "Buenas (la variable de entorno siempre gana)",
      "Hola (application.properties manda)",
      "Hi (el defaultValue siempre sobrescribe)"
    ],
    correct: 0,
    explanation: "Orden de precedencia SmallRye Config (de mayor a menor): 1) System properties `-D` (400), 2) Environment variables (300), 3) `.env` (295), 4) `config/application.properties` (260), 5) `application.properties` en classpath (250), 6) `defaultValue`.",
    kidTip: "Recuerda la escalera: `-D` (400) > Variable de entorno (300) > `config/application.properties` (260) > `application.properties` (250)."
  },
  {
    id: "cfg-prac-2",
    module: "config",
    category: "code",
    question: "Quieres sobrescribir la propiedad `billing.tax-rate=0.15` usando una variable de entorno del sistema operativo. ¿Qué nombre exacto debe tener la variable de entorno?",
    code: `# En application.properties:
billing.tax-rate=0.15`,
    options: [
      "BILLING_TAX_RATE",
      "BILLING.TAX-RATE",
      "billing_tax_rate",
      "QUARKUS_BILLING_TAX_RATE"
    ],
    correct: 0,
    explanation: "SmallRye Config convierte puntos (`.`) y guiones (`-`) a guiones bajos (`_`) y pasa todo a MAYÚSCULAS: `billing.tax-rate` -> `BILLING_TAX_RATE`.",
    kidTip: "Regla de variable de entorno: todo a MAYÚSCULAS y cualquier `.` o `-` se vuelve `_`."
  },
  {
    id: "cfg-prac-3",
    module: "config",
    category: "code",
    question: "En `application.properties`, tienes `app.ports=8080,8443` y una interfaz `@ConfigMapping(prefix = \"app\")`. ¿Cómo mapeas `ports`?",
    code: `@ConfigMapping(prefix = "app")
public interface AppConfig {
    // TODO: mapear app.ports=8080,8443
}`,
    options: [
      "List<Integer> ports();",
      "int[] ports();",
      "@Csv List<Integer> ports();",
      "String ports();"
    ],
    correct: 0,
    explanation: "SmallRye Config convierte automáticamente valores separados por coma (`8080,8443`) a `List<Integer>` o `Set<Integer>` en `@ConfigMapping` y `@ConfigProperty`.",
    kidTip: "Listas separadas por coma en `application.properties` se inyectan directo como `List<T>` o `Set<T>`."
  },
  {
    id: "cfg-prac-4",
    module: "config",
    category: "code",
    question: "Quieres que `quarkus.log.level` sea `DEBUG` solo en modo desarrollo y `WARN` en producción usando `application.properties`. ¿Cómo lo escribes?",
    code: `# Solo en dev: DEBUG
# Por defecto (prod): WARN`,
    options: [
      "%dev.quarkus.log.level=DEBUG\nquarkus.log.level=WARN",
      "dev.quarkus.log.level=DEBUG\nprod.quarkus.log.level=WARN",
      "[dev]\nquarkus.log.level=DEBUG",
      "quarkus.log.level@dev=DEBUG"
    ],
    correct: 0,
    explanation: "Los perfiles en Quarkus se anteponen con `%nombre_perfil.` (`%dev.`, `%test.`, `%prod.`). Sin prefijo aplica a todos salvo que el perfil activo lo sobrescriba.",
    kidTip: "Prefijo de perfil en `application.properties`: `%dev.`, `%test.`, `%prod.`."
  },

  // --- JWT RBAC (4) ---
  {
    id: "jwt-prac-1",
    module: "jwt",
    category: "code",
    question: "Tienes un recurso REST anotado con `@ApplicationScoped` y quieres inyectar `JsonWebToken jwt` para leer el usuario en cada petición. ¿Qué trampa ocurre si inyectas `JsonWebToken` directo en un bean `@ApplicationScoped`?",
    code: `@Path("/secure")
@ApplicationScoped
public class SecureResource {
    @Inject
    JsonWebToken jwt; // ¿Funciona o qué debes usar?
}`,
    options: [
      "En @ApplicationScoped (singleton) se recomienda @RequestScoped en el recurso o inyectar Instance<JsonWebToken> / SecurityIdentity para no reutilizar un contexto incorrecto",
      "JsonWebToken no se puede inyectar con @Inject, solo con @Context",
      "Solo funciona en @Singleton",
      "Hay que usar @ConfigProperty para leer el JWT"
    ],
    correct: 0,
    explanation: "`JsonWebToken` es `@RequestScoped`. Quarkus recomienda anotar los recursos REST que inyectan `JsonWebToken` o `@Claim` con `@RequestScoped` (o inyectar `SecurityIdentity` / `Instance<JsonWebToken>`).",
    kidTip: "Cuando inyectes `JsonWebToken` o `@Claim`, pon `@RequestScoped` en tu clase Resource."
  },
  {
    id: "jwt-prac-2",
    module: "jwt",
    category: "code",
    question: "Quieres que solo usuarios con rol `\"admin\"` o `\"auditor\"` puedan llamar al método `deleteAll()`, mientras que `healthInfo()` sea público para cualquiera sin token. ¿Qué anotaciones usas?",
    code: `public class AdminResource {
    /* 1. Solo admin o auditor */
    @DELETE public void deleteAll() { ... }

    /* 2. Público sin token */
    @GET @Path("/info") public String healthInfo() { return "ok"; }
}`,
    options: [
      "1) @RolesAllowed({\"admin\", \"auditor\"})   2) @PermitAll",
      "1) @Secured({\"admin\", \"auditor\"})   2) @Public",
      "1) @Roles({\"admin\", \"auditor\"})   2) @AllowAnonymous",
      "1) @Authenticated   2) @DenyAll"
    ],
    correct: 0,
    explanation: "Jakarta/MicroProfile Security usa `@RolesAllowed({\"admin\", \"auditor\"})` para exigir alguno de esos roles (del claim `groups` en JWT), `@PermitAll` para acceso público, `@Authenticated` para cualquier usuario autenticado y `@DenyAll` para bloquear a todos.",
    kidTip: "`@RolesAllowed` = roles específicos | `@Authenticated` = cualquier token válido | `@PermitAll` = público | `@DenyAll` = nadie."
  },
  {
    id: "jwt-prac-3",
    module: "jwt",
    category: "code",
    question: "¿Qué dos propiedades mínimas debes poner en `application.properties` para que Quarkus valide la firma y el emisor (`iss`) de los tokens JWT entrantes?",
    code: `# Ubicación de la clave pública PEM y el issuer esperado`,
    options: [
      "mp.jwt.verify.publickey.location=publicKey.pem\nmp.jwt.verify.issuer=https://example.com/issuer",
      "quarkus.jwt.public-key=publicKey.pem\nquarkus.jwt.issuer=https://example.com/issuer",
      "mp.jwt.secret=publicKey.pem\nmp.jwt.aud=https://example.com/issuer",
      "smallrye.jwt.verify.key=publicKey.pem"
    ],
    correct: 0,
    explanation: "Las propiedades estándar de MicroProfile JWT en Quarkus son `mp.jwt.verify.publickey.location` y `mp.jwt.verify.issuer`.",
    kidTip: "Siempre son `mp.jwt.verify.publickey.location` y `mp.jwt.verify.issuer`."
  },
  {
    id: "jwt-prac-4",
    module: "jwt",
    category: "code",
    question: "Para un test o endpoint generador de tokens usando `quarkus-smallrye-jwt-build`, ¿cómo generas y firmas un JWT con `upn` y rol `\"admin\"`?",
    code: `String token = /* TODO: generar JWT firmado */;`,
    options: [
      "Jwt.issuer(\"https://example.com/issuer\").upn(\"carlos@datum.com\").groups(Set.of(\"admin\")).sign()",
      "JsonWebToken.create().issuer(\"...\").role(\"admin\").build()",
      "JwtBuilder.withUser(\"carlos\").sign()",
      "TokenGenerator.generate(\"admin\")"
    ],
    correct: 0,
    explanation: "`io.smallrye.jwt.build.Jwt` permite construir y firmar tokens con la clave privada configurada en `smallrye.jwt.sign.key.location`: `Jwt.issuer(...).upn(...).groups(...).sign()`.",
    kidTip: "Para crear JWTs en tests o servicios: `Jwt.issuer(...).upn(...).groups(Set.of(\"...\")).sign()`."
  },

  // --- REACTIVE MESSAGING (4) ---
  {
    id: "msg-prac-1",
    module: "messaging",
    category: "code",
    question: "Quieres enviar un mensaje al canal `\"orders-out\"` de forma imperativa desde un método `@POST` REST (no desde un `@Outgoing` automático). ¿Qué inyectas y cómo envías?",
    code: `@Path("/orders")
public class OrderResource {
    /* TODO: inyectar Emitter para canal "orders-out" */

    @POST
    public void send(Order order) {
        // TODO: enviar order
    }
}`,
    options: [
      "@Inject @Channel(\"orders-out\") Emitter<Order> emitter; y luego emitter.send(order);",
      "@Inject @Outgoing(\"orders-out\") Producer<Order> producer; y producer.publish(order);",
      "@Inject @Topic(\"orders-out\") KafkaTemplate<Order> kafka;",
      "@Inject Emitter<Order> emitter; sin especificar canal"
    ],
    correct: 0,
    explanation: "`@Channel(\"nombre-canal\") Emitter<T>` permite emitir mensajes imperativamente desde cualquier bean CDI llamando a `emitter.send(payload)`.",
    kidTip: "Para publicar desde un endpoint REST hacia Kafka/canal: `@Inject @Channel(\"canal\") Emitter<T>`."
  },
  {
    id: "msg-prac-2",
    module: "messaging",
    category: "code",
    question: "Tienes un consumidor `@Incoming(\"orders-in\")` que guarda la entidad en base de datos usando Panache (`@Transactional`). ¿Qué anotación debes añadir para no bloquear el event loop de Vert.x?",
    code: `@Incoming("orders-in")
@Transactional
/* TODO: evitar bloqueo en el event loop */
public void consume(Order order) {
    order.persist();
}`,
    options: [
      "@Blocking",
      "@Async",
      "@NonBlocking",
      "@Worker"
    ],
    correct: 0,
    explanation: "Los consumidores `@Incoming` se ejecutan en el event loop por defecto. Si ejecutan código bloqueante (JPA/Panache clásico), debes anotarlos con `@Blocking` (`io.smallrye.common.annotation.Blocking`).",
    kidTip: "`@Incoming` + JPA/Panache = pon `@Blocking`."
  },
  {
    id: "msg-prac-3",
    module: "messaging",
    category: "code",
    question: "Tienes un método `@Incoming(\"prices-in\") @Outgoing(\"prices-out\")` que lee del topic Kafka `prices` y publica en `converted-prices`. ¿Cómo se configuran el conector y el topic de entrada en `application.properties`?",
    code: `# Configurar canal entrante "prices-in" con Kafka y topic "prices"`,
    options: [
      "mp.messaging.incoming.prices-in.connector=smallrye-kafka\nmp.messaging.incoming.prices-in.topic=prices",
      "quarkus.kafka.incoming.prices-in.topic=prices",
      "mp.messaging.channel.prices-in.kafka-topic=prices",
      "smallrye.messaging.in.prices-in.topic=prices"
    ],
    correct: 0,
    explanation: "El patrón de configuración es `mp.messaging.<incoming|outgoing>.<nombre-canal>.connector=smallrye-kafka` y `.topic=<nombre-topic>`.",
    kidTip: "Estructura fija: `mp.messaging.incoming.<canal>.connector=smallrye-kafka` y `.topic=...`."
  },
  {
    id: "msg-prac-4",
    module: "messaging",
    category: "code",
    question: "Si tu consumidor `@Incoming(\"events\")` recibe `Message<String>` en lugar de `String` directamente, ¿qué responsabilidad tienes al terminar de procesarlo?",
    code: `@Incoming("events")
public CompletionStage<Void> onEvent(Message<String> msg) {
    String payload = msg.getPayload();
    // procesar...
    return /* TODO: confirmar mensaje */;
}`,
    options: [
      "msg.ack() (o msg.nack(throwable) si falló)",
      "msg.commit()",
      "No hay que hacer nada, se confirma solo",
      "msg.close()"
    ],
    correct: 0,
    explanation: "Al recibir `Message<T>`, tomas el control manual del acknowledgement: debes devolver `msg.ack()` en éxito o `msg.nack(ex)` en error.",
    kidTip: "Si recibes `T`, el ack es automático; si recibes `Message<T>`, debes retornar `msg.ack()`."
  },

  // --- OPENTELEMETRY (4) ---
  {
    id: "otel-prac-1",
    module: "otel",
    category: "code",
    question: "Quieres crear un span personalizado automáticamente cuando se invoca un método de negocio y capturar su parámetro `orderId` como atributo del span. ¿Qué anotaciones de OpenTelemetry usas?",
    code: `/* TODO: crear span "process-order" */
public void processOrder(/* TODO: atributo "order.id" */ String orderId) {
    ...
}`,
    options: [
      "@WithSpan(\"process-order\") y @SpanAttribute(\"order.id\")",
      "@Traced(\"process-order\") y @Tag(\"order.id\")",
      "@NewSpan(\"process-order\") y @SpanParam(\"order.id\")",
      "@Span(\"process-order\") y @Attribute(\"order.id\")"
    ],
    correct: 0,
    explanation: "En `io.opentelemetry.instrumentation.annotations`: `@WithSpan(\"nombre\")` crea un nuevo span hijo alrededor del método y `@SpanAttribute(\"clave\")` registra el valor del parámetro como atributo.",
    kidTip: "`@WithSpan` en el método + `@SpanAttribute` en el parámetro."
  },
  {
    id: "otel-prac-2",
    module: "otel",
    category: "code",
    question: "Dentro de un método ya trazado (por ejemplo un endpoint REST), quieres añadir un atributo `\"customer.tier\" = \"VIP\"` al span activo actual sin crear otro span. ¿Cómo lo haces?",
    code: `public void handle() {
    // TODO: agregar atributo al span actual
}`,
    options: [
      "Span.current().setAttribute(\"customer.tier\", \"VIP\");",
      "Tracer.getActiveSpan().addTag(\"customer.tier\", \"VIP\");",
      "OpenTelemetry.currentSpan().put(\"customer.tier\", \"VIP\");",
      "TraceContext.set(\"customer.tier\", \"VIP\");"
    ],
    correct: 0,
    explanation: "`io.opentelemetry.api.trace.Span.current()` obtiene el span activo en el contexto actual y `.setAttribute(key, value)` (o `.addEvent(...)`) lo enriquece.",
    kidTip: "`Span.current().setAttribute(\"clave\", valor)` y `Span.current().addEvent(\"evento\")`."
  },
  {
    id: "otel-prac-3",
    module: "otel",
    category: "code",
    question: "¿Qué propiedades configuran el nombre del servicio en las trazas y el endpoint OTLP hacia Jaeger/Collector en `application.properties`?",
    code: `# Nombre del servicio y destino OTLP gRPC`,
    options: [
      "quarkus.application.name=orders-service\nquarkus.otel.exporter.otlp.endpoint=http://localhost:4317",
      "quarkus.jaeger.service-name=orders-service\nquarkus.jaeger.endpoint=http://localhost:14268",
      "otel.service=orders-service\notel.url=http://localhost:4317",
      "mp.otel.name=orders-service"
    ],
    correct: 0,
    explanation: "Con `quarkus-opentelemetry`, el nombre del servicio viene de `quarkus.application.name` (o `quarkus.otel.service.name`) y el exportador OTLP se apunta con `quarkus.otel.exporter.otlp.endpoint=http://localhost:4317`.",
    kidTip: "En Quarkus 3 / EX378 es `quarkus-opentelemetry` con `quarkus.otel.exporter.otlp.endpoint` (ya NO Jaeger legado)."
  },
  {
    id: "otel-prac-4",
    module: "otel",
    category: "code",
    question: "Si tu Microservicio A llama al Microservicio B mediante REST Client Reactive y ambos tienen `quarkus-opentelemetry`, ¿necesitas copiar manualmente el `traceparent` header?",
    code: `// Servicio A -> REST Client Reactive -> Servicio B`,
    options: [
      "No; quarkus-opentelemetry propaga e instrumenta automáticamente las cabeceras W3C Trace Context en HTTP, REST Client y Kafka",
      "Sí, obligatorio añadir @ClientHeaderParam(\"traceparent\")",
      "Solo funciona si usas @WithSpan en el REST Client",
      "Sí, hay que configurar quarkus.rest-client.propagate-headers=traceparent"
    ],
    correct: 0,
    explanation: "`quarkus-opentelemetry` instrumenta automáticamente servidor HTTP, REST Client Reactive y Reactive Messaging (Kafka), inyectando y extrayendo `traceparent` sin código extra.",
    kidTip: "La propagación de trazas entre REST Client y Kafka es automática con `quarkus-opentelemetry`."
  },

  // --- MICROPROFILE OPENAPI (4) ---
  {
    id: "oapi-prac-1",
    module: "openapi",
    category: "code",
    question: "Quieres documentar en Swagger/OpenAPI que un endpoint `@POST` puede devolver `201` (creado) o `400` (datos inválidos). ¿Qué anotación de MicroProfile OpenAPI usas?",
    code: `@POST
/* TODO: documentar resumen y posibles códigos 201 y 400 */
public Response create(Book b) { ... }`,
    options: [
      "@Operation(summary = \"Crear libro\")\n@APIResponse(responseCode = \"201\", description = \"Creado\")\n@APIResponse(responseCode = \"400\", description = \"Inválido\")",
      "@ApiOperation(\"Crear libro\")\n@ApiResponses({@ApiResponse(code = 201), @ApiResponse(code = 400)})",
      "@OpenApiDoc(summary = \"Crear libro\", codes = {201, 400})",
      "@SwaggerResponse(201)"
    ],
    correct: 0,
    explanation: "MicroProfile OpenAPI usa `@Operation` y `@APIResponse(responseCode = \"...\", description = \"...\")` (los códigos son String entre comillas; `@ApiOperation` es de Swagger v2 legado).",
    kidTip: "En MicroProfile OpenAPI: `@Operation` + `@APIResponse(responseCode = \"201\", ...)` (código como String!)."
  },
  {
    id: "oapi-prac-2",
    module: "openapi",
    category: "code",
    question: "En tu DTO `BookDto`, quieres documentar el campo `isbn` con descripción, ejemplo y marcarlo como obligatorio en el esquema OpenAPI. ¿Qué anotación usas?",
    code: `public class BookDto {
    /* TODO: documentar campo en esquema OpenAPI */
    public String isbn;
}`,
    options: [
      "@Schema(description = \"Código ISBN\", example = \"978-3-16-148410-0\", required = true)",
      "@Parameter(description = \"Código ISBN\", required = true)",
      "@ApiModelProperty(value = \"Código ISBN\", required = true)",
      "@OpenApiField(example = \"978-3-16-148410-0\")"
    ],
    correct: 0,
    explanation: "`@Schema` documenta clases y propiedades de modelos/DTOs en OpenAPI; `@Parameter` se usa sobre parámetros de métodos REST (`@PathParam`, `@QueryParam`).",
    kidTip: "DTOs/campos = `@Schema`. Parámetros de endpoint (`@PathParam`/`@QueryParam`) = `@Parameter`."
  },
  {
    id: "oapi-prac-3",
    module: "openapi",
    category: "code",
    question: "En modo dev (`/q/swagger-ui`) Swagger UI funciona, pero al compilar para producción desaparece. ¿Qué propiedad en `application.properties` lo habilita también en producción?",
    code: `# Incluir Swagger UI en build de producción`,
    options: [
      "quarkus.swagger-ui.always-include=true",
      "quarkus.openapi.swagger-ui.prod=true",
      "%prod.quarkus.swagger-ui.enabled=true",
      "mp.openapi.swagger.always=true"
    ],
    correct: 0,
    explanation: "Por defecto Swagger UI solo se incluye en dev/test. Para exponer `/q/swagger-ui` en producción se configura `quarkus.swagger-ui.always-include=true`.",
    kidTip: "`quarkus.swagger-ui.always-include=true` habilita `/q/swagger-ui` en producción; `/q/openapi` siempre está activo."
  },
  {
    id: "oapi-prac-4",
    module: "openapi",
    category: "code",
    question: "¿Qué anotaciones usas para definir el título/versión global de la API y agrupar los endpoints de un recurso bajo una categoría visual en Swagger UI?",
    code: `/* 1. Título y versión en una clase Application */
/* 2. Agrupar endpoints en BookResource */`,
    options: [
      "1) @OpenAPIDefinition(info = @Info(title = \"...\", version = \"1.0\"))   2) @Tag(name = \"Books\")",
      "1) @SwaggerDefinition(...)   2) @ApiGroup(\"Books\")",
      "1) @ApiInfo(title = \"...\")   2) @Category(\"Books\")",
      "1) @OpenApiConfig   2) @OperationGroup(\"Books\")"
    ],
    correct: 0,
    explanation: "`@OpenAPIDefinition(info = @Info(title = \"...\", version = \"...\"))` define los metadatos globales de la API y `@Tag(name = \"...\")` agrupa los endpoints en la UI.",
    kidTip: "Global = `@OpenAPIDefinition(info = @Info(...))`. Agrupar endpoints = `@Tag(name = \"...\")`."
  }
);

