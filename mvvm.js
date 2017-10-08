class MVVM {
    constructor(config = {}) {
        this.$config = config;
        let data = this._data = this.$config.data 
        Object.keys(data).forEach(v => {
            this._proxyData(v);
        });
        this._initComputed();
        observer(data);
        this.$compile = new Compile(config.el || document.body, this)
    }
    watch(key, cb) {
        new Watcher(this, key, cb)
    }
    // 数据代理 把this.data.sth 转换为this.sth
    _proxyData(key, set, get) {
        set = set ||
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: true,
                get: () => {
                    return this._data[key];
                },
                set: NV => {
                    this._data[key] = NV
                }
            })
    }
    _initComputed() {
        let computed = this.$config.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(v => {
                Object.defineProperty(this, v, {
                    get: typeof computed[v] === 'function' ?
                        computed[v] : computed[v].get,
                })
            })
        }
    }
}
