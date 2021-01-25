'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CodeTypeChooser = function (_React$Component) {
    _inherits(CodeTypeChooser, _React$Component);

    function CodeTypeChooser(props) {
        _classCallCheck(this, CodeTypeChooser);

        var _this = _possibleConstructorReturn(this, (CodeTypeChooser.__proto__ || Object.getPrototypeOf(CodeTypeChooser)).call(this, props));

        _this.options = ['semaphore', 'braille', 'morse', 'amino'];
        return _this;
    }

    _createClass(CodeTypeChooser, [{
        key: 'render',
        value: function render() {
            var _this2 = this;

            return React.createElement(
                'div',
                { className: 'code-type-chooser' },
                this.options.map(function (option) {
                    return React.createElement(
                        'button',
                        { className: 'selectCodeBtn ' + option + '-border' + (option == _this2.props.selected ? ' selected' : ''),
                            key: option,
                            onClick: function onClick() {
                                _this2.props.callback(option);
                            } },
                        option
                    );
                })
            );
        }
    }]);

    return CodeTypeChooser;
}(React.Component);

var semaphoreBitsToChar = "   W J#  YU T    RQ P   O        ML K   I       H                FE D   C       B               A                                ZX V           S               N                               G                                                               ";
var semaphoreToCharMap = {};
for (var i = 0; i < semaphoreBitsToChar.length; ++i) {
    semaphoreToCharMap[i] = semaphoreBitsToChar[i];
}

var BRAILLE_BOX_WIDTH = 150;

var SEMAPHORE_CANVAS_SIZE = 200;
var SCALE = SEMAPHORE_CANVAS_SIZE / 100;

var SemaphoreBox = function (_React$Component2) {
    _inherits(SemaphoreBox, _React$Component2);

    function SemaphoreBox(props) {
        _classCallCheck(this, SemaphoreBox);

        var _this3 = _possibleConstructorReturn(this, (SemaphoreBox.__proto__ || Object.getPrototypeOf(SemaphoreBox)).call(this, props));

        _this3.canvasRef = React.createRef();
        _this3.state = { bits: _this3.props.bits };
        return _this3;
    }

    _createClass(SemaphoreBox, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            this.redraw();
        }
    }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate(prevProps, prevState) {
            if (prevState.bits != this.state.bits) {
                this.props.changeStateCallback(this.state.bits);
            }
        }
    }, {
        key: 'redraw',
        value: function redraw() {
            this.drawBack(this.canvasRef.current);
            this.drawSem(this.canvasRef.current);
        }
    }, {
        key: 'drawBack',
        value: function drawBack(canvas) {
            var pts = [[90, 50], [78, 22], [50, 10], [22, 22], [10, 50], [22, 78], [50, 90], [78, 78]];
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 100 * SCALE, 100 * SCALE);
            ctx.beginPath();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = pts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var coord = _step.value;

                    ctx.moveTo(50 * SCALE, 50 * SCALE);
                    ctx.lineTo(coord[0] * SCALE, coord[1] * SCALE);
                    ctx.strokeStyle = '#c9c9c9';
                    ctx.lineWidth = 3;
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            ctx.stroke();
        }
    }, {
        key: 'drawSem',
        value: function drawSem(canvas) {
            var ctx = canvas.getContext('2d');
            var pts = [[90, 50], [78, 22], [50, 10], [22, 22], [10, 50], [22, 78], [50, 90], [78, 78]];
            ctx.beginPath();
            for (var i = 0; i < 8; i++) {
                if (this.state.bits & 1 << i) {
                    ctx.moveTo(50 * SCALE, 50 * SCALE);
                    ctx.lineTo(pts[i][0] * SCALE, pts[i][1] * SCALE);
                }
            }
            ctx.strokeStyle = "red";
            ctx.lineWidth = 6;
            ctx.stroke();
        }
    }, {
        key: 'bitCount',
        value: function bitCount(n) {
            n = n - (n >> 1 & 0x55555555);
            n = (n & 0x33333333) + (n >> 2 & 0x33333333);
            return (n + (n >> 4) & 0xF0F0F0F) * 0x1010101 >> 24;
        }
    }, {
        key: 'clickBox',
        value: function clickBox(ev) {
            var _this4 = this;

            var dx = ev.nativeEvent.offsetX - 50 * SCALE;
            var dy = ev.nativeEvent.offsetY - 50 * SCALE;
            var r = dx * dx + dy * dy;
            if (r < 4 || r > SEMAPHORE_CANVAS_SIZE * SEMAPHORE_CANVAS_SIZE / 2) {
                return;
            }
            var ang = Math.atan2(-dy, dx) * 4 / Math.PI;
            var angr = Math.round(ang);
            if (angr < 0) {
                angr += 8;
            }
            this.setState(function (state, props) {
                var nextValue = state.bits ^ 1 << angr;
                return { bits: _this4.bitCount(nextValue) <= 2 ? nextValue : 1 << angr };
            });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this5 = this;

            return React.createElement(
                'div',
                { className: 'code-box' },
                React.createElement(
                    'div',
                    null,
                    React.createElement('canvas', { width: SEMAPHORE_CANVAS_SIZE,
                        height: SEMAPHORE_CANVAS_SIZE,
                        ref: this.canvasRef,
                        onClick: function onClick(e) {
                            return _this5.clickBox(e);
                        } })
                )
            );
        }
    }]);

    return SemaphoreBox;
}(React.Component);

