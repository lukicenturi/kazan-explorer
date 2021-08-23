class Main {
    constructor() {
        this.counter = 0;
        this.nodes = {};
        this.lines = {};

        this.tempNode = null;
        this.tempPath = null;
        this.tempLine = null;

        this.activeNode = null;
        this.activeLine = null;

        this.holdPath = false;
        this.holdNode = false;
        this.shiftKey = false;
        this.editorActive = false;
        this.mode = 'editor';

        this.offset = {
            x: 0,
            y: 0
        };

        this.rootNode = null;

        this.init();
    }

    init() {
        if(localStorage.getItem('backups')) {
            this.restore();
        } else {
            this.reset(0);
        }

        this.listener();
        this.update();
    }

    backup() {
        this.data = {
            rootNode: this.rootNode,
            nodes: this.nodes,
            lines: this.lines
        };

        localStorage.setItem('backups', JSON.stringify(this.data));
    }

    restore() {
        let {rootNode, nodes, lines} = JSON.parse(localStorage.getItem("backups"));

        this.rootNode = rootNode;

        for(let key in nodes) {
            let node = nodes[key];

            this.nodes[node.id] = new Slide(node.id, node.x, node.y, node.content, node.relation, node.captions);

            if(node.id > this.counter) {
                this.counter = node.id;
            }
        }
        
        for(let key in lines) {
            let line = lines[key];

            this.lines[line.id] = new Line(line.id, this.nodes[line.nodeA.id], line.partA, this.nodes[line.nodeB.id], line.partB, line.reversed);
        }

        this.addHelper();
    }

    reset(msg = 1) {
        if(msg && !confirm("Are you sure to reset the editor?")) return;

        this.counter = 0;

        this.tempNode = null;
        this.tempPath = null;
        this.tempLine = null;

        this.activeNode = null;
        this.activeLine = null;

        this.holdNode = false;
        this.holdPath = false;
        this.shiftKey = false;
        this.editorActive = false;
        this.mode = 'editor';

        this.offset = {
            x: 0,
            y: 0
        };

        for(let key in this.nodes) {
            delete(this.nodes[key]);
        }

        for(let key in this.lines) {
            delete(this.lines[key]);
        }

        svg.empty();
        this.addHelper();
        this.nodes[++this.counter] = new Slide(this.counter, w / 2, h / 2);
        this.rootNode = this.counter;
        this.backup();
    }

    listener() {
        svg.on('mousedown', e => this.start(e))
            .on('mousemove', e => this.drag(e))
            .on('mouseup mouseleave', e => this.end(e));

        $(window).on('keydown', (e) => {
            let a = e.keyCode;
            if(a === 16) {
                this.shiftKey = true;
            }
        }).on('keyup', (e) => {
            let a = e.keyCode;
            if(a === 16) {
                this.shiftKey = false;
            } else if(a === 46 || a === 8) {
                this.deleteClick();
            } else if(a === 82) {
                this.setRootNode();
            } else if(this.mode === 'view' && a > 48 && a < 53) {
                this.move(a - 49);
            }
        })

        $("#edit").on('click', () => {
            this.edit();
        });

        $("#delete").on("click", () => {
            this.deleteNode();
        });

        $("#reset").on('click', () => {
            this.reset();
        });

        $("#mode").on('click', () => {
            $("#mode").html(`Go To ${this.mode} Mode`);
            if(this.mode === 'view') {
                this.mode = 'editor';
            } else {
                this.show();
                this.mode = 'view';
            }

            body.attr('data-mode', this.mode);
        });

        captions.on('input', () => {
            this.save();
        });

        buttons.on('click', (e) => {
            this.move($(e.target).data('part'));
        });

        rich.froalaEditor({
            height: 500
        }).on('froalaEditor.contentChanged', () => {
            this.save();
        })

        $("#editor #close").on('click', () => {
            this.editorActive = false;
            editor.removeClass('active');
        });
    }

    setRootNode() {
        if (this.editorActive || this.mode === 'view' || !this.activeNode) return;

        this.rootNode = this.activeNode;
        this.backup();
    }

    addHelper() {
        svg.append(`
          <g class="node active" id="helper" data-part="-1"">
                    <path d="M 0 0 L -40 -40 L 40 -40 Z"></path>
                    <text>1</text>
                    <path d="M 0 0 L 40 -40 L 40 40 Z"></path>
                    <text>2</text>
                    <path d="M 0 0 L 40 40 L -40 40 Z"></path>
                    <text>3</text>
                    <path d="M 0 0 L -40 40 L -40 -40 Z"></path>
                    <text>4</text>
                </g>
            </g>
        `).html(svg.html());
    }

    getPathInfo(e) {
        let elem = $(e.target);
        let node = elem.closest('.node').data('id');
        let path = elem.data('part');

        return [node, path];
    }

    getMousePosition(e) {
        return {
            x: e.pageX,
            y: e.pageY
        }
    }

    setHelper(part, x, y) {
        x += pos[0][part] * -20;
        y += pos[1][part] * -20;

        $("#helper").attr({
            'data-part': part,
            'style': `transform: translate(${x}px, ${y}px)`
        });
    }

    setNode(id) {
        this.activeNode = id;

        body[this.activeNode ? 'addClass' : 'removeClass']('active');

        if(this.activeNode) {
            let node = this.nodes[this.activeNode];

            $("#edit").css({
                top: node.y + 40,
                left: node.x - 20
            });

            $("#delete").css({
                top: node.y + 40,
                left: node.x + 20
            });
        }
    }

    deleteLine(id) {
        let line = this.lines[id];
        this.nodes[line.nodeA.id].relation[line.partA] = null;
        this.nodes[line.nodeB.id].relation[line.partB] = null;

        $(line.selector).closest('.line').remove();
        delete(this.lines[id]);
    }

    deleteClick() {
        if (Object.keys(this.nodes).length < 2 || this.editorActive || this.mode === 'view' || !this.activeLine || !confirm('Are you sure to delete the component?')) return;

        this.deleteLine(this.activeLine);
        this.activeLine = null;
    }

    deleteNode() {
        if (Object.keys(this.nodes).length < 2 || this.editorActive || this.mode === 'view' || !this.activeNode || !confirm('Are you sure to delete the component?')) return;

            let node = this.nodes[this.activeNode];
            let relation = node.relation;

            relation.forEach((rel, key) => {
                if(rel) {
                    let [nodeA, partA, nodeB, partB] = [this.activeNode, key, ...rel.node];
                    
                    if(nodeB < nodeA) {
                        [nodeA, partA, nodeB, partB] = [nodeB, partB, nodeA, partA];
                    }

                    let id = nodeA + 'a' + partA + 'd' + nodeB + 'a' + partB;
                    this.deleteLine(id);
                }
            })

            $(node.selector).remove();
            delete(this.nodes[this.activeNode]);

        this.setNode(null);
    }

    connectLine(nodeA, partA, nodeB, partB){
        this.nodes[nodeA].relation[partA] = {node: [nodeB, partB], caption: ''};
        this.nodes[nodeB].relation[partB] = {node: [nodeA, partA], caption: ''};

        let reversed = false;
        if(nodeB < nodeA) {
            reversed = true;
            [nodeA, partA, nodeB, partB] = [nodeB, partB, nodeA, partA];
        }

        let id = nodeA + 'a' + partA + 'd' + nodeB + 'a' + partB;
        this.lines[id] = new Line(id, this.nodes[nodeA], partA, this.nodes[nodeB], partB, reversed);
    }

    createNode(nodeA, partA) {
        let node = this.nodes[nodeA];

        let x = pos[0][partA] * 200 + node.x;
        let y = pos[1][partA] * 200 + node.y;

        let nodeB = ++this.counter;
        let partB = (partA + 2) % 4;

        this.nodes[nodeB] = new Slide(nodeB, x, y);
        this.connectLine(nodeA, partA, nodeB, partB);
    }

    start(e) {
        let elem = $(e.target);
        if(elem.is('path')) {
            let path = this.getPathInfo(e);
            if(this.nodes[path[0]].relation[path[1]] === null) this.tempPath = path;

            if(!this.shiftKey) {
                this.tempNode = elem.closest('.node').data('id');
                this.offset = this.getMousePosition(e);
                this.offset.x -= this.nodes[this.tempNode].x;
                this.offset.y -= this.nodes[this.tempNode].y;
            }

        } else if(elem.is('line')) {
            this.tempLine = elem.data('id');
        } else {
            this.activeLine = null;
        }
    }

    drag(e) {
        //select element
        let elem = $(e.target);
        if (elem.is('rect') || elem.is('path')) {
            this.setNode(elem.closest('.node').data('id'));
        } else if(!this.holdNode && !this.editorActive){
            this.setNode(null);
        }

        //drag
        if (this.tempNode || this.tempPath) {
            body.addClass('ondrag');
            let coor = this.getMousePosition(e);
            if (this.tempNode) {
                this.holdNode = true;

                let node = this.nodes[this.tempNode];
                node.x = (coor.x - this.offset.x);
                node.y = (coor.y - this.offset.y);
            }
            else {
                this.setHelper(this.tempPath[1], coor.x, coor.y);

                this.holdPath = true;
                if (!this.shiftKey) {
                    this.end(e);
                }
            }
        }

        this.backup();
    }

    end(e) {
        let elem = $(e.target);
        if(this.tempPath) {
            let [nodeA, partA] = this.tempPath;

            if(this.holdPath) {
                if(elem.is('path')) {
                    let [nodeB, partB] = this.getPathInfo(e);

                    if(nodeA !== nodeB && this.nodes[nodeB].relation[partB] === null) {
                        let isNew = 1;

                        this.nodes[nodeB].relation.forEach((rel, key) => {
                            if(rel && rel.node[0] === nodeA) isNew = 0;
                        });

                        if(isNew) this.connectLine(nodeA, partA, nodeB, partB);
                    }
                }
            } else if(!this.holdNode) {
                this.createNode(nodeA, partA);
            }
        } else if(this.tempLine) {
            if(elem.is('line') && elem.data('id') === this.tempLine){
                this.activeLine = elem.data('id');
                this.setNode(null);
            }
        }

        body.removeClass('ondrag');
        this.holdPath = false;
        this.holdNode = false;

        this.tempLine = null;
        this.tempPath = null;
        this.tempNode = null;

        this.setHelper(-1, 0, 0);
        this.backup();
    }

    edit() {
        if(!this.activeNode) return;
        this.editorActive = true;

        let node = this.nodes[this.activeNode];

        rich.froalaEditor('html.set', node.content);

        editor.css({
            left: node.x,
            top: node.y
        });

        setTimeout(() => {
            editor.addClass('active');
        }, 50);

        captions
            .val(i => {
                return node.captions[i];
            })
    }

    save() {
        let node = this.nodes[this.activeNode];
        node.content = rich.froalaEditor('html.get');

        for(let key in node.captions) {
            node.captions[key] = captions.filter(`[data-part=${key}]`).val();
        }

        this.backup();
    }

    show() {
        this.curSlide = this.rootNode;
        this.generate();

        this.move(-1, 0);
    }

    generate() {
        for(let key in this.nodes) {
            let node = this.nodes[key];
            wrapper.prepend(`
                <g class="mini" style="transform: translate(${node.x}px, ${node.y}px)" data-id="${node.id}">
                    <path d="M 0 0 L -40 -40 L 40 -40 Z"></path>
                    <text>1</text>
                    <path d="M 0 0 L 40 -40 L 40 40 Z"></path>
                    <text>2</text>
                    <path d="M 0 0 L 40 40 L -40 40 Z"></path>
                    <text>3</text>
                    <path d="M 0 0 L -40 40 L -40 -40 Z"></path>
                    <text>4</text>
                </g>
            `).html(wrapper.html());
        }

        for(let key in this.lines) {
            let line = this.lines[key];
            let x1 = line.nodeA.x + pos[0][line.partA] * r;
            let y1 = line.nodeA.y + pos[1][line.partA] * r;
            let x2 = line.nodeB.x + pos[0][line.partB] * r;
            let y2 = line.nodeB.y + pos[1][line.partB] * r;

            wrapper.append(`
                <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>
            `).html(wrapper.html());
        }
    }

    move(part, after = 1) {
        if (after) {
            let next = this.nodes[this.curSlide].relation[part];
            if(!next) return;
            this.curSlide = next[0];
        }

        let node = this.nodes[this.curSlide];
        let slide = $(`
            <div class="slide" data-part="${part}">
                ${node.content}
            </div>
        `);

        $("#wrapper-view main").append(slide);

        setTimeout(() => {
            slide.addClass('active');

            setTimeout(() => {
                slide.prev('.slide').remove();
            }, 600);
        }, 200);

        this.setMap();
    }

    setMap() {
        let node = this.nodes[this.curSlide];

        let x = 250 - node.x * scale;
        let y = 150 - node.y * scale;

        wrapper
            .attr('style', `transform: translate(${x}px, ${y}px) scale(${scale})`)
            .children('.mini')
            .removeClass('active')
            .filter(`[data-id=${node.id}]`)
            .addClass('active');

        let arr = [0, 3, 1, 2];

        buttons
            .prop('disabled', true)
            .html(i => {
                let text = (arr[i] + 1) + ' - ';
                if(node.captions[arr[i]]) text += node.captions[arr[i]];
                else text += 'default relation ' + (arr[i] + 1);
                return text;
            })
            .filter(i => node.relation[arr[i]])
            .prop('disabled', false);
    }

    update() {
        for(let key in this.nodes) {
            this.nodes[key].update(this.activeNode, this.holdPath, this.rootNode);
        }

        for(let key in this.lines) {
            this.lines[key].update(this.activeLine);
        }

        requestAnimationFrame(this.update.bind(this));
    }
}