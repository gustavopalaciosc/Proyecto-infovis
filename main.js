const SVG1 = d3.select('#vis-1')
const Artistas = 'https://raw.githubusercontent.com/gustavopalaciosc/Proyecto-infovis/main/artist_data.json';

const WIDTH_VIS_1 = 650;
const HEIGHT_VIS_1 = 680;
const MARGIN_TOP = 30;


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

let filterValue = +rangeInput.property('value'); 

function updateFilterValue() {
    filterValue = +rangeInput.property('value'); 
    updateButton.text(`Filter: ${filterValue}`);
}

function handleButtonClick() {
      SVG1.selectAll('*').remove();
      render_vis_1(filterValue);
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
        
        console.log(+filterValue)
        artist_data.children = artist_data.children.slice(0, +filterValue)
                
        const root = pack(artist_data);
    
        const svg_1 = d3.create('svg')
            .attr('viewBox', `-${WIDTH_VIS_1 / 2} -${HEIGHT_VIS_1 / 2} ${WIDTH_VIS_1} ${HEIGHT_VIS_1 + MARGIN_TOP}`)
            .attr('width', WIDTH_VIS_1)
            .attr('height', HEIGHT_VIS_1)
            .attr('style', `max-width: 100%; height: auto; display: block; margin: 0 -14px; background: hsl(0, 0%, 6%); cursor: pointer;`);
    
        const node = svg_1.append('g')
            .selectAll('circle')
            .data(root.descendants().slice(1))
            .join('circle')
            .attr('fill', d => d.children ? color(d.depth) : 'white')
            .attr('pointer-events', d => !d.children ? 'none' : null)
            .on('mouseover', (event, d) => {
                tooltip.style('visibility', 'visible')
                    .html(d.data.name)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout',  () => {
                tooltip.style('visibility', 'hidden');
            })
            .on('click', (event, d) => !d.children ? console.log(d.data.name) : (focus !== d && (zoom(event, d), event.stopPropagation())));
    
        var zoomed = false;
    
        const label = svg_1.append('g')
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle')
            .selectAll('text')
            .data(root.descendants())
            .join('text')
            .style('fill-opacity', d => d.parent === root ? 1 : 0)
            .style('display', d => d.parent === root ? 'inline' : 'none')
            .text(d => d.data.name)
    
        const title = svg_1.append('text')
            .attr('text-anchor', 'middle')
            .style('font-size', '30px')
            .style('font-weight', 'bold')
            .style('fill', '#fff')
            .style('stroke', '#000')  
            .style('stroke-width', '1.5px') 
            .attr('dy', -HEIGHT_VIS_1 / 2 + MARGIN_TOP);
    
        svg_1.on('click', (event) => zoom(event, root));

        let focus = root;
        let view;

        zoomTo([focus.x, focus.y, focus.r * 2]);
     
        function zoomTo(v) {
            const k = WIDTH_VIS_1 / v[2];
            view = v;

            function calculateFontSize(word, targetLength) {
                const wordLength = word.length;
                const fontSize = Math.floor(targetLength / wordLength);
              
                return fontSize;
            }
     
            label.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr('r', d => d.r * k);
    
            if (focus.data.name !== 'artists'){
                title.text(focus.data.name);
                node.attr('pointer-events', 'null');
                zoomed = true;
                setTimeout(() => {label.style('font-size', d => {`${calculateFontSize(focus.data.name, d.r * k)}px`})}, 400);
            }
            else{
                title.text('');
                node.attr('pointer-events', d => !d.children ? 'none' : null);
                zoomed = false;
                label.style('font-size', d => {
                    return zoomed ? '$1px' : `${calculateFontSize(focus.data.name, d.r * k * 2)}px`;
                });
            }
        }
     
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
                .style('font-size', d => d.parent === focus ? '$0px': '$0px')
                .on('start', function(d) {if (d.parent === focus) this.style.display = 'inline'})
                .on('end', function(d) {if (d.parent !== focus) this.style.display = 'none'});
     
        }
    
        SVG1.node().appendChild(svg_1.node());
    });
}