var brailleBitsToChar = " A C BIF E D HJG K M LSP O N RTQ              W  U X V   Z Y     ";
var brailleToCharMap = {};
for (var _i = 0; _i < brailleBitsToChar.length; ++_i) {
    brailleToCharMap[_i] = brailleBitsToChar[_i];
}

var BrailleBox = function (_React$Component3) {
    _inherits(BrailleBox, _React$Component3);

    function BrailleBox(props) {
        _classCallCheck(this, BrailleBox);

        var _this6 = _possibleConstructorReturn(this, (BrailleBox.__proto__ || Object.getPrototypeOf(BrailleBox)).call(this, props));

        _this6.state = { bits: _this6.props.bits };
        _this6.canvasRef = React.createRef();
        return _this6;
    }

    _createClass(BrailleBox, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            this.redraw();
        }
    }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate(prevProps, prevState) {
            if (prevState.bits != this.state.bits) {
                this.props.changeStateCallback(this.state.bits);
            }
        }
    }, {
        key: 'redraw',
        value: function redraw() {
            this.draw(this.canvasRef.current);
        }
    }, {
        key: 'draw',
        value: function draw(canvas) {
            var xOffset = 24;
            var pts = [[xOffset, 15], [100 - xOffset, 15], [xOffset, 50], [100 - xOffset, 50], [xOffset, 85], [100 - xOffset, 85]];
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 100 * SCALE, 100 * SCALE);
            for (var _i2 = 0; _i2 < pts.length; ++_i2) {
                ctx.beginPath();
                ctx.arc(pts[_i2][0] / 100 * BRAILLE_BOX_WIDTH, pts[_i2][1] * SCALE, 10 * SCALE, 0, 2 * Math.PI, false);
                if (this.state.bits & 1 << _i2) {
                    ctx.fillStyle = '#5555FF';
                    ctx.fill();
                }
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#333333';
                ctx.stroke();
            }
        }
    }, {
        key: 'clickBox',
        value: function clickBox(ev) {
            var dx = ev.nativeEvent.offsetX - BRAILLE_BOX_WIDTH / 2;
            var dy = ev.nativeEvent.offsetY;

            var angr = dx < 0 ? 0 : 1;
            if (dy < SEMAPHORE_CANVAS_SIZE / 3) {
                angr += 0;
            } else if (dy < 2 * SEMAPHORE_CANVAS_SIZE / 3) {
                angr += 2;
            } else {
                angr += 4;
            }
            this.setState(function (state, props) {
                return { bits: state.bits ^ 1 << angr };
            });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this7 = this;

            return React.createElement(
                'div',
                { className: 'code-box' },
                React.createElement(
                    'div',
                    null,
                    React.createElement('canvas', { width: BRAILLE_BOX_WIDTH,
                        height: SEMAPHORE_CANVAS_SIZE,
                        ref: this.canvasRef,
                        onClick: function onClick(e) {
                            return _this7.clickBox(e);
                        } })
                )
            );
        }
    }]);

    return BrailleBox;
}(React.Component);

var morseBitsToChar = '  ETIANMSURWDKGOHVF L PJBXCYZQ  54 3   2       16       7   8 90';
var morseToCharMap = {};
for (var _i3 = 0; _i3 < morseBitsToChar.length; ++_i3) {
    morseToCharMap[_i3] = morseBitsToChar[_i3];
}

