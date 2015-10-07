# 打印日志
_log = ->
  if logOpen and console? and console.log?
    Function::apply.call　console.log, console, arguments

INITIAL = 0 # 线程池状态：初始
RUNNING = 1 # 线程池状态：运行
logOpen = false # 是否开启日志

# 线程池类
class JPool

  # 构造函数
  # @param max 最大线程数
  constructor: (@max = 3) ->
    @status = INITIAL
    @current = 0
    @queue = [] # queue = [{id: xx, taskFn: xx}]

  # 获取一个单线程的线程池实例
  # 等价于`new JPool(1)`
  @singleThreadPool: ->
    new JPool 1

  @toString: ->
    '[A JavaScript Thread Pool]'

  # 开启日志
  # @param open true：开启；false：关闭。默认true。
  @openLog = (open = true) ->
    logOpen = open

  # 添加一个任务
  # @param taskFn 任务。类型为函数，并且带一个callback回调函数作为参数。
  # 例如：function(callback) {...}
  # 任务必须在完成时调用callback函数。
  # @return 任务ID
  addTask: (taskFn) ->
    if not taskFn? or typeof taskFn isnt 'function'
      throw new Error 'Must be a function with a callback parameter. e.g. function(cb) {...}'

    id = +new Date
    @queue.push {id, taskFn}
    if @status is RUNNING and @current < @max
      @_check()
    id

  # 删除一个尚未执行的任务
  # @param id 任务的ID
  removeTask: (id) ->
    for item, i in @queue
      if item.id == id
        @queue.splice i 1
        break
    id

  # 清空线程池中的所有(尚未执行)的任务
  clear: ->
    @queue.length = 0
    return

  # 启动线程池
  start: ->
    if @status is INITIAL
      @status = RUNNING
      @_check()
      return

  # 停止线程池
  # 1. 调用此函数时，正在执行的线程会继续执行。
  # 2. 停止后可以调start方法重新启动。
  stop: ->
    if @status is RUNNING
      @status = INITIAL
      return

  # 让某个线程睡眠一段时间
  # 一般只在单线程池(max == 1)时有实际作用。
  # @param timeInMS 睡眠时间(毫秒)，默认1000毫秒。
  sleep: (timeInMS = 1000) ->
    @addTask (cb) ->
      setTimeout cb, timeInMS

  _notifyComplete: ->
    @current--
    @_check()

  _check: ->
    while @status is RUNNING and @current < @max
      task = @queue.shift()
      if task?
        @current++
        @_executeTask task
      else
        break
    return

  _executeTask: (task) ->
    _log "Start  Task: #{task.id}"
    task.taskFn =>
      _log "Finish Task: #{task.id}"
      @_notifyComplete()

window.JPool = JPool
