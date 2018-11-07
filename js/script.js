class CodeRains extends BreakDown {

  constructor(el, options) {
    super(el, options);
  }

  ready() {
    this.updateOffsets();
    this.extractSvg('filters.svg');
    this.addFx();
    this.vignette();

    this.centerView();
    this.configureMatrix();

    this.registerAppEvents();
    this.updateSliderValue('outer-space', this.settings.getValue('outer-space'));

    this.centerView();
  }

  configureMatrix() {
    this.matrix = new Matrix();
    this.matrix.configureSections();
    this.setMatrixValues();
  }

  setMatrixValues() {
    this.matrix.setOption('w', this.settings.getValue('width'));
    this.matrix.setOption('h', this.settings.getValue('height'));
    this.matrix.setOption('chars', this.settings.getValue('chars'));
    this.matrix.setOption('filler', this.settings.getValue('filler'));
    this.matrix.setOption('maxchars', this.settings.getValue('maxchars'));
  }

  extractSvg(filename) {
    let svg = document.querySelector('#svg');
    if (svg === undefined) return;
    let svgFilter = this.settings.getParamValue('svg-filter');
    if (svgFilter === undefined) svgFilter = 'none';
    this.get(filename).then(data => {
      // add svg filters to body
      var div = document.createElement("div");
      div.id = 'svg';
      div.innerHTML = data;
      document.body.insertBefore(div, document.body.childNodes[0]);

      let select = this.wrapper.querySelector('.nav .select.svg-filter select');
      if (select !== null) {
        let filters = document.querySelectorAll('#svg defs filter');
        filters.forEach(i => {
          var id = i.getAttribute('id');
          var name = i.getAttribute('inkscape:label');
          select.innerHTML += `<option>${name}-${id}</option>`;
        });
      }
      select.value = svgFilter;
      this.updateField(select, svgFilter);
      this.svgChange();
    }).catch(function (error) {
      console.log(error);
    });
  }

  addFx() {
    // check if fx layer already exists and return if so
    if (this.wrapper.querySelector('.fx') === undefined) return;
    const fx = document.createElement('div');
    fx.classList.add('fx');
    // wrap inner div with fx div
    const inner = document.querySelector(this.eidInner);
    inner.parentNode.insertBefore(fx, inner);
    fx.appendChild(inner);
    // add vignette layer to wrapper
    const vignette = document.createElement('div');
    vignette.classList.add('vignette-layer');
    this.wrapper.appendChild(vignette);
  }

  svgChange() {
    let svg = this.settings.getValue('svg-filter');
    let fx = document.querySelector('.fx');
    if (fx === null) return;

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
    if (svg.length > 1) url = ` url(#${svg[1].trim()})`;
    style += url;
    fx.style.filter = style;
  }

  vignette() {
    const v = this.settings.getValue('vignette');
    var bg = `radial-gradient(ellipse at center,`;
    bg += `rgba(0,0,0,0) 0%,`;
    bg += `rgba(0,0,0,${v / 6}) 30%,`;
    bg += `rgba(0,0,0,${v / 3}) 60%,`;
    bg += `rgba(0,0,0,${v}) 100%)`;
    var s = '';
    var vignette = this.wrapper.querySelector('.vignette-layer');
    if (vignette !== null) vignette.style.backgroundImage = bg;
  }

  updateOffsets() {
    this.inner.setAttribute('data-x', this.settings.getValue('offsetx'));
    this.inner.setAttribute('data-y', this.settings.getValue('offsety'));
  }

  updateSliderValue(name, value) {
    var slider = this.wrapper.querySelector(`.nav .slider.${name} input`);
    slider.value = value;
    this.updateField(slider, value);
  }

  // center view by updating translatex and translatey
  centerView() {
    const $ = document.querySelector.bind(document);
    let $s = $('.section.current');
    let $fx = $('.fx');
    let $inner = $('.inner');

    // store $inner dimensions for use later, if not already set
    if ($inner.getAttribute('data-width') === null) {
      $inner.setAttribute('data-width', $inner.offsetWidth);
      $inner.setAttribute('data-height', $inner.offsetHeight);
    }

    let innerSpace = parseInt($('.field.inner-space input').value);
    let outerSpace = parseInt($('.field.outer-space input').value);

    const maxw = window.innerWidth;
    const maxh = window.innerHeight;

    // start by setting the scale
    let scale = Math.min(
      maxw / ($s.offsetWidth + innerSpace),
      maxh / ($s.offsetHeight + innerSpace)
    );

    // setup positions for transform
    let x = $s.offsetLeft - (maxw - $s.offsetWidth) / 2;
    let y = $s.offsetTop - (maxh - $s.offsetHeight) / 2;

    x -= parseInt($('.field.offsetx input').value);
    y -= parseInt($('.field.offsety input').value);

    // initiate transform
    const transform = `
      translateX(${-x}px)
      translateY(${-y}px)
      scale(${scale})
    `;
    let w = Number($inner.getAttribute('data-width'));
    let h = Number($inner.getAttribute('data-height'));
    $inner.style.width = w + outerSpace + 'px';
    $inner.style.height = h + outerSpace + 'px';
    $fx.style.width = $inner.offsetWidth + 'px';
    $fx.style.height = $inner.offsetHeight + 'px';
    $fx.style.transform = transform;
  }

  registerAppEvents() {

    if (this.status.has('app-events-registered')) return;
    else this.status.add('app-events-registered');

    window.addEventListener('resize', e => {
      this.centerView();
    });

    this.events.add('.nav .collapsible.Effects .field.slider input', 'input', this.centerView);
    this.events.add('.nav .collapsible.Dimensions .field.slider input', 'input', this.centerView);
    this.events.add('.nav .field.slider.fontsize input', 'input', this.centerView);
    this.events.add('.nav .field.slider.vignette input', 'input', this.vignette.bind(this));

    this.events.add('.nav .collapsible.Options .field input', 'input', this.setMatrixValues.bind(this));
    this.events.add('.nav .slider.width input', 'input', this.setMatrixValues.bind(this));
    this.events.add('.nav .slider.height input', 'input', this.setMatrixValues.bind(this));

    // add events for matrix
    this.events.add('.nav .field.slider.speed input', 'input', e => {
      this.matrix.setSpeed(e.target.value);
    });

    let f = document.querySelector('.nav .field.select.svg-filter select');
    f.addEventListener('change', this.svgChange);

    // mousewheel zoom handler
    this.events.add('.inner', 'wheel', e => {
      // disallow zoom within parchment content so user can safely scroll text
      let translatez = document.querySelector('.nav .slider.translatez input');
      if (translatez === null) return;
      var v = Number(translatez.value);
      if (e.deltaY < 0) {
        v += 10;
        if (v > 500) v = 500;
      } else {
        v -= 10;
        if (v < -500) v = -500;
      }
      this.settings.setValue('translatez', v);
      this.updateSliderValue('translatez', v);
    }, this);

    interact(this.eidInner)
      .gesturable({
        onmove: function (event) {
          var scale = this.settings.getValue('translatez');
          scale = scale * (5 + event.ds);
          this.updateSliderValue('translatez', scale);
          this.dragMoveListener(event);
        }
      })
      .draggable({ onmove: this.dragMoveListener.bind(this) });

  }

  dragMoveListener(event) {
    let target = event.target;
    if (!target.classList.contains('inner')) return;
    if (event.buttons > 1 && event.buttons < 4) return;
    let x = (parseFloat(target.getAttribute('data-x')) || 0);
    let oldX = x;
    x += event.dx;
    let y = (parseFloat(target.getAttribute('data-y')) || 0);
    let oldY = y;
    y += event.dy;

    // when middle mouse clicked and no movement, reset offset positions
    if (event.buttons === 4) {
      x = this.settings.getDefault('offsetx');
      y = this.settings.getDefault('offsety');
    }

    this.updateSliderValue('offsetx', x);
    this.updateSliderValue('offsety', y);

    // update the position attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);

    this.centerView();
  }

}

