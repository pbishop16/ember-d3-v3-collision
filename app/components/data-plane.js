import Ember from 'ember';
import d3 from 'npm:d3';

export default Ember.Component.extend({
  classNameBindings: [ 'elementClass' ],

  color: null,
  charge: -1500,
  elementClass: 'data-plane',
  force: null,
  gravity: 0.05,
  height: 500,
  nodes: null,
  root: null,
  svg: null,
  width: 960,

  didInsertElement() {
    this._super(...arguments);

    this._setNodes();
    this._setRoot();
    this._setColor();
    this._setForce();
    this.get('force').start();
    this._setSvg();
    this._addBindDataAndElements();
    this._intializeForce();
    this._mouseTrigger();
  },

  _setNodes() {
    const nodes = d3.range(200).map(() => {
      return { radius: Math.random() * 12 + 4 };
    });

    this.set('nodes', nodes);
  },

  _setRoot() {
    const root = this.get('nodes')[0];
    root.radius = 0;
    root.fixed = true;

    this.set('root', root);
  },

  _setColor() {
    const color = d3.scale.category10();

    this.set('color', color);
  },

  _setForce() {
    const {
      charge,
      gravity,
      height,
      nodes,
      width,
    } = this.getProperties(
      'charge',
      'gravity',
      'height',
      'nodes',
      'width'
    );
    const force = d3.layout.force()
      .gravity(gravity)
      .charge((d,i) => { return i ? 0 : charge; })
      .nodes(nodes)
      .size([width, height]);

    this.set('force', force);
  },

  _setSvg() {
    const {
      elementClass,
      height,
      width,
    } = this.getProperties(
      'elementClass',
      'height',
      'width'
    );

    const element = `.${elementClass}`;

    const svg = d3.select(element).append('svg')
      .attr('width', width)
      .attr('height', height);

    this.set('svg', svg);
  },

  _addBindDataAndElements() {
    const {
      color,
      nodes,
      svg,
    } = this.getProperties(
      'color',
      'nodes',
      'svg'
    );

    svg.selectAll('circle')
      .data(nodes.slice(1))
      .enter().append('circle')
      .attr('r', (d) => { return d.radius; })
      .style('fill', (d,i) => color(i % 3));
  },

  _intializeForce() {
    const {
      force,
      nodes,
      svg,
    } = this.getProperties(
      'force',
      'nodes',
      'svg'
    );

    force.on('tick', () => {
      const q = d3.geom.quadtree(nodes),
        n = nodes.length;
      let i = 0;

      while (++i < n) { q.visit(this._collide(nodes[i])); }

      svg.selectAll('circle')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
    });
  },

  _mouseTrigger() {
    const {
      force,
      svg,
      root,
    } = this.getProperties(
      'force',
      'svg',
      'root'
    );

    svg.on('mousemove', function() {
      const p1 = d3.mouse(this);

      root.px = p1[0];
      root.py = p1[1];
      force.resume();
    });
  },

  _collide(node) {
    let r = node.radius + 16,
          nx1 = node.x - r,
          nx2 = node.x + r,
          ny1 = node.y - r,
          ny2 = node.y + r;

    return (quad, x1, y1, x2, y2) => {
      if (quad.point && (quad.point !== node)) {
        let x = node.x - quad.point.x,
              y = node.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = node.radius + quad.point.radius;

        if (l < r) {
          l = (l - r) / l * 0.5;
          node.x -= x *= l;
          node.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }

      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  },

});
