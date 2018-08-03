class CodeRains extends GitDown {

    constructor(el, options) {
        super(el, options);
    }

    // in core, check for existence of subentry()
    // excecute it if it exists
    let_it_rain() {
        this.update_offsets();
        this.extract_svg('filters.svg');
        this.add_fx();
        this.vignette();

        this.center_view();
        this.configure_matrix();

        this.register_app_events();
        this.update_slider_value( 'outer-space', this.settings.get_value('outer-space') );

        this.center_view();
    }

    configure_matrix() {
        this.matrix = new Matrix();
        this.matrix.configure_sections();
        this.set_matrix_values();
    }

    set_matrix_values() {
        // let options = {};
        // options.w = this.settings.get_value('width');
        // options.h = this.settings.get_value('height');
        // options.chars = this.settings.get_value('chars');
        // options.filler = this.settings.get_value('filler');
        // options.maxchars = this.settings.get_value('width');
        // options.speed = this.settings.get_value('speed');
        this.matrix.set_option( 'w', this.settings.get_value('width') );
        this.matrix.set_option( 'h', this.settings.get_value('height') );
        this.matrix.set_option( 'chars', this.settings.get_value('chars') );
        this.matrix.set_option( 'filler', this.settings.get_value('filler') );
        this.matrix.set_option( 'maxchars', this.settings.get_value('maxchars') );
        console.log(this.matrix.o);
    }

    extract_svg(filename) {
        let svg = document.querySelector('#svg');
        if ( svg === undefined ) return;
        let svg_filter = this.settings.get_param_value('svg-filter');
        if ( svg_filter === undefined ) svg_filter = 'none';
        this.get(filename).then( data => {
            // add svg filters to body
            var div = document.createElement("div");
            div.id = 'svg';
            div.innerHTML = data;
            document.body.insertBefore(div, document.body.childNodes[0]);
    
            let select = this.wrapper.querySelector('.nav .select.svg-filter select');
            if ( select !== null ) {
                let filters = document.querySelectorAll('#svg defs filter');
                filters.forEach( i => {
                    var id = i.getAttribute('id');
                    var name = i.getAttribute('inkscape:label');
                    select.innerHTML += `<option>${name}-${id}</option>`;
                });
            }
            select.value = svg_filter;
            this.update_field(select, svg_filter);
            this.svg_change();
        }).catch(function (error) {
            console.log(error);
        });
    }

    add_fx() {
        // check if fx layer already exists and return if so
        if ( this.wrapper.querySelector('.fx') === undefined ) return;
        const fx = document.createElement('div');
        fx.classList.add('fx');
        // wrap inner div with fx div
        const inner = document.querySelector(this.eid_inner);
        inner.parentNode.insertBefore(fx, inner);
        fx.appendChild(inner);
        // add vignette layer to wrapper
        const vignette = document.createElement('div');
        vignette.classList.add('vignette-layer');
        this.wrapper.appendChild(vignette);
    }

    svg_change() {
        let svg = this.settings.get_value('svg-filter');
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
        let url = '';
        svg = svg.split('-');
        if ( svg.length > 1 ) url = ` url(#${svg[1].trim()})`;
        style += url;
        fx.style.filter = style;
    }

    vignette() {
        const v = this.settings.get_value('vignette');
        var bg = `radial-gradient(ellipse at center,`;
        bg += `rgba(0,0,0,0) 0%,`;
        bg += `rgba(0,0,0,${v/6}) 30%,`;
        bg += `rgba(0,0,0,${v/3}) 60%,`;
        bg += `rgba(0,0,0,${v}) 100%)`;
        var s = '';
        var vignette = this.wrapper.querySelector('.vignette-layer');
        if ( vignette !== null ) vignette.style.backgroundImage = bg;
    }

    update_offsets() {
        this.inner.setAttribute( 'data-x', this.settings.get_value('offsetX') );
        this.inner.setAttribute( 'data-y', this.settings.get_value('offsetY') );
    }

    update_slider_value( name, value ) {
        var slider = this.wrapper.querySelector( `.nav .slider.${name} input` );
        slider.value = value;
        this.update_field(slider, value);
    }

    // center view by updating translatex and translatey
    center_view() {
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

    register_app_events() {

        if ( this.status.has('app-events-registered') ) return;
        else this.status.add('app-events-registered');
    
        window.addEventListener('resize', e => {
            this.center_view();
        });
    
        this.events.add('.nav .collapsible.Effects .field.slider input', 'input', this.center_view);
        this.events.add('.nav .collapsible.Dimensions .field.slider input', 'input', this.center_view);
        this.events.add('.nav .field.slider.fontsize input', 'input', this.center_view);
        this.events.add('.nav .field.slider.vignette input', 'input', this.vignette.bind(this));

        this.events.add('.nav .collapsible.Options .field input', 'input', this.set_matrix_values.bind(this));
        this.events.add('.nav .slider.width input', 'input', this.set_matrix_values.bind(this));
        this.events.add('.nav .slider.height input', 'input', this.set_matrix_values.bind(this));
    
        // add events for matrix
        this.events.add('.nav .field.slider.speed input', 'input', e => {
            this.matrix.set_speed(e.target.value);
        });
    
        let f = document.querySelector('.nav .field.select.svg-filter select');
        f.addEventListener( 'change', this.svg_change );
    
        // mousewheel zoom handler
        this.events.add('.inner', 'wheel', e => {
            // disallow zoom within parchment content so user can safely scroll text
            let translatez = document.querySelector('.nav .slider.translateZ input');
            if ( translatez === null ) return;
            var v = Number( translatez.value );
            if( e.deltaY < 0 ) {
                v += 10;
                if ( v > 500 ) v = 500;
            } else{
                v -= 10;
                if ( v < -500 ) v = -500;
            }
            this.settings.set_value('translateZ', v);
            this.update_slider_value( 'translateZ', v );
        }, this );
    
        interact(this.eid_inner)
        .gesturable({
            onmove: function (event) {
                var scale = this.settings.get_value('translateZ');
                scale = scale * (5 + event.ds);
                this.update_slider_value( 'translateZ', scale );
                this.dragMoveListener(event);
            }
        })
        .draggable({ onmove: this.dragMoveListener.bind(this) });
    
    }
    
    dragMoveListener (event) {
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
            x = this.settings.get_default('offsetX');
            y = this.settings.get_default('offsetY');
        }
        
        this.update_slider_value( 'offsetX', x );
        this.update_slider_value( 'offsetY', y );
        
        // update the position attributes
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    
        this.center_view();
    }

}

