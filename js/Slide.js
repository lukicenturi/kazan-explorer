class Slide {
    constructor(id, x, y, content = '', relation = [null, null, null, null], captions = ['', '', '', '']) {
        this.object = $(`
            <g class="node animate" id="node-${id}" data-id="${id}">
                <g>
                    <rect x="-40" y="-40" width="80" height="80"></rect>
                    <path data-connect="0" data-part="0" d="M 0 0 L -40 -40 L 40 -40 Z"></path>
                    <text>1</text>
                    <path data-connect="0" data-part="1" d="M 0 0 L 40 -40 L 40 40 Z"></path>
                    <text>2</text>
                    <path data-connect="0" data-part="2" d="M 0 0 L 40 40 L -40 40 Z"></path>
                    <text>3</text>
                    <path data-connect="0" data-part="3" d="M 0 0 L -40 40 L -40 -40 Z"></path>
                    <text>4</text>
                </g>
            </g>
        `);

        let params = {id, x, y, content, relation, captions};
        Object.assign(this, params);
        this.selector = `#node-${id}`;

        svg.prepend(this.object).html(svg.html());

        setTimeout(() => {
            $(this.selector).removeClass('animate');
        }, 1);
    }

    update(activeNode, holdPath, rootNode) {
        $(this.selector)[activeNode === this.id || holdPath ? 'addClass' : 'removeClass']('active');
        $(this.selector)[rootNode === this.id ? 'addClass' : 'removeClass']('root');

        this.relation.forEach((rel, key) => {
            $(this.selector).find(`path[data-part=${key}]`).attr('data-connect', rel ? 1 : 0);
        })

        $(this.selector).attr({
            style: `transform: translate(${this.x}px, ${this.y}px)`
        });
    }
}