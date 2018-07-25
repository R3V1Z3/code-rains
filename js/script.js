let matrix = [];
let maxchars = 100;
chars = " .ウカ0ヲ⋺⋵≐⋄ミマィ⋔";
const gd = new GitDown('#wrapper', {
    title: 'Code Rains',
    content: 'README.md',
    merge_gists: false,
    callback: done
});

function done() {

    // load svg file to populate svg-filter list
    let svg = document.querySelector('#svg');
    if ( svg !== undefined ) extract_svg('filters.svg');

    // wrap .inner with an fx div
    let fx = gd.wrapper.querySelector('.fx');
    if ( fx !== undefined ) {
        $(gd.eid_inner).wrap('<div class="fx">');
        $('#wrapper').append('<div class="vignette-layer"></div>');
    }
    
    vignette();

    gd.inner.setAttribute( 'data-x', gd.settings.get_value('offsetX') );
    gd.inner.setAttribute( 'data-y', gd.settings.get_value('offsetY') );

    if ( !gd.status.has('app-events-registered') ) register_events();

    // update outer-space option to configure dimensions
    center_view();
    update_slider_value( 'outer-space', gd.settings.get_value('outer-space') );
    center_view();

    // remove heading from initial section
    let section = gd.wrapper.querySelector('section');
    section.innerHTML = '<pre><code class="code"></code></pre>';
    matrix = fill_initial();
    setInterval(update_content, 100);
}

function fill_matrix() {
    const width = gd.settings.get_value('width');
    const height = gd.settings.get_value('height');

    // keep matrix as is if less than section height
    if ( matrix.length > height ) return matrix;

    // get character last line
    const lastline = matrix.pop();
    // get number of chars by counting spaces and subtracting from dimensions
    let count = lastline.length - lastline.match(/ /g).length;
    // create new line with char count based on last line
    let newline = random_line(width, ' ', chars, maxchars/height);
    matrix.unshift(newline);
    return matrix;
}

function update_content() {
    let result = '';
    matrix = fill_matrix();
    matrix.forEach( l => {
        result += l + '\n';
    });
    const code = gd.wrapper.querySelector('.code');
    code.textContent = result;
}

function fill_initial() {
    const width = gd.settings.get_value('width');
    const height = gd.settings.get_value('height');
    let l = [];
    for ( let i = 0; i < height; i++ ) {
        l.push(random_line(width, ' ', chars, maxchars/height));
    }
    return l;
}

// returns a string of @w length filled with @filler character
// and @rnd_count number of random characters from @rnd_str
function random_line(w, filler, rnd_str, rnd_count) {
    let result = '';
    // rnd_array holds indexes of characters that should be randomized
    let rnd_array = Array.from({length: rnd_count}, () => Math.floor( Math.random() * w) );
    for ( let i = 0; i < w; i++ ) {
        if ( rnd_array.includes(i) ) {
            result += rnd_str.charAt(random(rnd_str.length));
        } else result += filler;
    }
    return result;
}

function random(min, max) {
    if ( max === undefined ) return Math.floor(Math.random() * min) + 0;
    return Math.floor(Math.random() * max) + min;
}

function vignette() {
    const v = gd.settings.get_value('vignette');
    var bg = `radial-gradient(ellipse at center,`;
    bg += `rgba(0,0,0,0) 0%,`;
    bg += `rgba(0,0,0,${v/6}) 30%,`;
    bg += `rgba(0,0,0,${v/3}) 60%,`;
    bg += `rgba(0,0,0,${v}) 100%)`;
    var s = '';
    // gd.dom.style('.vignette-layer', 'backgroundImage', bg);
    var vignette = gd.wrapper.querySelector('.vignette-layer');
    if ( vignette !== null ) vignette.style.backgroundImage = bg;
}

function extract_svg(filename) {
    let svg_filter = gd.settings.get_param_value('svg-filter');
    if ( svg_filter === undefined ) svg_filter = 'none';
    $.get( filename, function(data) {
        // add svg filters to body
        var div = document.createElement("div");
        div.id = 'svg';
        div.innerHTML = new XMLSerializer().serializeToString(data.documentElement);
        document.body.insertBefore(div, document.body.childNodes[0]);

        var $select = $('.nav .field.select.svg-filter select');
        if ( $select.length > 0 ) {
            // $select exists, so lets add the imported filters
            $('#svg defs filter').each(function() {
                var id = $(this).attr('id');
                var name = $(this).attr('inkscape:label');
                $select.append(`<option>${name}-${id}</option>`);
            });
        }

        // we'll update svg-filter url parameter now that svg is loaded
        var $select = $('.nav .select.svg-filter select');
        $select.val(svg_filter);
        $select.change();
    });
}