class Matrix {

    constructor(options) {
        if ( options === undefined ) options = {};
        this.o = this.merge_defaults(options);
        this.speed_timer = undefined;
        this.matrix = '';
        const f = this.get_filler();
        this.initialize_matrix(this.o.w, this.o.h, this.o.chars, f, this.o.maxchars);
        this.set_speed(this.o.speed);
    }

    // ====================== BEGIN BROWSER/DOM METHODS

    set_speed(speed) {
        if ( this.speed_timer !== undefined ) clearInterval(this.speed_timer);
        this.speed_timer = setInterval(this.update_matrix.bind(this), speed);
    }

    configure_sections() {
        const sections = document.querySelectorAll('section');
        sections.forEach( (section, i) => {
            let n = '';
            if ( i > 0 ) n = '-' + i;
            let code = `<pre><code class="code${n}"></code></pre>`;
            section.innerHTML = code;
        });
    }

    update_sections(w, h, chars, filler, maxchars) {
        let codes = document.querySelectorAll('section code');
        let old_content = '';
        codes.forEach( (c, i) => {
            if ( old_content === '' ) {
                old_content = c.textContent;
                c.textContent = this.matrix;
            }
            else {
                const m = old_content;
                const t = this.get_total_chars(w, h, maxchars);
                old_content = c.textContent;
                c.textContent = this.morph_chars(m, chars, filler);
            }
        }, this);
    }

    // ====================== END BROWSER/DOM METHODS

