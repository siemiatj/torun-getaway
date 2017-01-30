//=========================================================================
// minimalist DOM helpers
//=========================================================================

class Dom {
  constructor() {
    this.storage = window.localStorage || {};
  }

  get(id) {
    return ((id instanceof HTMLElement) || (id === document)) ? id : document.getElementById(id);
  }

  set(id, html) {
    this.get(id).innerHTML = html;
  }

  on(ele, type, fn, capture) {
    this.get(ele).addEventListener(type, fn, capture);
  }

  un(ele, type, fn, capture) {
    this.get(ele).removeEventListener(type, fn, capture);
  }

  show(ele, type) {
    this.get(ele).style.display = (type || 'block');
  }

  blur(ev) {
    ev.target.blur();
  }

  addClassName(ele, name) {
    this.toggleClassName(ele, name, true);
  }

  removeClassName(ele, name) {
    this.toggleClassName(ele, name, false);
  }

  toggleClassName(ele, name, on) {
    ele = this.get(ele);
    var classes = ele.className.split(' ');
    var n = classes.indexOf(name);
    on = (typeof on == 'undefined') ? (n < 0) : on;
    if (on && (n < 0))
      classes.push(name);
    else if (!on && (n >= 0))
      classes.splice(n, 1);
    ele.className = classes.join(' ');
  }
}
let dom = new Dom();

export default dom;
