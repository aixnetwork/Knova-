import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Course } from '../types';

interface KnowledgeGraphProps {
  courses: Course[];
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  radius: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ courses }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || courses.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Transform courses into graph data
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Central Hub
    nodes.push({ id: "My Knowledge", group: 0, radius: 30 });

    courses.forEach((course, i) => {
      // Course Nodes
      nodes.push({ id: course.topic, group: 1, radius: 20 });
      links.push({ source: "My Knowledge", target: course.topic, value: 2 });

      // Module/Concept Nodes
      course.modules.forEach((mod) => {
        // Only add a few key concepts to avoid clutter
        const concept = mod.keyConcepts[0]; 
        if(concept) {
            const nodeId = `${course.topic}-${concept}`;
            nodes.push({ id: concept, group: 2, radius: 10 });
            links.push({ source: course.topic, target: concept, value: 1 });
        }
      });
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(80))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + 5));

    const link = svg.append("g")
      .attr("stroke", "#94a3b8")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    const node = svg.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
          if (d.group === 0) return "#4f46e5"; // Indigo 600
          if (d.group === 1) return "#0ea5e9"; // Sky 500
          return "#10b981"; // Emerald 500
      })
      .call(drag(simulation) as any);

    const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text((d) => d.id)
        .attr("font-size", "10px")
        .attr("fill", "#334155")
        .style("pointer-events", "none");

    node.append("title").text((d) => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
      
      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: d3.Simulation<Node, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    return () => {
        simulation.stop();
    };
  }, [courses]);

  return (
    <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-slate-500 border border-slate-100">
        Concept Map
      </div>
      <svg ref={svgRef} className="w-full h-full" style={{ minHeight: '400px' }}></svg>
    </div>
  );
};