    merge_defaults(options) {
        let defaults = {
            w: 100,
            h: 25,
            chars: "01",
            filler: " ",
            maxchars: 10,
            speed: 50
        };
        return Object.assign( options, defaults );
    }

    set_option(option, value) {
        this.o[option] = value;
    }

    initialize_matrix(w, h, chars, filler, maxchars) {
        let total_chars = this.get_total_chars(w, h, maxchars);
        this.matrix = this.fill_matrix(w, h, chars, filler, total_chars);
    }
    
    get_filler() {
        let f = this.o.filler;
        if ( f.length < 1 ) filler = ' ';
        // ensure there's only one character
        f = f.substr(0,1);
        return f;
    }
    
    get_total_chars(w, h, maxchars) {
        const t = w * h;
        return t * (maxchars/100);
    }
    
    update_matrix() {
        const w = this.o.w;
        const h = this.o.h;
        const chars = this.o.chars;
        const filler = this.get_filler();
        const maxchars = this.o.maxchars;
        this.matrix = this.animatrix(this.matrix, w, h, chars, filler, maxchars);
        this.update_sections(w, h, chars, filler, maxchars);
    }
    
    animatrix(matrix, w, h, chars, filler, maxchars) {
        let total_chars = this.get_total_chars(w, h, maxchars);
        let m = matrix;
        // remove last '\n'
        m = m.substring( 0, m.length - 1 );
        // now remove last line
        m = m.substr( 0, m.lastIndexOf('\n') );
        if ( m.split('\n').length <= h ) {
            // get number of chars
            let count = this.char_count(m, filler);
            let needed = total_chars - count;
            if (needed < 0) needed = 0;
            // create new line with char count based on last line
            let newline = this.fill_matrix(w, 1, chars, filler, needed);
            // ensure sufficient space after chars so they don't overlap trails (which is ugly)
            m = newline + m;
        }
        // now lets morph some existing chars
        m = this.morph_chars(m, chars, filler);
        return m;
    }
    
    // returns first row in @column that doesn't have a filler char
    find_first_row_not_filler(matrix, column, filler) {
        let matrix_array = matrix.split('\n');
        return matrix_array.findIndex( row => {
            return row[column] !== filler;
        });
    }
    
    morph_chars(lines, chars, filler) {
        for ( let i = 0; i < lines.length; i++ ) {
            if ( lines[i] === '\n' ) continue;
            if ( lines[i] === filler ) continue;
            let chr = this.random_char(chars);
            lines = this.replace_char_at(lines, i, chr);
        }
        return lines;
    }
    
    char_count(str, filler) {
        let count = 0;
        for ( let i = 0; i < str.length; i++ ) {
            let chr = str.charAt(i);
            if ( !filler.includes(chr) ) count++;
        }
        return count;
    }
    
    // fill a string with rows @h of lines with length @w
    fill_matrix(w, h, chars, filler, maxchars) {
        let lines = '';
        let l = filler.repeat(w) + '\n';
        lines = l.repeat(h);
        if ( maxchars < 1) return lines;
        lines = this.randomize_chars(lines, chars, maxchars);
        return lines;
    }
    
    // replace @count number of random indexes in @lines
    // with random character from @chars
    //
    // optional @filler array lets us replace a char only if it's in array
    randomize_chars(lines, chars, count) {
        for ( let i = 0; i < count; i++ ) {
            let rnd = this.random(lines.length);
            let chr = lines.charAt(rnd);
            if ( chr === '\n' ) continue;
            let new_chr = this.random_char(chars);
            lines = this.replace_char_at(lines, rnd, new_chr);
        }
        return lines;
    }
    
    replace_char_at(str, i, replace) {
        return str.substr(0, i) + replace + str.substr(i + 1);
    }
    
    // return random character from @str
    random_char(str) {
        return str.charAt( this.random(str.length) );
    }
    
    random(min, max) {
        if ( max === undefined ) return Math.floor(Math.random() * min) + 0;
        return Math.floor(Math.random() * max) + min;
    }

}