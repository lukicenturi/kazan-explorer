class Line {
    constructor(id, nodeA, partA, nodeB, partB, reversed) {
        this.object = $(`
            <g class='line'>
                <line id="line-${id}" data-id="${id}"></line>
            </g> 
        `);

        let params = {id, nodeA, partA, nodeB, partB, reversed};
        Object.assign(this, params);

        this.selector = `#line-${id}`;
        this.len = 0;
        this.check = true;

        svg.append(this.object).html(svg.html());
    }

    update(activeLine) {
        let x1 = this.nodeA.x + pos[0][this.partA] * r;
        let y1 = this.nodeA.y + pos[1][this.partA] * r;
        let x2 = this.nodeB.x + pos[0][this.partB] * r;
        let y2 = this.nodeB.y + pos[1][this.partB] * r;

        $(this.selector)[0].setAttribute('x1', x1);
        $(this.selector)[0].setAttribute('y1', y1);
        $(this.selector)[0].setAttribute('x2', x2);
        $(this.selector)[0].setAttribute('y2', y2);

        if(this.check) {
            let target = Math.hypot(x1 - x2, y1 - y2);
            if(this.len < target) {
                this.len += 20;
                $(this.selector)[0].setAttributeNS(null, 'stroke-dasharray', this.len + " " + target);
                if(this.reversed) $(this.selector)[0].setAttributeNS(null, 'stroke-dashoffset', this.len - target);
            } else {
                $(this.selector)[0].setAttributeNS(null, 'stroke-dasharray', 'none');
                $(this.selector)[0].setAttributeNS(null, 'stroke-dashoffset', 0);
                this.check = false;
            }
        }

        $(this.selector)[activeLine === this.id ? 'addClass' : 'removeClass']('active');
    }
}