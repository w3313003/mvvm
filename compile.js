class Compile {
    constructor(el, vm) {
        // vm mvvm的实例
        this.$vm = vm;
        // el为 DOM对象 或者 class类名
        this.$el = this.isElementNode(el) ? el : document.querySelector(el);
        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el);
            this.init();
            this.$el.appendChild(this.$fragment)
        }
    }
    init() {
        this.compileElement(this.$fragment);
    }
    isElementNode(node) {
        return node.nodeType === 1;
    }
    isTextNode(node) {
        return node.nodeType == 3;
    }
    isEventDirective(attr) {
        return attr.indexOf('on') === 0;
    }
    isDirective(attr) {
            return attr.indexOf('v-') == 0;
        }
        // 返回文档碎片
    node2Fragment(el) {
        let fragment = document.createDocumentFragment(),
            child;
        // 不断把el的第一个子元素转移到文档碎片中
        while (el.firstChild) {
            child = el.firstChild;
            fragment.appendChild(child);
        }
        return fragment;
    }
    compileElement(el) {
        var childNodes = el.childNodes;
        [...childNodes].forEach(node => {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;

            if (this.isElementNode(node)) {
                this.compile(node);

            } else if (this.isTextNode(node) && reg.test(text)) {
                this.compileText(node, RegExp.$1);
            }

            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node);
            }
        });
    }
    compile(node) {
        let attr = node.attributes;
        [...attr].forEach(attr => {
            let attrName = attr.name;
            if (this.isDirective(attrName)) {
                var exp = attr.value;
                // 如v-text 取text
                var dir = attrName.substring(2);
                // 事件指令 需v-on:格式
                if (this.isEventDirective(dir)) {
                    commond.eventHandler(node, this.$vm, exp, dir);
                } else {
                    // 普通指令 v-text 类
                    if (commond[dir]) {
                        commond[dir](node, this.$vm, exp);
                    }
                }
                node.removeAttribute(attrName)
            }
        })
    }
    compileText(node, exp) {
        commond.text(node, this.$vm, exp);
    }
}

// 指令处理
let commond = {
    text(node, vm, exp) {
        this.bind(node, vm, exp, 'text')
    },
    html(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },
    model(node, vm, exp) {
        this.bind(node, vm, exp, 'model');
        let val = this._getVmVal(vm, exp);
        node.addEventListener('input', e => {
            if (val === e.target.value) {
                return;
            };
            this._setVmVal(vm, exp, e.target.value);
        })
    },
    class(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    bind(node, vm, exp, name) {
        let updaterFn = update[`${name}Updater`];
        if (updaterFn) {
            updaterFn(node, this._getVmVal(vm, exp));
        }
        new Watcher(vm, exp, (value, oldValue) => {
            if (updaterFn) {
                updaterFn(node, value, oldValue);
            }
        });
    },
    // 事件处理
    eventHandler(node, vm, exp, attrname) {
        // 取 v-on:sth 的sth
        let eventType = attrname.split(':')[1];
        //exp事件函数名 
        if (vm.$config.methods) {
            fn = vm.$config.methods[exp]
        };
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    _getVmVal(vm, exp) {
        // vm：mvvm的实例对象 exp：属性的value
        // 把属性值转换为数组
        exp.split('.').forEach(v => {
            // 实例化的时候value已经有了属性;
            // 如果exp为child.sth类型 则取子对象的值
            //  有多项 如child.sth={name : 123} 第一次赋值实际上是 value = value[child] value={name:123}; 以此类推
            vm = vm[v]
        });
        return vm;
    },
    _setVmVal(vm, exp, newvalue) {
        exp.split('.').forEach((v, i) => {
            // 菲最后一位
            if (i < exp.split('.').length - 1) {
                vm = vm[v];
            } else {
                vm[v] = newvalue;
            }
        })
    }
}

// 视图更新
let update = {
    textUpdater(node, val) {
        node.textContent = typeof val == 'undefined' ? '' : val;
    },
    htmlUpdater(node, val) {
        node.innerHTML = typeof val == 'undefined' ? '' : val;
    },
    classUpdater(node, val, oldval) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');
        var space = className && String(value) ? ' ' : '';
        node.className = className + space + value;
    },
    modelUpdater(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
}