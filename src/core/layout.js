var Layout = kity.createClass('Layout', {
    doLayout: function(node) {
        throw new Error('Not Implement: Layout.doLayout()');
    },

    getBranchBox: function(nodes) {
        var box = {
            x: 0,
            y: 0,
            height: 0,
            width: 0
        };
        var g = KityMinder.Geometry;
        var i, node, matrix, contentBox;
        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            matrix = node.getLayoutTransform();
            contentBox = node.getContentBox();
            box = g.mergeBox(box, matrix.transformBox(contentBox));
        }

        return box;
    },

    getTreeBox: function(nodes) {
        var box = {
            x: 0,
            y: 0,
            height: 0,
            width: 0
        };
        var g = KityMinder.Geometry;
        var i, node, matrix, treeBox;
        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            matrix = node.getLayoutTransform();

            treeBox = node.getContentBox();

            if (node.children.length) {
                treeBox = g.mergeBox(treeBox, this.getTreeBox(node.children));
            }

            box = g.mergeBox(box, matrix.transformBox(treeBox));
        }
        return box;
    }
});

Utils.extend(KityMinder, {
    _layout: {},

    registerLayout: function(name, layout) {
        KityMinder._layout[name] = layout;
        if (!KityMinder._defaultLayout) {
            KityMinder._defaultLayout = name;
        }
    }
});

kity.extendClass(MinderNode, {
    getLayout: function() {
        var layout = this.getData('layout');

        layout = layout || (this.isRoot() ? KityMinder._defaultLayout : this.parent.getLayout());

        return layout;
    },

    setLayoutTransform: function(matrix) {
        this._layoutTransform = matrix;
    },

    getLayoutTransform: function() {
        return this._layoutTransform || new kity.Matrix();
    },

    setLayoutVector: function(vector) {
        this._layoutVector = vector;
        return this;
    },

    getLayoutVector: function(vector) {
        return this._layoutVector || new kity.Vector();
    },

    getLayoutBox: function() {
        var matrix = this._lastLayoutTransform || new kity.Matrix();
        return matrix.transformBox(this.getContentBox());
    },

    getLayoutPoint: function() {
        var matrix = this._lastLayoutTransform || new kity.Matrix();
        return matrix.transformPoint(new kity.Point());
    },

    getLayoutOffset: function() {
        var data = this.getData('layoutOffset');
        if (data) return new kity.Point(data.x, data.y);
        return new kity.Point();
    },

    setLayoutOffset: function(p) {
        this.setData('layoutOffset', {
            x: p.x,
            y: p.y
        });
    },

    getLayoutRoot: function() {
        if (this.isLayoutRoot()) {
            return this;
        }
        return this.parent.getLayoutRoot();
    },

    isLayoutRoot: function() {
        return this.getData('layout') || this.isRoot();
    },

    layout: function(name, duration) {
        if (name) {
            if (name == 'inherit') {
                this.setData('layout');
            } else {
                this.setData('layout', name);
            }
        }

        this.getMinder().layout(duration);

        return this;
    }
});

kity.extendClass(Minder, {

    layout: function(duration) {

        this.getRoot().traverse(function(node) {
            node.setLayoutTransform(null);
        });

        function layoutNode(node) {

            // layout all children first
            node.children.forEach(function(child) {
                layoutNode(child);
            });

            var LayoutClass = KityMinder._layout[node.getLayout()];
            var layout = new LayoutClass();

            layout.doLayout(node);
        }

        layoutNode(this.getRoot());

        return this.applyLayoutResult(duration);
    },

    applyLayoutResult: function(duration) {
        var root = this.getRoot();
        var me = this;

        function apply(node, pMatrix) {
            var matrix = node.getLayoutTransform().merge(pMatrix);
            var lastMatrix = node._lastLayoutTransform || new kity.Matrix();

            if (!matrix.equals(lastMatrix) || true) {

                // 如果当前有动画，停止动画
                if (node._layoutTimeline) {
                    node._layoutTimeline.stop();
                    delete node._layoutTimeline;
                }

                // 如果要求以动画形式来更新，创建动画
                if (duration > 0) {
                    node._layoutTimeline = new kity.Animator(lastMatrix, matrix, function(node, value) {
                        node.getRenderContainer().setMatrix(node._lastLayoutTransform = value);
                        me.fire('layoutapply', {
                            node: node,
                            matrix: value
                        });
                    }).start(node, duration, 'ease');
                }

                // 否则直接更新
                else {
                    node.getRenderContainer().setMatrix(matrix);
                    node._lastLayoutTransform = matrix;
                    me.fire('layoutapply', {
                        node: node,
                        matrix: matrix
                    });
                }
            }

            for (var i = 0; i < node.children.length; i++) {
                apply(node.children[i], matrix);
            }
        }

        apply(root, new kity.Matrix());
        this.fire('layout');
        return this;
    },
});