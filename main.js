const SVG1 = d3.select('#vis-1')
const SVG2 = d3.select('#vis-2')
const Artistas = 'https://raw.githubusercontent.com/gustavopalaciosc/Proyecto-infovis/main/artist_data.json';

const WIDTH_VIS_1 = 650;
const HEIGHT_VIS_1 = 680;
const MARGIN_TOP = 30;

const WIDTH_VIS_2 = 650;
const HEIGHT_VIS_2 = 680;

// https://d3-graph-gallery.com/graph/interactivity_tooltip.html
const tooltip = d3.select('body').append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background-color', 'rgba(0, 0, 0, 0.7)')
    .style('color', '#fff')
    .style('padding', '8px')
    .style('border-radius', '4px')
    .style('font-size', '12px');
    
const rangeInput = d3.select('#nodeFilter');
const updateButton = d3.select('#updateButton');
const titleVis1 = d3.select('#titleVis1');
const titleVis2 = d3.select('#titleVis2');
const instructions = d3.select('#instructions');


let filterValue = +rangeInput.property('value'); 

function updateFilterValue() {
    filterValue = +rangeInput.property('value'); 
    updateButton.text(`Filter: ${filterValue}`);
}

function handleButtonClick() {
    SVG1.selectAll('*').remove();
    render_vis_1(filterValue);
}

function calculateFontSize(word, targetLength) {
    const wordLength = word.length;
    const fontSize = Math.floor(targetLength / wordLength);
  
    return fontSize;
}

// Chat GPT
function formatNumberWithPoints(number) {
    const formattedNumber = number.toLocaleString('en-US');
    return formattedNumber.replace(/,/g, '.');
  }

rangeInput.on('input', updateFilterValue);
updateButton.on('click', handleButtonClick);

updateFilterValue();
render_vis_1(filterValue);

function render_vis_1(filterValue){
    // Basado en https://observablehq.com/@d3/zoomable-circle-packing?collection=@d3/d3-hierarchy y cambaido para funcionar con d3 v7
    d3.json(Artistas).then(artist_data => {
        const color = d3.scaleLinear()
            .domain([0, 5])
            .range(['hsl(125,81%,74%)', 'hsl(125,81%,51%)'])
            .interpolate(d3.interpolateHcl);
    
        const pack = artist_data => d3.pack()
            .size([WIDTH_VIS_1, HEIGHT_VIS_1])
            .padding(3)
            (d3.hierarchy(artist_data)
                .sum(d => d.streams)
                .sort((a, b) => b.streams - a.streams));
        
        artist_data.children = artist_data.children.slice(0, +filterValue)
                
        const root = pack(artist_data);
    
        const svg_1 = d3.create('svg')
            .attr('viewBox', `-${WIDTH_VIS_1 / 2} -${HEIGHT_VIS_1 / 2} ${WIDTH_VIS_1} ${HEIGHT_VIS_1 + MARGIN_TOP}`)
            .attr('width', WIDTH_VIS_1)
            .attr('height', HEIGHT_VIS_1)
            .attr('style', 'max-width: 100%; height: auto; display: block; margin: 0 -14px; background: hsl(0, 0%, 6%); cursor: pointer;');
    
        const node = svg_1.append('g')
            .selectAll('circle')
            .data(root.descendants().slice(1))
            .join('circle')
            .attr('fill', d => d.children ? color(d.depth) : 'white')
            .attr('pointer-events', d => !d.children ? 'none' : null)
            .on('mouseover', (event, d) => {
                tooltip.style('visibility', 'visible')
                    .html(`<p>${d.data.name}</p> <p>Streams: ${formatNumberWithPoints(d.data.streams)}</p>`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
            })
            .on('mouseout',  () => {
                tooltip.style('visibility', 'hidden')
            })
            .on('click', (event, d) => !d.children ? (render_vis_2(d.data), titleVis2.text(`Caracteristicas de: ${d.data.name}`), instructions.text('')) : (focus !== d && (zoom(event, d), event.stopPropagation())));
    
        const label = svg_1.append('g')
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .selectAll('text')
            .data(root.descendants())
            .join('text')
            .style('fill-opacity', d => d.parent === root ? 1 : 0)
            .style('display', d => d.parent === root ? 'inline' : 'none')
            .text(d => d.data.name)
    
        svg_1.on('click', (event) => zoom(event, root));

        let focus = root;
        let view;

        zoomTo([focus.x, focus.y, focus.r * 2]);
     
        function zoomTo(v) {
            const k = WIDTH_VIS_1 / v[2];
            view = v;
     
            label.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr('r', d => d.r * k);
    
            if (focus.data.name !== 'artists'){
                titleVis1.text(`${focus.data.name}`);
                node.attr('pointer-events', 'null');
                setTimeout(() => {label.style('font-size', d => {`${calculateFontSize(focus.data.name, d.r * k)}px`})}, 400);
            }
            else{
                titleVis1.text('');
                node.attr('pointer-events', d => !d.children ? 'none' : null);
                label.style('font-size', d => {
                    return !d.children ? '$1px' : `${calculateFontSize(focus.data.name, d.r * k * 2)}px`;
                });
            }
        };
     
        function zoom(event, d) {
            focus = d;
            const transition = svg_1.transition()
                .duration(event.altKey ? 750 : 750)
                .tween('zoom', d => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => zoomTo(i(t));
                });
     
            label
                .filter(function(d) {return d.parent === focus || this.style.display === 'inline'})
                .transition(transition)
                .style('fill-opacity', d => d.parent === focus ? 1 : 0)
                .on('start', function(d) {if (d.parent === focus) this.style.display = 'inline'})
                .on('end', function(d) {if (d.parent !== focus) this.style.display = 'none'});
     
        };
    
        SVG1.node().appendChild(svg_1.node());
    });
}

