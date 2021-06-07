"use strict";

import appconfig from '../app.config.json';

class UIConfig {
  _objects = new Map();
  constructor() {
    for (const obj of appconfig) {
      this._objects.set(obj.value, obj);
    }
  }

  _names = new Map();
  getName(objname) {
    if (!this._names.has(objname)) {
      let name = ''
      const obj = this._objects.get(objname)
      if (obj && obj.text) {
        name = obj.text
      }
      this._names.set(objname, name)
    }
    return this._names.get(objname)
  }

  _menus = [];
  getMenus() {
    if (this._menus.length == 0) {
      this._menus.push({ icon: "mdi-view-dashboard", title: "홈", to: "/" });
      for (const val of this._objects.values()) {
        if (val.type == 'master') {
          this._menus.push({ icon: val.icon, title: val.text, to: `/${val.value}/List` });
        }
      }
    }
    return this._menus;
  }

  _visibles = new Map();
  getVisible(objname) {
    if (!this._visibles.has(objname)) {
      let vread = 'group'
      const obj = this._objects.get(objname)
      if (obj && obj.visiblity) {
        vread = obj.visiblity.read
      }
      const visible = []
      if (vread == 'owner' || vread == 'group' || vread == 'all') { visible.push({ value: "owner", text: `나의${obj.text}` }) }
      if (vread == 'group' || vread == 'all') { visible.push({ value: "group", text: `그룹의${obj.text}` }) }
      if (vread == 'all') { visible.push({ value: "all", text: `모든${obj.text}` }) }
      this._visibles.set(objname, visible)
    }
    return this._visibles.get(objname)
  }

  _listheaders = new Map();
  getListHeaders(objname) {
    if (!this._listheaders.has(objname)) {
      const header = []
      const obj = this._objects.get(objname)
      if (obj && obj.fields && obj.fields.length > 0) {
        const flds = obj.fields
        for (const i in flds) {
          if (flds[i].summary) {
            header.push(flds[i])
          }
        }
        header.push({ text: "Action", align: "start", value: "actions", sortable: false })
      }
      this._listheaders.set(objname, header)
    }
    return this._listheaders.get(objname)
  }

  _layouts = new Map();
  getLayout(objname) {
    if (!this._layouts.has(objname)) {
      const obj = this._objects.get(objname)
      if (obj && obj.fields) {
        this._layouts.set(objname, obj.fields)
      } else {
        this._layouts.set(objname, [])
      }
    }
    return this._layouts.get(objname)
  }

  _references = new Map();
  getReference(objname) {
    if (!this._references.has(objname)) {
      const obj = this._objects.get(objname)
      if (obj && obj.reference) {
        this._references.set(objname, obj.reference)
      } else {
        this._references.set(objname, [])
      }
    }
    return this._references.get(objname)
  }

  _children = new Map();
  getChildren(objname) {
    if (!this._children.has(objname)) {
      const obj = this._objects.get(objname)
      if (obj && obj.children) {
        this._children.set(objname, obj.children)
      } else {
        this._children.set(objname, [])
      }
    }
    return this._children.get(objname)
  }
}

const _uiconfig = new UIConfig();

export default {
  install: (Vue) => {
    Vue.uiconfig = _uiconfig;
    window.uiconfig = _uiconfig;

    Object.defineProperties(Vue.prototype, {
      uiconfig: {
        get() {
          return _uiconfig;
        }
      },
      $uiconfig: {
        get() {
          return _uiconfig;
        }
      },
    })
  }
}
