let matrix = '';
let filler = ' ';
chars = "01";//"╿⎮╽║";
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
    
    configure_sections();

    const w = gd.settings.get_value('width');
    const h = gd.settings.get_value('height');
    const maxchars = gd.settings.get_value('maxchars');
    matrix = fill_matrix(w, h, get_total_chars(w, h, maxchars) );
    update_content();
    setInterval(update_content, 200);
    center_view();
}

function get_total_chars(w, h, maxchars) {
    const t = w * h;
    return t * (maxchars/100);
}

function configure_sections() {
    const sections = gd.wrapper.querySelectorAll('section');
    sections.forEach( (section, i) => {
        let n = '';
        if ( i > 0 ) n = '-' + i;
        let code = `<pre><code class="code${n}"></code></pre>`;
        section.innerHTML = code;
    });
}

function update_content() {
    matrix = animatrix(matrix);
    const code = gd.wrapper.querySelector('.code');
    const code1 = gd.wrapper.querySelector('.code-1');
    const code2 = gd.wrapper.querySelector('.code-2');
    code2.textContent = code1.textContent;
    code1.textContent = code.textContent;
    code.textContent = matrix;
}

function animatrix(matrix) {
    const w = gd.settings.get_value('width');
    const h = gd.settings.get_value('height');
    const maxchars = gd.settings.get_value('maxchars');
    let total_chars = get_total_chars(w, h, maxchars);
    let m = matrix;
    // remove last '\n'
    m = m.substring( 0, m.length - 1 );
    // now remove last line
    m = m.substr( 0, m.lastIndexOf('\n') );
    if ( m.split('\n').length <= h ) {
        // get number of chars
        let count = char_count(m, filler);
        let needed = total_chars - count;
        if (needed < 0) needed = 0;
        // create new line with char count based on last line
        let newline = fill_matrix(w, 1, needed);
        m = newline + m;
    }
    // now lets morph some existing chars
    m = morph_chars(m, chars, total_chars/2, filler);
    return m;
}

function morph_chars(lines, chars, count, filler) {
    for ( let i = 0; i < count; i++ ) {
        let rnd = random(lines.length);
        let new_chr = random_char(chars);
        let chr = lines.charAt(rnd);
        if ( chr === '\n' ) continue;
        if ( chr === filler ) continue;
        lines = replace_char_at(lines, rnd, new_chr);
    }
    return lines;
}

function char_count(str, filler) {
    let count = 0;
    for ( i = 0; i < str.length; i++ ) {
        let chr = str.charAt(i);
        if ( !filler.includes(chr) ) count++;
    }
    return count;
}

// fill a string with rows @h of lines with length @w
function fill_matrix(w, h, maxchars) {
    let lines = '';
    let l = filler.repeat(w) + '\n';
    lines = l.repeat(h);
    if ( maxchars < 1) return lines;
    lines = randomize_chars(lines, chars, maxchars, filler);
    return lines;
}

// replace @count number of random indexes in @lines
// with random characters from @chars
//
// optional @filler array lets us replace a char only if it's in array
function randomize_chars(lines, chars, count, filler) {
    for ( let i = 0; i < count; i++ ) {
        let rnd = random(lines.length);
        let chr = lines.charAt(rnd);
        let new_chr = random_char(chars);
        if ( chr === '\n' ) continue;
        // if ( filler !== undefined && chr !== filler ) continue;
        lines = replace_char_at(lines, rnd, new_chr);
    }
    return lines;
}

function replace_char_at(str, i, replace) {
    return str.substr(0, i) + replace + str.substr(i + 1);
}

// return random character from @str
function random_char(str) {
    return str.charAt( random(str.length) );
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

    gd.events.add('.nav .collapsible.Effects .field.slider input', 'input', center_view);
    gd.events.add('.nav .collapsible.Dimensions .field.slider input', 'input', center_view);
    gd.events.add('.nav .field.slider.fontsize input', 'input', center_view);
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
