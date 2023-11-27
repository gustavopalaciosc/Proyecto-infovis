const WIDTH = 2000;
const HEIGHT = 2000;


const SVG = d3
  .select("body")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

  let tamano_nodo = d3.scaleLinear()
  .domain([1, 25])
  .range([8, 40]);

const iniciarSimulacion = (nodos, enlaces) => {
  const FuerzaEnlace = d3.forceLink(enlaces)
    .id((d) => d.artista) // Llave para conectar source-target con el nodo
    .strength(link => {
      // Definir la fuerza del enlace de forma personalizada
      return 2
    })

  const simulacion = d3
    .forceSimulation(nodos)
    .force("enlaces", FuerzaEnlace)
    .force("centro", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
    .force("colision", d3.forceCollide(35)) // Tiene más poder que los demás
    .force("carga", d3.forceManyBody().strength(2))

  
  const lineas = SVG
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(enlaces)
    .join("line")
    .attr("stroke-width", 2);

  // Cada uno de los nodos correspondiente a un circulo
  const circulos = SVG
    .append("g")
    .attr("stroke", "#1DB954")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodos)
    .join("circle")
    .attr("r", nodos => tamano_nodo(nodos.n_colaboraciones))
    .attr("fill", "#1DB954");

   const titulos = SVG.append("g")
   .style("font", "10px sans-serif")
   .attr("stroke", "white")
   .selectAll("text")
   .data(nodos)
   .join("text")
   .text((nodos) => nodos.artista)
    .attr("text-anchor", "middle")
    .attr("fill", "black");

    circulos.append("title")
    .text(nodos => nodos.artista);

    const manejadorZoom = (evento) => {
        const transformacion = evento.transform;
        // Solo agregando esta línea, se aplica una traslación y zoom.
        circulos.attr("transform", transformacion);
        titulos.attr("transform", transformacion);
        lineas.attr("transform", transformacion);
      };

      const zoom = d3.zoom()
        .scaleExtent([0.5, 2])
        .extent([[0, 0], [WIDTH, HEIGHT]])
        .translateExtent([[0, 0], [WIDTH, HEIGHT]])
        .on("start", () => console.log("empecé"))
        .on("zoom", manejadorZoom)
        .on("end", () => console.log("terminé"));

    SVG.call(zoom);




  simulacion.on("tick", () => {
    // console.log({ ...nodos[0] });
    // console.log({ ...enlaces[0] });
    // console.log(simulacion.alpha(), simulacion.alpha() < simulacion.alphaMin());

    circulos
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
    
    titulos
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y);
    
    

  
    lineas
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
  });

  

  // Hacer click en un nodo hará que este deje de actualizar
  // su posición.
  

};

d3.json("colabs_2.json")
  .then((datos) => {
    const nodos = datos.nodos;
    const enlaces = datos.enlaces;
    iniciarSimulacion(nodos, enlaces);
  })
  .catch((error) => {
    console.log("Failed retriving data")
    console.log(error);
  });