function render_vis_2(song){
    SVG2.select('*').remove()

    data = [song.indices[0]]
    let features = ['danceability', 'valence', 'energy', 'acousticness', 'liveness', 'speechiness'];

    let radialScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, 250]);
    let ticks = [20, 40, 60, 80, 100];

    let svg_2 = SVG2.append('svg')
        .attr('width', WIDTH_VIS_2)
        .attr('height', HEIGHT_VIS_2);

    svg_2.selectAll('circle')
        .data(ticks)
        .join(
            enter => enter.append('circle')
                .attr('cx', WIDTH_VIS_2 / 2)
                .attr('cy', HEIGHT_VIS_2 / 2)
                .attr('fill', 'none')
                .attr('stroke', 'gray')
                .attr('r', d => radialScale(d))
    );

    svg_2.selectAll('.ticklabel')
        .data(ticks)
        .join(
            enter => enter.append('text')
                .attr('class', 'ticklabel')
                .attr('x', WIDTH_VIS_2 / 2 + 5)
                .attr('y', d => HEIGHT_VIS_2 / 2 - radialScale(d))
                .text(d => d.toString())
                .attr('fill','white')
                .style('font-size', '10px')
    );

    function angleToCoordinate(angle, value){
        let x = Math.cos(angle) * radialScale(value);
        let y = Math.sin(angle) * radialScale(value);
        return {'x': WIDTH_VIS_2 / 2 + x, 'y': HEIGHT_VIS_2 / 2 - y};
    };

    let featureData = features.map((f, i) => {
        let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
        return {
            'name': f,
            'angle': angle,
            'line_coord': angleToCoordinate(angle, 100),
            'label_coord': angleToCoordinate(angle, 120)
        };
    });

    svg_2.selectAll('line')
        .data(featureData)
        .join(
            enter => enter.append('line')
                .attr('x1', WIDTH_VIS_2 / 2)
                .attr('y1', HEIGHT_VIS_2 / 2)
                .attr('x2', d => d.line_coord.x)
                .attr('y2', d => d.line_coord.y)
                .style('stroke', 'white')
    );
    
    svg_2.selectAll('.axislabel')
        .data(featureData)
        .join(
            enter => enter.append('text')
                .attr('x', d => d.label_coord.x - 33)
                .attr('y', d => d.name === 'danceability' ? d.label_coord.y + 20 : d.label_coord.y)
                .text(d => d.name)
                .attr('fill','white')
                .style('font-size', '12px')
    );

    let line = d3.line()
        .x(d => d.x)
        .y(d => d.y);

    function getPathCoordinates(data_point){
        let coordinates = [];
        coordinates[0] = angleToCoordinate((Math.PI / 2), data_point[features[0]])
        coordinates[1] = angleToCoordinate((Math.PI / 2) + (2 * Math.PI * 1 / features.length), data_point[features[1]])
        coordinates[2] = angleToCoordinate((Math.PI / 2) + (2 * Math.PI * 2 / features.length), data_point[features[2]])
        coordinates[3] = angleToCoordinate((Math.PI / 2) + (2 * Math.PI * 3 / features.length), data_point[features[3]])
        coordinates[4] = angleToCoordinate((Math.PI / 2) + (2 * Math.PI * 4 / features.length), data_point[features[4]])
        coordinates[5] = angleToCoordinate((Math.PI / 2) + (2 * Math.PI * 5 / features.length), data_point[features[5]])
        return coordinates;
    }


    svg_2.selectAll('path')
        .data(data)
        .join(
            enter => enter.append('path')
                .datum(d => getPathCoordinates(d))
                .attr('d', line)
                .attr('stroke-width', 3)
                .attr('stroke', '#1db95')
                .attr('fill', '#1db954')
                .attr('stroke-opacity', 1)
                .attr('opacity', 0.5)
    );
}