class Matrix {

  constructor(options) {
    if (options === undefined) options = {};
    this.o = this.mergeDefaults(options);
    this.speedTimer = undefined;
    this.matrix = '';
    const f = this.getFiller();
    this.initializeMatrix(this.o.w, this.o.h, this.o.chars, f, this.o.maxchars);
    this.setSpeed(this.o.speed);
  }

  // ====================== BEGIN BROWSER/DOM METHODS

  setSpeed(speed) {
    if (this.speedTimer !== undefined) clearInterval(this.speedTimer);
    this.speedTimer = setInterval(this.updateMatrix.bind(this), speed);
  }

  configureSections() {
    const sections = document.querySelectorAll('section');
    sections.forEach((section, i) => {
      let n = '';
      if (i > 0) n = '-' + i;
      let code = `<pre><code class="code${n}"></code></pre>`;
      section.innerHTML = code;
    });
  }

  updateSections(w, h, chars, filler, maxchars) {
    let codes = document.querySelectorAll('section code');
    let oldContent = '';
    codes.forEach((c, i) => {
      if (oldContent === '') {
        oldContent = c.textContent;
        c.textContent = this.matrix;
      }
      else {
        const m = oldContent;
        const t = this.getTotalChars(w, h, maxchars);
        oldContent = c.textContent;
        c.textContent = this.morphChars(m, chars, filler);
      }
    }, this);
  }

