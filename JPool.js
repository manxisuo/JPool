(function() {
    const INITIAL = 0;
    const RUNNING = 1;
    
    var inDebugMode = false;
 
    function JTPool(maxThread) {
        this.status = INITIAL;
        this.workQueue = []; // workQueue = [{id: xx, task: xx}]
        this.max = (undefined == maxThread) ? 3 : maxThread;
        this.current = 0;
    }
    
    /**
     * 获取一个单线程的线程池实例。
     * 等价于 new JTPool(1)
     */
    JTPool.singleThreadPool = function() {
        return new JTPool(1);
    }
 
    JTPool.toString = function() {
        return "[A JavaScript Thread Pool]";
    }
    
    /**
     * 添加一个任务。
     *
     * @param task 任务。类型为函数，并且带一个callback回调函数作为参数。
     *             任务必须在完成时调用callback函数。
     *             形式为：task = function(callback) {...}
     * @return 任务ID。
     */
    JTPool.prototype.addTask = function(task) {
        if (undefined == task || typeof task != 'function' || task.length < 1) {
            throw Error('Must be a function with a callback parameter. e.g. function(callback) {...}');
        }
    
        var timestamp = _getTimestamp();
        this.workQueue.push({'id': timestamp, 'task': task});
        
        if (RUNNING == this.status && this.current < this.max) {
            this._check();
        }
        
        return timestamp;
    }
    
    /**
     * 删除一个尚未执行的任务。
     *
     * @param id 任务的ID
     */
    JTPool.prototype.removeTask = function(id) {
        for (var i in this.workQueue) {
            if (this.workQueue[i].id == id) {
                this.workQueue.splice(i, 1);
                break;
            }
        }
    }
    
    /**
     * 清空线程池中的所有(未完成)任务。
     */
    JTPool.prototype.clear = function() {
        this.workQueue = [];
    }
 
    /**
     * 启动线程池。
     */
    JTPool.prototype.start = function() {
        if (INITIAL == this.status) {
            this.status = RUNNING;
            this._check();
        }
    }
    
    /**
     * 停止线程池。
     * 1. 调用此函数时，正在执行的线程会继续执行。
     * 2. 停止后可以调start方法重新启动。
     */
    JTPool.prototype.stop = function() {
        if (RUNNING == this.status) {
            this.status = INITIAL;
        }
    }
    
    JTPool.prototype._notifyComplete = function() {
        this.current --;
        this._check();
    }
    
    JTPool.prototype._check = function() {
        var work;
        while(RUNNING == this.status && this.current < this.max) {
            work = this.workQueue.shift();
            if (undefined != work) {
                this.current ++;
                this._executeTask(work);
            }
            else {
                break;
            }
        }
    }
    
    JTPool.prototype._executeTask = function(work) {
 
        var _this = this;
        var task = work.task;
        var id = work.id;
        
        _log('Start  Task: ' + id);
        
        task(function() {
            _log('Finish Task: ' + id);
            
            _this._notifyComplete();
        });
    }
    
    /**
     * 让某个线程睡眠一段时间。
     * 一般只在单线程池(max == 1)时有实际作用。
     *
     * @param timeInMillionSecond 睡眠时间。单位：毫秒。
     */
    JTPool.prototype.sleep = function(timeInMillionSecond) {
        var task = function(callback) {
            setTimeout(function() {
                callback();
            }, timeInMillionSecond);
        };
        
        this.addTask(task);
    }
    
    /**
     * 是否开启日志。
     *
     * @param open 布尔型。true：开启；false：关闭。不传时为开启。
     */
    JTPool.prototype.openLog = function(open) {
        if (undefined == open || open) {
            inDebugMode = true;
        }
        else {
            inDebugMode = false;
        }
    }
    
    function _getTimestamp() {
        return new Date().getTime();
    }
    
    function _log(msg) {
        if (inDebugMode) {
            console.log(msg);
        }
    }
    
    window.JTPool = JTPool;
    
})(window);
