class Vue {
    constructor(options) {
        // 将data赋值到_data中
        this._data = options.data
        // 数据代理(实际上data是个函数，需要将返回值代理到vm自身上)
        // initProxy.call(this, options.data)
        // 数据劫持
        observer(options.data)
        // 创建观察者, 在beforeMount和Mounted中间去实例化，传入update方法，接收render函数，在数据变更时执行render
        const watcher = new Watcher(this, render)
    }
}

// 数据劫持
function observer(obj) {
    Object.keys(obj).forEach(key => defineReactive(obj, key, obj[key]))
}

// 具体劫持方法
function defineReactive(target, key, val) {
    const dep = new Dep()
    // 普通对象是直接劫持，对象中有对象属性，会对子对象进行劫持，数组类型是遍历每个元素进行劫持
    Object.defineProperty(target, key, {
        enumerable: true,
        configurable: true,
        getters() {
            if (watcher) dep.addSubs(watcher)
            return val
        },
        setter(newVal) {
            target[key] = newVal
            dep.notify()
        }
    })
}

// 数据代理，data中数据变更后，会触发_data改变
function initProxy(data) {
    const _this = this
    Object.keys(data).forEach( key => {
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            getters() {
                return _this._data[key]
            },
            setter(newVal) {
                _this._data[key] = newVal
            }
        })
    })
}

// 收集依赖类Dep, 主要是在数据变更时，去通知所有watcher更新
class Dep {
    subs = [] // watcher实例，一个组件只有一个watcher实例
    constructor() {
        this.subs = []
    }

    addSubs(watcher) {
        this.subs.push(watcher)
    }

    removeSub(watcher) {
        remove(this.subs, watcher)
    }

    notify() {
        // 通知wathcer去更新
        this.subs.forEach(watcher => {
            watcher.update()
        })
    }
}


function remove(arr, ele) {
    const index = arr.indexOf(ele)
    if (index > -1) {
        arr.splice(index)
    }
}

// 观察者：观察整个vue实例，更新视图，就是Vue.watch $watch方法的构造函数，观察的不仅仅是data属性, 还有computed，props，inject、provider提供的属性值
class Watcher {
    vm = null
    deps = []
    updateFn = function() {}
    constructor(vm, expOrFn, cb , options) {
        // 将Dep.target的静态属性指向watcher
        Dep.target = this
        this.vm = vm
        // 第一次render渲染
        cb.call(this.vm)
        this.updateFn = cb
    }
    
    // 添加订阅，订阅dep,一边在某些时刻为自身添加依赖收集Dep，并删除
    addDep(dep) {
        this.deps.push(dep)
    }

    removeDep() {
        Dep.target = null
    }

    update() {
        this.updateFn.call(this.vm)
    }
}


// 修饰符处理了很多dom事件的细节，让开发者只关注业务逻辑本身，不必再处理烦恼的事