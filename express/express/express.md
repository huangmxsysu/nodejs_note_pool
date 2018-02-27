- lib/
    - middleware/
        - init.js
        - query.js
    - router/
        - index.js
        - layer.js
        - route.js
    - application.js
    - express.js
    - request.js
    - response.js
    - utils.js
    - view.js
- index.js


Router其实是一个二维的结构。例如，一个可能的router.stack结构如下所示：
```js
----------------
|    layer1    |
----------------
        ↓
---------------- layer2.route.stack  ------------   ------------   ------------
|    layer2    | ------------------> | layer2-1 |-->| layer2-2 |-->| layer2-3 |
----------------                     ------------   ------------   ------------
        ↓
---------------- layer3.route.stack  ------------   ------------
|    layer3    | ------------------> | layer3-1 |-->| layer3-2 |
----------------                     ------------   ------------
        ↓
----------------
|    ......    |
----------------
        ↓
----------------
|    layerN    |
----------------
```