  // ====================== END BROWSER/DOM METHODS

  mergeDefaults(options) {
    let defaults = {
      w: 100,
      h: 25,
      chars: "01",
      filler: " ",
      maxchars: 10,
      speed: 50
    };
    return Object.assign(options, defaults);
  }

  setOption(option, value) {
    this.o[option] = value;
  }

  initializeMatrix(w, h, chars, filler, maxchars) {
    let totalChars = this.getTotalChars(w, h, maxchars);
    this.matrix = this.fillMatrix(w, h, chars, filler, totalChars);
  }

  getFiller() {
    let f = this.o.filler;
    if (f.length < 1) filler = ' ';
    // ensure there's only one character
    f = f.substr(0, 1);
    return f;
  }

  getTotalChars(w, h, maxchars) {
    const t = w * h;
    return t * (maxchars / 100);
  }

  updateMatrix() {
    const w = this.o.w;
    const h = this.o.h;
    const chars = this.o.chars;
    const filler = this.getFiller();
    const maxchars = this.o.maxchars;
    this.matrix = this.animatrix(this.matrix, w, h, chars, filler, maxchars);
    this.updateSections(w, h, chars, filler, maxchars);
  }

  animatrix(matrix, w, h, chars, filler, maxchars) {
    let totalChars = this.getTotalChars(w, h, maxchars);
    let m = matrix;
    // remove last '\n'
    m = m.substring(0, m.length - 1);
    // now remove last line
    m = m.substr(0, m.lastIndexOf('\n'));
    if (m.split('\n').length <= h) {
      // get number of chars
      let count = this.charCount(m, filler);
      let needed = totalChars - count;
      if (needed < 0) needed = 0;
      // create new line with char count based on last line
      let newline = this.fillMatrix(w, 1, chars, filler, needed);
      // ensure sufficient space after chars so they don't overlap trails (which is ugly)
      m = newline + m;
    }
    // now lets morph some existing chars
    m = this.morphChars(m, chars, filler);
    return m;
  }

  // returns first row in @column that doesn't have a filler char
  findFirstRowNotFiller(matrix, column, filler) {
    let matrixArray = matrix.split('\n');
    return matrixArray.findIndex(row => {
      return row[column] !== filler;
    });
  }

  morphChars(lines, chars, filler) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '\n') continue;
      if (lines[i] === filler) continue;
      let chr = this.randomChar(chars);
      lines = this.replaceCharAt(lines, i, chr);
    }
    return lines;
  }

  charCount(str, filler) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      let chr = str.charAt(i);
      if (!filler.includes(chr)) count++;
    }
    return count;
  }

  // fill a string with rows @h of lines with length @w
  fillMatrix(w, h, chars, filler, maxchars) {
    let lines = '';
    let l = filler.repeat(w) + '\n';
    lines = l.repeat(h);
    if (maxchars < 1) return lines;
    lines = this.randomizeChars(lines, chars, maxchars);
    return lines;
  }

  // replace @count number of random indexes in @lines
  // with random character from @chars
  //
  // optional @filler array lets us replace a char only if it's in array
  randomizeChars(lines, chars, count) {
    for (let i = 0; i < count; i++) {
      let rnd = this.random(lines.length);
      let chr = lines.charAt(rnd);
      if (chr === '\n') continue;
      let newChr = this.randomChar(chars);
      lines = this.replaceCharAt(lines, rnd, newChr);
    }
    return lines;
  }

  replaceCharAt(str, i, replace) {
    return str.substr(0, i) + replace + str.substr(i + 1);
  }

  // return random character from @str
  randomChar(str) {
    return str.charAt(this.random(str.length));
  }

  random(min, max) {
    if (max === undefined) return Math.floor(Math.random() * min) + 0;
    return Math.floor(Math.random() * max) + min;
  }

}
