let w,
    h,
    r = 40,
    scale = 0.5,
    pos = [
        [0, 1, 0, -1],
        [-1, 0, 1, 0]
    ];

let body = $('body'),
    svg = $('#svg'),
    wrapper = $("#map .wrapper"),
    rich = $("#content"),
    editor = $("#editor"),
    buttons = $(".control button"),
    captions = $(".captions input");

window.onload = () => {
    setSize();

    main = new Main();
}

window.onresize = () => {
    setSize();
}

function setSize() {
    w = window.innerWidth;
    h = window.innerHeight;

    svg.attr({
        width: w,
        height: h
    });
}