var MorseBox = function (_React$Component4) {
    _inherits(MorseBox, _React$Component4);

    function MorseBox(props) {
        _classCallCheck(this, MorseBox);

        var _this8 = _possibleConstructorReturn(this, (MorseBox.__proto__ || Object.getPrototypeOf(MorseBox)).call(this, props));

        _this8.state = { bits: _this8.props.bits, advancing: 0 };
        _this8.canvasRef = React.createRef();

        _this8.onChange = _this8.onChange.bind(_this8);
        _this8.onKeyDown = _this8.onKeyDown.bind(_this8);
        _this8.textRef = React.createRef();
        return _this8;
    }

    _createClass(MorseBox, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            if (this.props.focused) {
                this.textRef.current.focus();
            }
        }
    }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate(prevProps, prevState) {
            var _state = this.state,
                bits = _state.bits,
                advancing = _state.advancing;

            if (prevState.bits != bits) {
                this.props.changeStateCallback(bits);
            }
            if (advancing != 0 && prevState.advancing == 0) {
                this.props.advanceTextFocusCallback(advancing);
            }
        }
    }, {
        key: 'getMorse',
        value: function getMorse() {
            var s = '';

            var tripped = false;
            for (var _i4 = 5; _i4 >= 0; --_i4) {
                var isOne = this.state.bits & 1 << _i4;
                if (!tripped) {
                    if (isOne) {
                        tripped = true;
                    }
                } else {
                    s += isOne ? '-' : '.';
                }
            }

            return s;
        }
    }, {
        key: 'onChange',
        value: function onChange(text) {
            var leftSideRegex = /[qwertasdfgzxcvbQWERTASDFGZXCVB12345]/g;
            var rightSideRegex = /[yuiophjkl;nm,\/YUIOPHJKL:'"NM<>\?67890=]/g;
            var sanitizedText = text.target.value.replace(leftSideRegex, '.').replace(rightSideRegex, '-').replace(/[^\.\-]/g, '');
            var bits = 1;
            for (var _i5 = Math.max(0, sanitizedText.length - 5); _i5 < sanitizedText.length; ++_i5) {
                bits = 2 * bits + (sanitizedText.charAt(_i5) == '-' ? 1 : 0);
            }
            if (text.target.value.endsWith(' ') || sanitizedText.length >= 5) {
                this.setState({ bits: bits, advancing: 1 });
            } else {
                this.setState({ bits: bits });
            }
        }
    }, {
        key: 'onKeyDown',
        value: function onKeyDown(e) {
            if (e.keyCode == 8 && this.state.bits == 1) {
                this.setState({ advancing: -1 });
            }
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { className: 'code-box' },
                React.createElement(
                    'div',
                    null,
                    React.createElement('input', { type: 'text',
                        ref: this.textRef,
                        value: this.getMorse(),
                        onChange: this.onChange,
                        onKeyDown: this.onKeyDown,
                        onFocus: this.props.acquireFocusCallback,
                        className: 'code-input-text'
                    })
                )
            );
        }
    }]);

    return MorseBox;
}(React.Component);

var aminoToCharMap = {
    'aaa': 'K',
    'aac': 'N',
    'aag': 'K',
    'aat': 'N',
    'aca': 'T',
    'acc': 'T',
    'acg': 'T',
    'act': 'T',
    'aga': 'R',
    'agc': 'S',
    'agg': 'R',
    'agt': 'S',
    'ata': 'I',
    'atc': 'I',
    'atg': 'M',
    'att': 'I',
    'caa': 'Q',
    'cac': 'H',
    'cag': 'Q',
    'cat': 'H',
    'cca': 'P',
    'ccc': 'P',
    'ccg': 'P',
    'cct': 'P',
    'cga': 'R',
    'cgc': 'R',
    'cgg': 'R',
    'cgt': 'R',
    'cta': 'L',
    'ctc': 'L',
    'ctg': 'L',
    'ctt': 'L',
    'gaa': 'E',
    'gac': 'D',
    'gag': 'E',
    'gat': 'D',
    'gca': 'A',
    'gcc': 'A',
    'gcg': 'A',
    'gct': 'A',
    'gga': 'G',
    'ggc': 'G',
    'ggg': 'G',
    'ggt': 'G',
    'gta': 'V',
    'gtc': 'V',
    'gtg': 'V',
    'gtt': 'V',
    'taa': '#',
    'tac': 'Y',
    'tag': '#',
    'tat': 'Y',
    'tca': 'S',
    'tcc': 'S',
    'tcg': 'S',
    'tct': 'S',
    'tga': '#',
    'tgc': 'C',
    'tgg': 'W',
    'tgt': 'C',
    'tta': 'L',
    'ttc': 'F',
    'ttg': 'L',
    'ttt': 'F',
    'ala': 'A',
    'cys': 'C',
    'asp': 'D',
    'glu': 'E',
    'phe': 'F',
    'gly': 'G',
    'his': 'H',
    'ile': 'I',
    'lys': 'K',
    'leu': 'L',
    'met': 'M',
    'asn': 'N',
    'pro': 'P',
    'gln': 'Q',
    'arg': 'R',
    'ser': 'S',
    'thr': 'T',
    'val': 'V',
    'trp': 'W',
    'tyr': 'Y',
    '': ' '
};

