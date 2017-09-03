function observer(data) {
    if (!data || typeof data !== 'object') return;
    return new Observe(data);
}

class Observe {
    constructor(data) {
        this.data = data;
        this.walk(data)
    }
    walk(data) {
        Object.keys(data).forEach(v => {
            this.define(data, v, data[v])
        })
    }
    define(data, key, val) {
        var dep = new Dep;
        var child = observer(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get() {
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set(newv) {
                if (newv === val) return;
                val = newv;
                child = observer(val);
                dep.notify();
            }
        })
    }
}
var uid = 0;
class Dep {
    constructor() {
        this.id = uid++;
        this.subs = [];
    }
    addSub(sub) {
        this.subs.push(sub)
    }
    depend() {
        Dep.target.addDep(this); //指向实例
    }
    removeSub(sub) {
        const index = this.subs.indexOf(sub);
        if (index !== -1) {
            this.subs.splice(index, 1)
        }
    }
    notify() {
        this.subs.forEach(v => {
            v.update();
        })
    }
}
Dep.target = null;