function update_slider_value( name, value ) {
    var slider = gd.wrapper.querySelector( `.nav .slider.${name} input` );
    slider.value = value;
    gd.update_field(slider, value);
}

// center view by updating translatex and translatey
function center_view() {
    const $ = document.querySelector.bind(document);
    let $s = $('.section.current');
    let $fx = $('.fx');
    let $inner = $('.inner');
    
    // store $inner dimensions for use later, if not already set
    if( $inner.getAttribute('data-width') === null ) {
        $inner.setAttribute('data-width', $inner.offsetWidth);
        $inner.setAttribute('data-height', $inner.offsetHeight);
    }

    let inner_space = parseInt( $('.field.inner-space input').value );
    let outer_space = parseInt( $('.field.outer-space input').value );

    const maxw = window.innerWidth;
    const maxh = window.innerHeight;

    // start by setting the scale
    let scale = Math.min(
        maxw / ( $s.offsetWidth + inner_space ),
        maxh / ( $s.offsetHeight + inner_space )
    );

    // setup positions for transform
    let x = $s.offsetLeft - ( maxw - $s.offsetWidth ) / 2;
    let y = $s.offsetTop - ( maxh - $s.offsetHeight ) / 2;

    x -= parseInt( $('.field.offsetX input').value );
    y -= parseInt( $('.field.offsetY input').value );

    // initiate transform
    const transform = `
        translateX(${-x}px)
        translateY(${-y}px)
        scale(${scale})
    `;
    let w = Number($inner.getAttribute('data-width'));
    let h = Number($inner.getAttribute('data-height'));
    $inner.style.width = w + outer_space + 'px';
    $inner.style.height = h + outer_space + 'px';
    $fx.style.width = $inner.offsetWidth + 'px';
    $fx.style.height = $inner.offsetHeight + 'px';
    $fx.style.transform = transform;
}

function register_events() {

    gd.status.add('app-events-registered');

    window.addEventListener('resize', function(event){
        center_view();
    });

    gd.events.add('.nav .collapsible.Dimensions .field.slider input', 'input', center_view);
    gd.events.add('.nav .field.slider input', 'input', vignette);

    let f = gd.wrapper.querySelector('.nav .field.select.svg-filter select');
    f.addEventListener( 'change', svg_change );
    function svg_change(e) {
        let fx = document.querySelector('.fx');
        if ( fx === null ) return;

        let style = `
            brightness(var(--brightness))
            contrast(var(--contrast))
            grayscale(var(--grayscale))
            hue-rotate(var(--hue-rotate))
            invert(var(--invert))
            saturate(var(--saturate))
            sepia(var(--sepia))
            blur(var(--blur))
        `;

        let svg = e.target.value;
        let url = '';
        svg = svg.split('-');
        if ( svg.length > 1 ) url = ` url(#${svg[1].trim()})`;
        style += url;
        fx.style.filter = style;
    }

    // mousewheel zoom handler
    $('.inner').on('wheel', function(e){
        // disallow zoom within parchment content so user can safely scroll text
        let translatez = document.querySelector('.nav .slider.translateZ input');
        if ( translatez === null ) return;
        var v = Number( translatez.value );
        if( e.originalEvent.deltaY < 0 ) {
            v += 10;
            if ( v > 500 ) v = 500;
        } else{
            v -= 10;
            if ( v < -500 ) v = -500;
        }
        gd.settings.set_value('translateZ', v);
        update_slider_value( 'translateZ', v );
    });

    interact(gd.eid_inner)
    .gesturable({
        onmove: function (event) {
            var scale = gd.settings.get_value('translateZ');
            scale = scale * (5 + event.ds);
            update_slider_value( 'translateZ', scale );
            dragMoveListener(event);
        }
    })
    .draggable({ onmove: dragMoveListener });

}

function dragMoveListener (event) {
    let target = event.target;
    if ( !target.classList.contains('inner') ) return;
    if ( event.buttons > 1 && event.buttons < 4 ) return;
    let x = (parseFloat(target.getAttribute('data-x')) || 0);
    let old_x = x;
    x += event.dx;
    let y = (parseFloat(target.getAttribute('data-y')) || 0);
    let old_y = y;
    y += event.dy;

    // when middle mouse clicked and no movement, reset offset positions
    if ( event.buttons === 4 ) {
        x = gd.settings.get_default('offsetX');
        y = gd.settings.get_default('offsetY');
    }
    
    update_slider_value( 'offsetX', x );
    update_slider_value( 'offsetY', y );
    
    // update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);

    center_view();
}