var AminoBox = function (_React$Component5) {
    _inherits(AminoBox, _React$Component5);

    function AminoBox(props) {
        _classCallCheck(this, AminoBox);

        var _this9 = _possibleConstructorReturn(this, (AminoBox.__proto__ || Object.getPrototypeOf(AminoBox)).call(this, props));

        _this9.state = { bits: _this9.props.bits, advancing: 0 };
        _this9.canvasRef = React.createRef();

        _this9.onChange = _this9.onChange.bind(_this9);
        _this9.onKeyDown = _this9.onKeyDown.bind(_this9);
        _this9.textRef = React.createRef();
        return _this9;
    }

    _createClass(AminoBox, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            if (this.props.focused) {
                this.textRef.current.focus();
            }
        }
    }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate(prevProps, prevState) {
            var _state2 = this.state,
                bits = _state2.bits,
                advancing = _state2.advancing;

            if (prevState.bits != bits) {
                this.props.changeStateCallback(bits);
            }
            if (advancing != 0 && prevState.advancing == 0) {
                this.props.advanceTextFocusCallback(advancing);
            }
        }
    }, {
        key: 'onChange',
        value: function onChange(text) {
            var bits = text.target.value.toLowerCase().split('').filter(function (x) {
                return x >= 'a' && x <= 'z' || x >= 'A' && x <= 'Z';
            }).join('');
            if (text.target.value.endsWith(' ') || bits.length >= 3) {
                if (bits.length >= 3) {
                    bits = bits.substring(bits.length - 3);
                }
                this.setState({ bits: bits, advancing: 1 });
            } else {
                this.setState({ bits: bits });
            }
        }
    }, {
        key: 'onKeyDown',
        value: function onKeyDown(e) {
            if (e.keyCode == 8 && this.state.bits.length == 0) {
                this.setState({ advancing: -1 });
            }
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { className: 'code-box', style: { 'padding': '10px 10px' } },
                React.createElement(
                    'div',
                    null,
                    React.createElement('input', { type: 'text',
                        ref: this.textRef,
                        value: this.state.bits,
                        onChange: this.onChange,
                        onKeyDown: this.onKeyDown,
                        onFocus: this.props.acquireFocusCallback,
                        className: 'code-input-text code-input-amino'
                    })
                )
            );
        }
    }]);

    return AminoBox;
}(React.Component);

var MonkeyCodeComponent = function (_React$Component6) {
    _inherits(MonkeyCodeComponent, _React$Component6);

    function MonkeyCodeComponent(props) {
        _classCallCheck(this, MonkeyCodeComponent);

        var _this10 = _possibleConstructorReturn(this, (MonkeyCodeComponent.__proto__ || Object.getPrototypeOf(MonkeyCodeComponent)).call(this, props));

        var reverseLetterMap = {};
        for (var k in _this10.props.letterMap) {
            reverseLetterMap[_this10.props.letterMap[k]] = k;
        }
        reverseLetterMap[' '] = 'initValue' in _this10.props ? _this10.props.initValue : 0;

        _this10.state = { text: new Array(6).fill('initValue' in _this10.props ? _this10.props.initValue : 0),
            focus: 0,
            reverseLetterMap: reverseLetterMap };

        _this10.changeTextField = _this10.changeTextField.bind(_this10);
        return _this10;
    }

    _createClass(MonkeyCodeComponent, [{
        key: 'updateText',
        value: function updateText(ind) {
            return function (c) {
                var _this11 = this;

                this.setState(function (state, props) {
                    return { text: state.text.slice(0, ind).concat([c], state.text.slice(ind + 1)) };
                });
                if (ind >= this.state.text.length - 3) {
                    this.setState(function (state, props) {
                        return { text: state.text.concat(new Array(6).fill('initValue' in _this11.props ? _this11.props.initValue : 0)) };
                    });
                }
            }.bind(this);
        }
    }, {
        key: 'changeTextField',
        value: function changeTextField(text) {
            var _this12 = this;

            var textSplit = text.target.value.toUpperCase().split('');
            textSplit = textSplit.map(function (x) {
                return _this12.state.reverseLetterMap[x];
            });
            var len = 6 * Math.ceil((textSplit.length + 3) / 6);
            var diff = len - textSplit.length;
            textSplit = textSplit.concat(new Array(diff).fill('initValue' in this.props ? this.props.initValue : ' '));
            this.setState({ text: textSplit });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this13 = this;

            var Box = this.props.box;
            return React.createElement(
                'div',
                { className: 'monkey-component', style: { display: this.props.visible ? 'block' : 'none' } },
                React.createElement(
                    'div',
                    { className: 'code-text-div' },
                    React.createElement('input', { type: 'text',
                        value: this.state.text.map(function (i) {
                            return _this13.props.letterMap[i];
                        }).join('').trim(),
                        className: 'code-text ' + this.props.type + '-border',
                        onChange: this.changeTextField,
                        onClick: function onClick() {
                            return _this13.setState({ focus: -1 });
                        }
                    })
                ),
                this.props.tip && React.createElement(
                    'div',
                    { className: 'tip' },
                    this.props.tip
                ),
                React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'div',
                        { className: 'monkey-boxes monkey-boxes-' + this.props.type },
                        this.state.text.map(function (b, i) {
                            return React.createElement(Box, { key: i + '_' + b + '_' + (_this13.state.focus == i),
                                focused: _this13.state.focus == i,
                                bits: b,
                                changeStateCallback: _this13.updateText(i),
                                acquireFocusCallback: function acquireFocusCallback() {
                                    return _this13.setState({ focus: i });
                                },
                                advanceTextFocusCallback: function advanceTextFocusCallback(d) {
                                    return _this13.setState({ focus: i + d });
                                } });
                        })
                    )
                )
            );
        }
    }]);

    return MonkeyCodeComponent;
}(React.Component);

var SemaphoreComponent = function SemaphoreComponent(props) {
    return React.createElement(MonkeyCodeComponent, Object.assign({
        type: 'semaphore',
        box: SemaphoreBox,
        letterMap: semaphoreToCharMap
    }, props));
};

var BrailleComponent = function BrailleComponent(props) {
    return React.createElement(MonkeyCodeComponent, Object.assign({
        type: 'braille',
        box: BrailleBox,
        letterMap: brailleToCharMap
    }, props));
};

var MorseComponent = function MorseComponent(props) {
    return React.createElement(MonkeyCodeComponent, Object.assign({
        type: 'morse',
        box: MorseBox,
        tip: 'left hand to type a dot, right hand to type a dash',
        letterMap: morseToCharMap
    }, props));
};

var AminoComponent = function AminoComponent(props) {
    return React.createElement(MonkeyCodeComponent, Object.assign({
        type: 'amino',
        box: AminoBox,
        initValue: '',
        letterMap: aminoToCharMap
    }, props));
};

var CodeComponent = function (_React$Component7) {
    _inherits(CodeComponent, _React$Component7);

    function CodeComponent(props) {
        _classCallCheck(this, CodeComponent);

        var _this14 = _possibleConstructorReturn(this, (CodeComponent.__proto__ || Object.getPrototypeOf(CodeComponent)).call(this, props));

        _this14.state = { codeType: 'semaphore' };
        return _this14;
    }

    _createClass(CodeComponent, [{
        key: 'render',
        value: function render() {
            var _this15 = this;

            return React.createElement(
                'div',
                null,
                React.createElement(CodeTypeChooser, { selected: this.state.codeType,
                    callback: function callback(codeType) {
                        return _this15.setState({ codeType: codeType });
                    } }),
                React.createElement(
                    'div',
                    { className: 'code-outside' },
                    React.createElement(SemaphoreComponent, { visible: this.state.codeType == 'semaphore' }),
                    React.createElement(BrailleComponent, { visible: this.state.codeType == 'braille' }),
                    React.createElement(MorseComponent, { visible: this.state.codeType == 'morse' }),
                    React.createElement(AminoComponent, { visible: this.state.codeType == 'amino' })
                )
            );
        }
    }]);

    return CodeComponent;
}(React.Component);

var domContainer = document.querySelector('#code_container');
ReactDOM.render(React.createElement(CodeComponent), domContainer);